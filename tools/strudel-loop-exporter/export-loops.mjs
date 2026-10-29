#!/usr/bin/env node
// Strudel loop exporter
// Renders every part listed in a workbench file's `// @export` lines to
// 24-bit WAV loops in a library folder, using Strudel's own offline renderer
// (the same code as strudel.cc's export tab), then updates library.csv.
//
// Usage:
//   node export-loops.mjs <workbench.strudel.js> [options]
//
// Options:
//   --kit <dir>        sample kit folder (default: the workbench's @kit line,
//                      else liquid-kit next to the workbench)
//   --library <dir>    library folder (default: the workbench's @library line,
//                      else Library next to the workbench)
//   --only a,b,c       export only these parts
//   --sr <hz>          sample rate (default 48000, to match your Waveform project)
//   --list             show the parts that would be exported, then stop
//
// Workbench metadata (comment lines in the .strudel.js file):
//   // @track Daybreak
//   // @group drums
//   // @key Eb
//   // @kit ../Waveform/D_B Essentials/liquid-kit     (relative to the workbench)
//   // @library ../Library
//   // @export kick_A 8 loop       <part> <bars> <loop|oneshot>
//   // @export fill_big 1 oneshot
//
// loop:    rendered seamlessly: the tails from the end of the loop are wrapped
//          round to its start, exactly as when it repeats in Waveform.
// oneshot: rendered from silence, with one extra bar so tails ring out
//          (trailing silence is trimmed).

import { createServer } from 'node:http';
import { createReadStream, existsSync, mkdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, join, resolve, sep, basename, extname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));

