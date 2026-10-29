# Strudel loop exporter

Renders every part of a Strudel workbench to a library of 24-bit WAV loops in one command, using **Strudel's own offline renderer**. It's the same code as the export tab on strudel.cc, so the loops sound exactly like what you hear in Strudel.

```
node export-loops.mjs daybreak-drums.strudel.js
```

```
Library\
  Daybreak\
    drums\
      kick_A_8bars_174.wav
      snare_8bars_174.wav
      roll_4bars_174.wav
      ...
  library.csv          catalogue of every loop (track, part, bars, BPM, key, peak, date...)
```

---

## One-time setup (Windows)

1. This folder lives at `C:\HomeProjects\jazzy-liquid-dnb\tools\strudel-loop-exporter`.
2. In PowerShell, inside that folder:
   ```powershell
   cd C:\HomeProjects\jazzy-liquid-dnb\tools\strudel-loop-exporter
   npm.cmd install
   npx.cmd playwright install chromium
   ```
   The second line downloads a private copy of Chromium (~150 MB) that the exporter uses as a hidden browser. It doesn't touch your normal Chrome.
   (If you changed PowerShell's execution policy, you can drop the `.cmd`.)

That's it. Node.js is the only other requirement, and you already have it.

---

## Exporting

From the folder where your workbench files live:

```powershell
cd C:\HomeProjects\jazzy-liquid-dnb\Strudel
..\tools\strudel-loop-exporter\export-loops.cmd daybreak-drums.strudel.js
```

The kit and library folders come from the workbench's `@kit` and `@library` lines (paths relative to the workbench file). Daybreak's point to:
- kit: `C:\HomeProjects\jazzy-liquid-dnb\Waveform\D_B Essentials\liquid-kit`
- library: `C:\HomeProjects\jazzy-liquid-dnb\Library`

Without those lines it looks for `liquid-kit` and `Library` next to the workbench. Override for one run with `--kit` and `--library`:

```powershell
...\export-loops.cmd daybreak-drums.strudel.js --kit D:\Samples\liquid-kit --library D:\Loops
```

### Options

| Option | What it does |
|---|---|
| `--only snare,hats` | Export only these parts (after tweaking one or two) |
| `--list` | Show what would be exported, without rendering |
| `--sr 44100` | Sample rate (default 48000, to match your Waveform project) |
| `--kit <folder>` | Sample kit folder |
| `--library <folder>` | Where the loops go |

You don't need to run `@strudel/sampler` for exporting: the exporter serves your kit itself, using the same folder rules, so `.n(11)` picks the same file. If your code has `samples('http://localhost:5432/')` at the top, that's handled automatically.

---

## The workbench metadata

The exporter reads comment lines at the top of the `.strudel.js` file:

```js
// @track Daybreak
// @group drums
// @key Eb
// @kit ../Waveform/D_B Essentials/liquid-kit
// @library ../Library
// @export kick_A      8  loop      anything after this is a note
// @export roll        4  oneshot
```

- **@track / @group** decide the folder: `Library\<track>\<group>\`.
- **@key** is recorded in the catalogue.
- **@kit / @library** are folders relative to the workbench file.
- **@export** `<part> <bars> <loop|oneshot>`, one line per part.
- The file needs a `const PART = '...'` line. The exporter sets it to each part name in turn, exactly like you switching it by hand.
- BPM comes from `setcpm(174/4)`, assuming 4 beats per bar.

### loop vs oneshot

- **loop:** for anything that repeats (beats, hats, chords). Rendered seamlessly: the tails at the end of the loop (a ringing hat, a reverb tail) are wrapped round to its start, exactly as they'd overlap when the loop repeats in Waveform. The file is exactly the stated number of bars.
- **oneshot:** for things you place once (fills, rolls, impacts). Rendered from silence, plus up to one extra bar so the last hits ring out naturally. Trailing silence is trimmed. Line up the file's start with the bar it belongs on.

---

## What it checks

After each part it prints the length and peak level, and warns about:

- **SILENT:** usually a sound name that isn't in your kit, or a wrong `--kit` folder
- **sound X not found:** a typo in a sound name in the code
- **'name' isn't used anywhere in the code:** the `@export` name doesn't match a `part('...')` name
- **hot / CLIPPED:** peaks above −1 dBFS or over 0 dBFS; lower the gain in the code

---

## In Waveform

Point Waveform's file browser at the `Library` folder. Set the project to 174 BPM with auto-tempo off, then drag loops onto bar lines. Every loop starts exactly on its first beat.

`library.csv` opens in Excel. Re-running the exporter updates the rows for re-exported parts and leaves the others alone. The `code_hash` column changes whenever the code that made a loop changes, so you can tell which loops are out of date.

---

## Notes

- Built on `@strudel/web` 1.3.0 (Strudel's published engine) and Playwright. Pinned versions mean an update to strudel.cc won't silently change your exports. To move to a newer Strudel later, change the version in `package.json` and run `npm.cmd install` again.
- Strudel is AGPL-3.0, so this tool is too. It doesn't affect your music.
- Sample licences still apply to what you export: keep `LICENCES.md` up to date.
