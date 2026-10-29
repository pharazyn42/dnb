# CLAUDE.md: working in the dnb repo

Andrew writes melodic, piano-led liquid DnB (174 BPM) in Strudel, exports parts as loops, and arranges, mixes and masters in **Waveform Free on Windows**. He is a pianist (jazz voicings) and an engineer. He makes the musical decisions and does the listening; Claude writes the code, runs the exporter, measures and documents. **Claude cannot hear audio**: verify by measuring (timing, pitch, levels, lengths), and say plainly what still needs Andrew's ears.

## Folder conventions
- This repo mirrors `C:\HomeProjects\jazzy-liquid-dnb` on Andrew's PC.
- Kit (not in the repo): `Waveform/D_B Essentials/liquid-kit/<sound>/<files>`. Each subfolder name is a sound name; `.n(i)` picks the i-th file in folder order (0-based).
- Exported loops go to `Library/<track>/<group>/<part>_<bars>bars_<bpm>.wav`, catalogued in `Library/library.csv`.
- **Never commit samples or rendered audio** (licences forbid redistribution). Update `LICENCES.md` whenever a sound is added.

## Workbench file format (`Strudel/*.strudel.js`)
- Header comment lines read by the exporter:
  `// @track Name`, `// @group drums`, `// @key Am`, `// @kit ../Waveform/D_B Essentials/liquid-kit`, `// @library ../Library`,
  `// @export <part> <bars> <loop|oneshot>   free-text note`
- `setcpm(174/4)`: 4 beats per cycle, so 1 cycle = 1 bar.
- `const PART = '...'` selects what plays: a single part name (for export), a preview name, or `'song'` for a full arrangement. The exporter rewrites this line per part.
- Every layer is `$: part('name', pattern)`. `part()` returns `silence` unless `PART` matches, or a preview/song mask includes it.
- Loops are 8 or 16 bars (16 = one pass of a 2-bars-per-chord, 8-chord progression); fills 1 bar; rolls 4 bars.
- `_end` variants = the same loop with bar 8 silent, for a big fill in Waveform.

## Feel (humanisation): performance in Strudel, sound in Waveform
- Put timing, dynamics and hit-to-hit variation in Strudel; leave EQ, compression, saturation, reverb, panning and loudness to Waveform. Exports stay dry, centred and uncompressed, with `all(x => x.postgain(.8))` headroom.
- Timing uses **`.nudge(seconds)`**, never patterned `.late()`. Patterned `late` made queries ~4× slower. `nudge` is applied at play time to sample voices (drums, piano). Only positive offsets, so nothing lands before bar 1.
- Standard FEEL: swing 11 ms on off-8th hats, snare laid back 4 ms, drift 0–4 ms, kick dead on the grid as the anchor.
- Hats are one part (closed + open) so the open-hat choke is baked in.

## Strudel pitfalls (learned the hard way)
- **No `//` comments inside mini-notation strings** (backtick patterns): put labels outside the string.
- Strings built at runtime (e.g. bar masks) must be wrapped in **`mini(...)`**; only literal double-quoted strings are auto-parsed.
- `samples(...)` lines get `await`ed by the transpiler. Fine in Strudel and the exporter.
- Built-in drum machines (`.bank(...)`) and `gm_*` sounds are **not licence-clean**: use the kit. Strudel `piano` = Salamander (credit required). Load it explicitly:
  `samples('https://raw.githubusercontent.com/felixroos/dough-samples/main/piano.json')`.
- Noise layers click when notes restart: use long single notes or crossfading attack/release.

## Exporter (`tools/strudel-loop-exporter`)
- `export-loops.cmd <file> [--only a,b] [--list]`, run from `Strudel/`. It uses Strudel's own `renderPatternAudio` (@strudel/web 1.3.0) in headless Chromium: a fresh engine per chunk, parts over 16 bars rendered in 16-bar chunks, loops rendered seamlessly (tails wrap to the start), one-shots with one bar of tail.
- It serves the kit itself (same ordering rules as `@strudel/sampler`) and rewrites `samples('http://localhost:5432/')` to it.
- Output is 24-bit / 48 kHz stereo. It warns on silent parts, missing sounds, clipping and unused part names.

## Song spec and QA (`docs/song-spec.md`)
- Each full track has `Strudel/<track>.song.json`: key, chords (tones + allowed tensions + bass), sections (`has`/`not` parts), fills, gaps, drops, mix targets. It is the contract; write parts to fit it, and change the spec (not just the code) when the plan changes.
- `node tools/strudel-loop-exporter/qa.mjs Strudel/<track>.song.json` (`qa.cmd` on the PC) must pass before handing a track back. It writes `qa/<title>.md` and exits 1 on failure.
- QA needs every layer as `$: part('name', ...)` and a `'song'` PART mode. In the sandbox: set `CHROMIUM_PATH` and clear `HTTPS_PROXY` for the run.

## Verification before handing anything back
0. Run QA against the spec (above).
1. Evaluate the code with Strudel's engine (`@strudel/core`, `mini`, `tonal`, `transpiler`) and check what plays in each bar.
2. Render with the exporter, then measure: exact lengths, hit timing vs grid, pitches (FFT), peaks, section loudness, loop seams.
3. Report what was measured, and what Andrew still needs to judge by ear.

## Waveform gotchas (for instructions to Andrew)
- Set tempo to 174 **before** importing; untick Settings → General → Editing → "Detect tempo of imported audio files" (restart Waveform).
- Sidechain source: the `kick_A` / `kick_B` loop tracks (unmuted, can be turned down).
- Bus: select tracks → "Create Submix Containing".