// ------------------------------------------------------------------ args
const argv = process.argv.slice(2);
const flag = (name) => {
  const i = argv.indexOf(name);
  if (i === -1) return undefined;
  const v = argv[i + 1];
  return v === undefined || v.startsWith('--') ? true : v;
};
const workbench = argv.find((a) => !a.startsWith('--') && !argv[argv.indexOf(a) - 1]?.startsWith('--'));
if (!workbench || flag('--help')) {
  console.log(readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').slice(1, 30).join('\n'));
  process.exit(workbench ? 0 : 1);
}
const wbPath = resolve(workbench);
if (!existsSync(wbPath)) fail(`Can't find ${wbPath}`);
const wbDir = dirname(wbPath);
const srcText = readFileSync(wbPath, 'utf8');
const metaPath = (key) => { const m = srcText.match(new RegExp(`^\\s*//\\s*@${key}\\s+(.+?)\\s*$`, 'm')); return m && resolve(wbDir, m[1]); };
// folders: command-line option > @kit / @library line in the workbench > next to the workbench
const kitDir = resolve(flag('--kit') || metaPath('kit') || join(wbDir, 'liquid-kit'));
const libDir = resolve(flag('--library') || metaPath('library') || join(wbDir, 'Library'));
const sampleRate = Number(flag('--sr') || 48000);
const only = typeof flag('--only') === 'string' ? flag('--only').split(',').map((s) => s.trim()) : null;

function fail(msg) { console.error(`\n✖ ${msg}\n`); process.exit(1); }

// ------------------------------------------------------------------ metadata
const source = readFileSync(wbPath, 'utf8');
const meta = (key) => (source.match(new RegExp(`^\\s*//\\s*@${key}\\s+(.+?)\\s*$`, 'm')) || [])[1];
const track = meta('track') || basename(wbPath).replace(/\.strudel\.js$|\.js$/, '');
const group = meta('group') || 'parts';
const key = meta('key') || '';
const parts = [...source.matchAll(/^\s*\/\/\s*@export\s+(\S+)\s+(\d+(?:\.\d+)?)(?:\s+(loop|oneshot)\b)?.*$/gm)]
  .map((m) => ({ name: m[1], bars: Number(m[2]), type: m[3] || 'loop' }))
  .filter((p) => !only || only.includes(p.name));
if (!parts.length) fail(`No "// @export <part> <bars> <loop|oneshot>" lines found${only ? ' matching --only' : ''} in ${basename(wbPath)}`);
const PART_RE = /const\s+PART\s*=\s*(['"])[^'"]*\1/;
const codeOnly = source.replace(/^\s*\/\/.*$/gm, '');          // ignore comment lines
const usedInCode = (name) => codeOnly.includes(`'${name}'`) || codeOnly.includes(`"${name}"`);
if (!PART_RE.test(source)) fail(`The workbench needs a line like: const PART = 'grooveA'`);

// tempo: read setcpm(...) so file names carry the BPM
let bpm = Number(meta('bpm')) || null;
if (!bpm) {
  const m = source.match(/setcpm\(\s*([0-9.\s/*+-]+)\s*\)/);
  if (m) { try { bpm = Math.round(Function(`return (${m[1]})`)() * 4); } catch {} }
}

console.log(`\nStrudel loop exporter`);
console.log(`  workbench : ${wbPath}`);
console.log(`  track     : ${track}   group: ${group}${key ? `   key: ${key}` : ''}   bpm: ${bpm ?? '?'}`);
console.log(`  kit       : ${existsSync(kitDir) ? kitDir : `${kitDir}  (not found: sample sounds will be silent)`}`);
console.log(`  library   : ${libDir}`);
console.log(`  parts     : ${parts.map((p) => `${p.name}(${p.bars}${p.type === 'oneshot' ? ', one-shot' : ''})`).join(' ')}\n`);
if (flag('--list')) process.exit(0);

// ------------------------------------------------------------------ kit index (same rules as @strudel/sampler)
const AUDIO = ['wav', 'mp3', 'ogg'];
const isAudio = (f) => AUDIO.includes(f.split('.').pop().toLowerCase());
async function listFiles(dir) {
  let out = [];
  for (const d of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, d.name);
    if (d.isDirectory()) { if (!d.name.startsWith('.')) out = out.concat((await listFiles(full)).filter(isAudio)); }
    else if (isAudio(full)) out.push(full);
  }
  return out;
}
async function kitBanks() {
  if (!existsSync(kitDir)) return {};
  const root = kitDir.split(sep).join('/');
  const banks = {};
  for (let p of await listFiles(kitDir)) {
    p = p.split(sep).join('/');
    const sub = p.replace(root, '');
    const bank = p.split('/').slice(-2)[0];
    (banks[bank] ||= []).push(sub);
  }
  return banks;
}

// ------------------------------------------------------------------ local server: renderer page, Strudel engine, kit
const MIME = { '.html': 'text/html', '.mjs': 'text/javascript', '.js': 'text/javascript',
  '.wav': 'audio/wav', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.json': 'application/json' };
const strudelDist = join(HERE, 'node_modules', '@strudel', 'web', 'dist');
const server = createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const url = decodeURIComponent(req.url.split('?')[0]);
  if (process.env.LOG) console.log(`    [server] ${url}`);
  let file;
  if (url === '/' || url === '/index.html') file = join(HERE, 'render-page.html');
  else if (url.startsWith('/strudel/')) file = join(strudelDist, url.slice('/strudel/'.length));
  else if (url === '/kit/' || url === '/kit') {
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify(await kitBanks()));
  } else if (url.startsWith('/kit/')) file = join(kitDir, url.slice('/kit/'.length).split('/').join(sep));
  const safe = file && (file.startsWith(HERE) || file.startsWith(kitDir));
  if (!safe || !existsSync(file) || statSync(file).isDirectory()) { res.statusCode = 404; return res.end('not found'); }
  res.setHeader('Content-Type', MIME[extname(file).toLowerCase()] || 'application/octet-stream');
  createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;

// ------------------------------------------------------------------ browser
let chromium;
try { ({ chromium } = await import('playwright')); }
catch { fail('Playwright is not installed. In this folder run:  npm install   then   npx playwright install chromium'); }
let browser;
try {
  const opts = { headless: true, args: ['--autoplay-policy=no-user-gesture-required'] };
  if (process.env.CHROMIUM_PATH) opts.executablePath = process.env.CHROMIUM_PATH;
  browser = await chromium.launch(opts);
} catch (e) {
  server.close();
  fail(`Couldn't start the hidden browser. Run once:  npx playwright install chromium\n  (${e.message.split('\n')[0]})`);
}
const page = await browser.newPage();
const pageErrors = [];
page.on('pageerror', (e) => pageErrors.push(e.message));
async function freshEngine() {
  await page.goto(base + '/');
  await page.waitForFunction(() => window.rendererReady === true, null, { timeout: 60000 }).catch(() => {
    fail(`The Strudel engine didn't load in the hidden browser.${pageErrors.length ? '\n  ' + pageErrors.join('\n  ') : ''}`);
  });
}
await freshEngine();

// ------------------------------------------------------------------ wav + analysis helpers
const decode = (b64) => { const b = Buffer.from(b64, 'base64'); return new Float32Array(b.buffer, b.byteOffset, b.byteLength / 4); };
function wav24(channels, sr) {
  const n = channels[0].length, ch = channels.length, bps = 3;
  const buf = Buffer.alloc(44 + n * ch * bps);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + n * ch * bps, 4); buf.write('WAVE', 8);
  buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(ch, 22);
  buf.writeUInt32LE(sr, 24); buf.writeUInt32LE(sr * ch * bps, 28); buf.writeUInt16LE(ch * bps, 32); buf.writeUInt16LE(24, 34);
  buf.write('data', 36); buf.writeUInt32LE(n * ch * bps, 40);
  let o = 44, clipped = 0;
  for (let i = 0; i < n; i++) for (let c = 0; c < ch; c++) {
    let v = channels[c][i];
    if (v > 1 || v < -1) { clipped++; v = Math.max(-1, Math.min(1, v)); }
    let s = Math.round(v * 8388607);
    buf.writeIntLE(s, o, 3); o += 3;
  }
  return { buf, clipped };
}
const peakOf = (chs) => chs.reduce((m, c) => { for (const v of c) { const a = Math.abs(v); if (a > m) m = a; } return m; }, 0);
const dbfs = (x) => (x > 0 ? 20 * Math.log10(x) : -Infinity);

// ------------------------------------------------------------------ render each part
const groupDir = join(libDir, track, group);
mkdirSync(groupDir, { recursive: true });
const results = [];
for (const p of parts) {
  const code = source.replace(PART_RE, `const PART = '${p.name}'`);
  const wrap = p.type === 'loop';
  // loops: render two passes and keep the second, so tails from the end
  // wrap round to the start. one-shots: one pass plus one bar for tails.
  const onsetsTo = wrap ? p.bars * 2 : p.bars;
  const timelineEnd = wrap ? p.bars * 2 : p.bars + 1;
  process.stdout.write(`  ${p.name.padEnd(14)} `);
  // long parts are rendered in chunks (fresh engine each), then summed
  // together with each chunk's tails ringing on into the next
  const CHUNK = Number(process.env.EXPORT_CHUNK) || 16;
  let timeline = null, spb = 0, cps = 0, warnings = [], failed = null;
  for (let from = 0; from < onsetsTo && !failed; from += CHUNK) {
    const args = { code, kitUrl: base + '/kit/', sampleRate, tail: 1,
      onsetsFrom: from, onsetsBefore: Math.min(from + CHUNK, onsetsTo), renderTo: timelineEnd };
    let r;
    try {
      // every chunk gets a freshly loaded engine, so nothing left over from
      // the previous render (audio context, effect nodes) can leak into it.
      // If the engine still reports a cross-context error, render it once more.
      for (let attempt = 1; attempt <= 2; attempt++) {
        await freshEngine();
        r = await page.evaluate((a) => window.renderPart(a), args);
        if (!r.warnings.some((w) => /different audio context/i.test(w))) break;
      }
    } catch (e) { failed = e; break; }
    if (!timeline) {
      cps = r.cps; spb = Math.round(sampleRate / cps);       // samples per bar (cycle)
      timeline = [0, 1].map(() => new Float32Array(Math.round(timelineEnd * sampleRate / cps)));
    }
    const off = Math.round(r.begin * sampleRate / cps);
    const chunk = r.channels.map(decode);
    for (let c = 0; c < 2; c++) {
      const src = chunk[Math.min(c, chunk.length - 1)], dst = timeline[c];
      for (let i = 0; i < src.length && off + i < dst.length; i++) dst[off + i] += src[i];
    }
    warnings.push(...r.warnings);
    if (onsetsTo > CHUNK) process.stdout.write('.');
  }
  if (failed) {
    console.log(`✖ ${failed.message.split('\n')[0]}`);
    results.push({ part: p, error: failed.message });
    continue;
  }
  const r = { warnings: [...new Set(warnings)] };
  let chs = timeline;
  if (wrap) chs = chs.map((c) => c.slice(p.bars * spb, p.bars * 2 * spb));
  else {
    // trim trailing silence below -90 dBFS after the part's own length
    const min = p.bars * spb, thr = 10 ** (-90 / 20);
    let last = min;
    for (let i = chs[0].length - 1; i >= min; i--) if (chs.some((c) => Math.abs(c[i]) > thr)) { last = i + 1; break; }
    chs = chs.map((c) => c.slice(0, Math.max(min, last)));
  }
  const peak = dbfs(peakOf(chs));
  const fname = `${p.name}_${p.bars}${p.bars === 1 ? 'bar' : 'bars'}_${bpm ?? 'x'}.wav`;
  const out = join(groupDir, fname);
  const { buf, clipped } = wav24(chs, sampleRate);
  writeFileSync(out, buf);
  const secs = chs[0].length / sampleRate;
  const notes = [];
  if (peak < -80) notes.push('SILENT: check sound names / kit folder');
  else if (clipped) notes.push(`CLIPPED ${clipped} samples: lower the gain`);
  else if (peak > -1) notes.push('hot: peaks above -1 dBFS');
  if (!usedInCode(p.name)) notes.push(`'${p.name}' isn't used anywhere in the code (typo in the @export line?)`);
  if (r.warnings.length) notes.push(...r.warnings.slice(0, 3));
  console.log(`${onsetsTo > CHUNK ? ' ' : ''}✔ ${fname}  ${secs.toFixed(2)}s  peak ${peak === -Infinity ? '-inf' : peak.toFixed(1)} dBFS${notes.length ? '  ⚠ ' + notes.join(' | ') : ''}`);
  results.push({ part: p, file: out, fname, secs, peak, clipped, notes,
    hash: createHash('sha256').update(code).digest('hex').slice(0, 12) });
}
await browser.close();
server.close();

// ------------------------------------------------------------------ catalogue (library.csv), upserted by file
const csvPath = join(libDir, 'library.csv');
const cols = ['file', 'track', 'group', 'part', 'type', 'bars', 'bpm', 'key', 'sample_rate', 'bit_depth',
  'length_s', 'peak_dbfs', 'source', 'code_hash', 'exported_at'];
const esc = (v) => { v = String(v ?? ''); return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v; };
const parseCsv = (txt) => {
  const rows = []; let row = [], f = '', q = false;
  for (let i = 0; i < txt.length; i++) {
    const ch = txt[i];
    if (q) { if (ch === '"' && txt[i + 1] === '"') { f += '"'; i++; } else if (ch === '"') q = false; else f += ch; }
    else if (ch === '"') q = true;
    else if (ch === ',') { row.push(f); f = ''; }
    else if (ch === '\n') { row.push(f.replace(/\r$/, '')); rows.push(row); row = []; f = ''; }
    else f += ch;
  }
  if (f || row.length) { row.push(f); rows.push(row); }
  return rows;
};
const existing = new Map();
if (existsSync(csvPath)) {
  const [head, ...rows] = parseCsv(readFileSync(csvPath, 'utf8'));
  for (const r of rows) if (r.length > 1) existing.set(r[0], Object.fromEntries(head.map((h, i) => [h, r[i]])));
}
const now = new Date().toISOString().replace(/\.\d+Z$/, 'Z');
for (const r of results.filter((x) => x.file)) {
  const rel = relative(libDir, r.file).split(sep).join('/');
  existing.set(rel, { file: rel, track, group, part: r.part.name, type: r.part.type, bars: r.part.bars, bpm: bpm ?? '',
    key, sample_rate: sampleRate, bit_depth: 24, length_s: r.secs.toFixed(3),
    peak_dbfs: r.peak === -Infinity ? '-inf' : r.peak.toFixed(1), source: basename(wbPath), code_hash: r.hash, exported_at: now });
}
const lines = [cols.join(','), ...[...existing.values()].sort((a, b) => a.file.localeCompare(b.file)).map((row) => cols.map((c) => esc(row[c])).join(','))];
writeFileSync(csvPath, lines.join('\r\n') + '\r\n');

const ok = results.filter((r) => r.file).length, bad = results.length - ok;
const warn = results.filter((r) => r.notes?.length).length;
console.log(`\n${ok} exported to ${groupDir}${bad ? `, ${bad} failed` : ''}${warn ? `, ${warn} with warnings (see ⚠ above)` : ''}`);
console.log(`Catalogue: ${csvPath}\n`);
process.exit(bad ? 1 : 0);
