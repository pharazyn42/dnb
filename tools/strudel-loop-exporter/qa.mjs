#!/usr/bin/env node
// Song QA: checks a track's Strudel code against its song spec, and its
// exported loops against the mix targets. Objective checks only; taste is
// still for your ears.
//
// Usage (from the Strudel folder):
//   node ..\tools\strudel-loop-exporter\qa.mjs track2.song.json
//   (or qa.cmd track2.song.json)
//
// Checks
//   structure  every section has the parts it should, and none it shouldn't
//   fills      small/big fills on exactly the planned bars; big fills replace the beat
//   gaps       the breath before each drop is clear
//   drops      the impact lands on beat 1 of each drop
//   harmony    every note of the pitched parts fits the chord of its bar;
//              the bass plays the chord's bass note
//   timing     nothing before bar 1 or after the last bar
//   audio      exported loops: not silent, not clipping, peaks under the target
//
// Writes a report to qa/<title>.md in the repo, and exits 1 if anything failed.

import { createServer } from 'node:http';
import { createReadStream, existsSync, readFileSync, writeFileSync, mkdirSync, statSync } from 'node:fs';
import { dirname, join, resolve, extname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const HERE = dirname(fileURLToPath(import.meta.url));
const fail = (msg) => { console.error(`\n✖ ${msg}\n`); process.exit(2); };

// ------------------------------------------------------------------ inputs
const specArg = process.argv[2];
if (!specArg) fail('Usage: qa.mjs <track>.song.json');
const specPath = resolve(specArg);
if (!existsSync(specPath)) fail(`Can't find ${specPath}`);
const spec = JSON.parse(readFileSync(specPath, 'utf8'));
const specDir = dirname(specPath);
const wbPath = resolve(specDir, spec.workbench);
if (!existsSync(wbPath)) fail(`Spec points at ${spec.workbench}, which doesn't exist next to the spec`);
const source = readFileSync(wbPath, 'utf8');
const PART_RE = /const\s+PART\s*=\s*(['"])[^'"]*\1/;
if (!PART_RE.test(source)) fail(`${basename(wbPath)} needs a line like: const PART = 'song'`);
const code = source.replace(PART_RE, `const PART = 'song'`);
// layer names, in order, from the `$: part('name', ...)` convention
const layerNames = [...source.matchAll(/^\s*\$:\s*part\(\s*(['"])([^'"]+)\1/gm)].map((m) => m[2]);
const layerCount = [...source.matchAll(/^\s*\$:/gm)].length;
if (layerNames.length !== layerCount) {
  fail(`Every layer must be written as  $: part('name', ...)  so QA can tell parts apart (${layerNames.length} named of ${layerCount} layers)`);
}
const BARS = spec.bars;

// ------------------------------------------------------------------ evaluate in Strudel's engine (hidden browser)
const strudelDist = join(HERE, 'node_modules', '@strudel', 'web', 'dist');
const MIME = { '.html': 'text/html', '.mjs': 'text/javascript', '.js': 'text/javascript' };
const server = createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  let file = null;
  if (url === '/' || url === '/index.html') file = join(HERE, 'render-page.html');
  else if (url.startsWith('/strudel/')) file = join(strudelDist, url.slice('/strudel/'.length));
  if (!file || !file.startsWith(HERE) || !existsSync(file) || statSync(file).isDirectory()) { res.statusCode = 404; return res.end(); }
  res.setHeader('Content-Type', MIME[extname(file)] || 'application/octet-stream');
  createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
let chromium;
try { ({ chromium } = await import('playwright')); } catch { fail('Playwright missing: run  npm install  in tools/strudel-loop-exporter'); }
const opts = { headless: true };
if (process.env.CHROMIUM_PATH) opts.executablePath = process.env.CHROMIUM_PATH;
const browser = await chromium.launch(opts).catch((e) => fail(`Couldn't start the hidden browser: ${e.message.split('\n')[0]}`));
const page = await browser.newPage();
const pageErrors = [];
page.on('pageerror', (e) => pageErrors.push(e.message));
await page.goto(`http://127.0.0.1:${server.address().port}/`);
await page.waitForFunction(() => window.rendererReady === true, null, { timeout: 60000 })
  .catch(() => fail(`Strudel engine didn't load. ${pageErrors.join(' ')}`));
let layerHaps;
try {
  layerHaps = await page.evaluate((a) => window.inspectCode(a), { code, from: 0, to: BARS });
} catch (e) {
  await browser.close(); server.close();
  fail(`The code didn't evaluate: ${e.message.split('\n')[0]}`);
}
await browser.close();
server.close();

// parts -> list of notes {t, end (cycles from 0), bar (1-based start bar),
// sounding: [bars the note is held over], s, midi, nudge (seconds)}
const parts = {};
layerHaps.forEach((haps, i) => {
  const name = layerNames[i];
  (parts[name] ||= []).push(...haps.map(([t, end, s, midi, nudge]) => {
    const bar = Math.floor(t + 1e-9) + 1, last = Math.max(bar, Math.ceil(end - 1e-9));
    return { t, end, bar, sounding: Array.from({ length: last - bar + 1 }, (_, k) => bar + k), s, midi, nudge };
  }));
});
const known = new Set(Object.keys(parts));

// ------------------------------------------------------------------ helpers
const results = [];   // { check, status: 'pass'|'warn'|'fail', detail }
const add = (check, status, detail) => results.push({ check, status, detail });
const expand = (name) => (spec.groups && spec.groups[name]) ? spec.groups[name] : [name];
const barsWith = (names) => {
  const s = new Set();
  for (const n of names) for (const h of parts[n] || []) for (const b of h.sounding) s.add(b);
  return s;
};
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
const fmtBars = (list) => {
  if (!list.length) return '';
  const out = []; let s = list[0], p = list[0];
  for (const b of list.slice(1)) { if (b === p + 1) { p = b; continue; } out.push(s === p ? `${s}` : `${s}-${p}`); s = p = b; }
  out.push(s === p ? `${s}` : `${s}-${p}`);
  return out.join(', ');
};
const PC = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };
const PCNAME = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
const noteName = (m) => `${PCNAME[((m % 12) + 12) % 12]}${Math.floor(m / 12) - 1}`;

// referenced part names must exist
for (const name of new Set([
  ...(spec.sections || []).flatMap((s) => [...(s.has || []), ...(s.not || [])].flatMap(expand)),
  ...(spec.harmony?.pitchedParts || []),
  spec.fills?.smallPart, spec.fills?.bigPart, spec.drops?.impactPart,
].filter(Boolean))) {
  if (!known.has(name)) add('spec', 'fail', `the spec mentions part '${name}', but the code has no $: part('${name}', ...)`);
}

// ------------------------------------------------------------------ timing
{
  // the song pattern loops, so only bars 1..BARS are queried; what can still go
  // wrong is a negative nudge (lands before its bar, or before bar 1) and a song
  // that ends early or runs on
  const neg = new Set();
  for (const [n, hs] of Object.entries(parts)) if (hs.some((h) => h.nudge < 0)) neg.add(n);
  if (neg.size) add('timing', 'fail', `negative .nudge() in: ${[...neg].join(', ')} (notes would land early; keep offsets positive)`);
  else add('timing', 'pass', 'all timing offsets are positive');
  const lastBar = Math.max(0, ...Object.values(parts).flat().map((h) => h.bar));
  if (lastBar < BARS) add('timing', 'fail', `the song stops after bar ${lastBar}, but the spec says ${BARS} bars`);
  else add('timing', 'pass', `music runs to bar ${BARS}`);
  const runOn = Object.entries(parts).filter(([, hs]) => hs.some((h) => h.end > BARS + 1e-9)).map(([n]) => n);
  if (runOn.length) add('timing', 'warn', `notes held past bar ${BARS} in: ${runOn.join(', ')} (cut off at the end of the song)`);
}

// ------------------------------------------------------------------ structure
for (const sec of spec.sections || []) {
  const [a, b] = sec.bars, all = range(a, b);
  for (const req of sec.has || []) {
    const on = barsWith(expand(req));
    const missing = all.filter((x) => !on.has(x));
    // a part counts as present if it plays in most of the section; gaps for
    // fills and breaths are expected, so allow a quarter of the bars to be empty
    if (missing.length > all.length / 4) add('structure', 'fail', `${sec.name} (bars ${a}-${b}): '${req}' is missing in bars ${fmtBars(missing)}`);
    else add('structure', 'pass', `${sec.name}: '${req}' present${missing.length ? ` (rests in ${fmtBars(missing)})` : ''}`);
  }
  for (const ban of sec.not || []) {
    const on = barsWith(expand(ban));
    const hits = all.filter((x) => on.has(x));
    if (hits.length) add('structure', 'fail', `${sec.name} (bars ${a}-${b}): '${ban}' shouldn't play, but does in bars ${fmtBars(hits)}`);
    else add('structure', 'pass', `${sec.name}: no '${ban}'`);
  }
}

// ------------------------------------------------------------------ fills
if (spec.fills) {
  const { small = [], big = [], smallPart, bigPart } = spec.fills;
  for (const [label, part, want] of [['small', smallPart, small], ['big', bigPart, big]]) {
    if (!part || !known.has(part)) continue;
    const got = [...barsWith([part])].sort((x, y) => x - y);
    const extra = got.filter((x) => !want.includes(x)), missing = want.filter((x) => !got.includes(x));
    if (extra.length || missing.length) {
      add('fills', 'fail', `${label} fills: planned on ${fmtBars(want)}; ${missing.length ? `missing on ${fmtBars(missing)}` : ''}${missing.length && extra.length ? '; ' : ''}${extra.length ? `extra on ${fmtBars(extra)}` : ''}`);
    } else add('fills', 'pass', `${label} fills on bars ${fmtBars(want)}`);
  }
  const beat = barsWith(expand('beat').filter((n) => known.has(n)));
  const clash = big.filter((x) => beat.has(x));
  if (clash.length) add('fills', 'fail', `big-fill bars ${fmtBars(clash)} still have the normal beat playing under the fill`);
  else if (big.length) add('fills', 'pass', 'big fills replace the beat');
}

// ------------------------------------------------------------------ gaps
if (spec.gaps) {
  const allowed = new Set(spec.gaps.allowed || []);
  for (const g of spec.gaps.bars) {
    const offenders = [];
    for (const [n, hs] of Object.entries(parts)) {
      if (allowed.has(n)) continue;
      if (hs.some((h) => h.t >= g - 0.5 - 1e-9 && h.t < g - 1e-9)) offenders.push(n);
    }
    if (offenders.length) add('gaps', 'fail', `bar ${g}: second half should be a breath, but ${offenders.join(', ')} start notes there`);
    else add('gaps', 'pass', `bar ${g}: breath before the drop is clear`);
  }
}

// ------------------------------------------------------------------ drops
if (spec.drops?.impactPart && known.has(spec.drops.impactPart)) {
  const hs = parts[spec.drops.impactPart];
  for (const d of spec.drops.bars) {
    if (hs.some((h) => Math.abs(h.t - (d - 1)) < 1e-6)) add('drops', 'pass', `bar ${d}: impact on beat 1`);
    else add('drops', 'fail', `bar ${d}: no impact on beat 1`);
  }
}

// ------------------------------------------------------------------ harmony
if (spec.harmony) {
  const H = spec.harmony, every = H.repeatEvery || BARS;
  const chordAt = (bar) => {
    const pos = ((bar - 1) % every) + 1;
    return H.chords.find((c) => pos >= c.bars[0] && pos <= c.bars[1]);
  };
  for (const name of H.pitchedParts || []) {
    if (!known.has(name)) continue;
    const wrong = [];
    let checked = 0;
    for (const h of parts[name]) {
      if (h.midi == null) continue;
      checked++;
      const pc = ((Math.round(h.midi) % 12) + 12) % 12;
      for (const b of h.sounding.filter((x) => x <= BARS)) {   // held notes must fit every chord they ring over
        const c = chordAt(b);
        if (!c) continue;
        const ok = new Set([...(c.tones || []), ...(c.tensions || [])].map((x) => PC[x]));
        if (!ok.has(pc)) wrong.push(`bar ${b}: ${noteName(Math.round(h.midi))} over ${c.symbol}`);
      }
    }
    if (!checked) add('harmony', 'warn', `${name}: no pitched notes found to check`);
    else if (wrong.length) add('harmony', 'fail', `${name}: ${wrong.length} note(s) outside the chord: ${wrong.slice(0, 6).join('; ')}${wrong.length > 6 ? ' ...' : ''}`);
    else add('harmony', 'pass', `${name}: all ${checked} notes fit their chords`);
  }
  if (H.bassPart && known.has(H.bassPart)) {
    const wrong = [];
    for (const h of parts[H.bassPart]) {
      const c = chordAt(h.bar);
      if (!c?.bass || h.midi == null) continue;
      if (((Math.round(h.midi) % 12) + 12) % 12 !== PC[c.bass]) wrong.push(`bar ${h.bar}: ${noteName(Math.round(h.midi))} under ${c.symbol} (expected ${c.bass})`);
    }
    if (wrong.length) add('harmony', 'fail', `bass line: ${wrong.length} wrong root(s): ${[...new Set(wrong)].slice(0, 6).join('; ')}`);
    else add('harmony', 'pass', 'bass plays the planned root of every chord');
  }
}

// ------------------------------------------------------------------ audio (exported loops)
{
  const wbHeader = (key) => (source.match(new RegExp(`^\\s*//\\s*@${key}\\s+(.+?)\\s*$`, 'm')) || [])[1];
  const libDir = resolve(dirname(wbPath), wbHeader('library') || 'Library');
  const csv = join(libDir, 'library.csv');
  const track = wbHeader('track') || spec.title;
  if (!existsSync(csv)) add('audio', 'warn', `no catalogue at ${csv}: export the loops to check levels`);
  else {
    const [head, ...rows] = readFileSync(csv, 'utf8').trim().split(/\r?\n/).map((l) => l.split(','));
    const col = (r, k) => r[head.indexOf(k)];
    const mine = rows.filter((r) => col(r, 'track') === track);
    if (!mine.length) add('audio', 'warn', `no exported loops for '${track}' in the catalogue yet`);
    const maxPeak = spec.mix?.maxPeakDbfs ?? -1, silent = spec.mix?.silentBelowDbfs ?? -80;
    for (const r of mine) {
      const peak = col(r, 'peak_dbfs') === '-inf' ? -Infinity : Number(col(r, 'peak_dbfs'));
      const f = col(r, 'file');
      if (peak < silent) add('audio', 'fail', `${f}: silent (${col(r, 'peak_dbfs')} dBFS)`);
      else if (peak > 0) add('audio', 'fail', `${f}: clipping (${peak} dBFS)`);
      else if (peak > maxPeak) add('audio', 'warn', `${f}: peaks at ${peak} dBFS, above the ${maxPeak} dBFS target`);
      else add('audio', 'pass', `${f}: peak ${peak} dBFS`);
    }
    // stale: the exporter stores a hash of each part's code; if today's code
    // hashes differently, the loop in Waveform no longer matches the code
    const stale = mine.filter((r) => {
      const now = createHash('sha256').update(source.replace(PART_RE, `const PART = '${col(r, 'part')}'`)).digest('hex').slice(0, 12);
      return col(r, 'code_hash') && col(r, 'code_hash') !== now;
    }).map((r) => col(r, 'part'));
    if (stale.length) add('audio', 'warn', `code changed since these were exported: ${stale.join(', ')} (re-export to keep Waveform in sync)`);
    else if (mine.length) add('audio', 'pass', 'every exported loop matches the current code');
  }
}

// ------------------------------------------------------------------ report
const icon = { pass: '✔', warn: '⚠', fail: '✖' };
const counts = { pass: 0, warn: 0, fail: 0 };
for (const r of results) counts[r.status]++;
const order = ['spec', 'timing', 'structure', 'fills', 'gaps', 'drops', 'harmony', 'audio'];
const lines = [];
lines.push(`# QA: ${spec.title}`, '', `Spec: \`${basename(specPath)}\`  ·  Code: \`${basename(wbPath)}\`  ·  ${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC`, '',
  `**${counts.fail ? 'FAILED' : 'PASSED'}:** ${counts.pass} passed, ${counts.warn} warnings, ${counts.fail} failed`, '');
for (const sec of order) {
  const rs = results.filter((r) => r.check === sec);
  if (!rs.length) continue;
  const bad = rs.filter((r) => r.status !== 'pass');
  lines.push(`## ${sec[0].toUpperCase() + sec.slice(1)}${bad.length ? '' : ' ✔'}`, '');
  for (const r of (bad.length ? bad : rs)) lines.push(`- ${icon[r.status]} ${r.detail}`);
  if (bad.length && rs.length > bad.length) lines.push(`- ✔ ${rs.length - bad.length} other check(s) passed`);
  lines.push('');
}
lines.push('_Objective checks only: whether it sounds good is still for your ears._', '');

// console summary
console.log(`\nQA: ${spec.title}  (${basename(wbPath)} vs ${basename(specPath)})\n`);
for (const sec of order) {
  const rs = results.filter((r) => r.check === sec);
  if (!rs.length) continue;
  const bad = rs.filter((r) => r.status !== 'pass');
  console.log(`  ${(bad.some((r) => r.status === 'fail') ? icon.fail : bad.length ? icon.warn : icon.pass)} ${sec.padEnd(10)} ${rs.length - bad.length}/${rs.length} ok`);
  for (const r of bad) console.log(`      ${icon[r.status]} ${r.detail}`);
}
console.log(`\n  ${counts.fail ? 'FAILED' : 'PASSED'}: ${counts.pass} passed, ${counts.warn} warnings, ${counts.fail} failed`);

// report file: repo-root/qa/<title>.md (repo root = two levels above this tool)
const repoRoot = resolve(HERE, '..', '..');
const qaDir = existsSync(join(repoRoot, 'Strudel')) ? join(repoRoot, 'qa') : join(specDir, 'qa');
mkdirSync(qaDir, { recursive: true });
const reportPath = join(qaDir, `${spec.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.md`);
writeFileSync(reportPath, lines.join('\n'));
console.log(`  Report: ${reportPath}\n`);
process.exit(counts.fail ? 1 : 0);
