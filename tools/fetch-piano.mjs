#!/usr/bin/env node
// Download Strudel's Salamander piano so it works offline, and optionally serve it.
//   node tools/fetch-piano.mjs [--out <dir>] [--serve] [--port 5433]
// Default out dir: ../strudel-samples (next to the repo, so audio is never committed).
// Then in a workbench use:  samples('http://localhost:5433/piano.json')
// Salamander Grand Piano by Alexander Holm, CC BY 3.0 (credit required).
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SOURCE = 'https://raw.githubusercontent.com/felixroos/dough-samples/main/piano.json';
const args = process.argv.slice(2);
const opt = (name, def) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : def;
};
const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.resolve(opt('--out', path.join(here, '..', '..', 'strudel-samples')));
const port = Number(opt('--port', 5433));
const serve = args.includes('--serve');

const TYPES = { '.json': 'application/json', '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.ogg': 'audio/ogg' };

async function get(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

async function download() {
  const map = JSON.parse((await get(SOURCE)).toString('utf8'));
  const base = map._base;
  const dir = path.join(out, 'piano');
  await fs.mkdir(dir, { recursive: true });

  const local = { _base: `http://localhost:${port}/piano/` };
  let fetched = 0, kept = 0;
  for (const [bank, notes] of Object.entries(map)) {
    if (bank === '_base') continue;
    local[bank] = {};
    for (const [note, file] of Object.entries(notes)) {
      local[bank][note] = file;
      const dest = path.join(dir, file);
      try {
        const st = await fs.stat(dest);
        if (st.size > 0) { kept++; continue; }
      } catch {}
      await fs.writeFile(dest, await get(new URL(file, base).href));
      fetched++;
      process.stdout.write(`\r${fetched + kept} files`);
    }
  }
  await fs.writeFile(path.join(out, 'piano.json'), JSON.stringify(local, null, 2));
  await fs.writeFile(
    path.join(out, 'CREDIT.txt'),
    'Salamander Grand Piano by Alexander Holm, CC BY 3.0.\nhttps://github.com/sfzinstruments/SalamanderGrandPiano\n',
  );
  console.log(`\nDone: ${fetched} downloaded, ${kept} already present -> ${out}`);
}

function serveDir() {
  http.createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    const rel = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    const file = path.join(out, path.normalize(rel));
    if (!file.startsWith(out)) { res.writeHead(403).end(); return; }
    try {
      const data = await fs.readFile(file);
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
      res.end(data);
    } catch {
      res.writeHead(404).end('not found');
    }
  }).listen(port, () => console.log(`Serving ${out} at http://localhost:${port}/ (Ctrl+C to stop)`));
}

await download();
if (serve) serveDir();
