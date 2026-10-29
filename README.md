# dnb

Melodic, piano-led liquid drum & bass, written as code in [Strudel](https://strudel.cc), exported as loops, and arranged, mixed and mastered in Waveform Free.

## Layout

This repo **is** the project folder: clone or link it at `C:\HomeProjects\jazzy-liquid-dnb` so the paths inside the workbench files keep working.

```
Strudel/                   workbench + track files (.strudel.js)
  daybreak-drums.strudel.js   drums workbench: every drum part, humanised feel, export list
  track2.strudel.js           full track built from Andrew's piano idea (A–B–C–E figure)
  piano-idea-check.strudel.js transcription check of that idea
tools/strudel-loop-exporter/  renders every part of a workbench to 24-bit WAV loops
Library/library.csv        catalogue of exported loops (the WAVs themselves are not committed)
docs/
  workflow.md              free production workflow (Strudel → loops → Waveform → master)
  release-plan.md          catalogue-first release plan, licensing, YouTube/Spotify, income
  daybreak-mix-sheet.md    mix and master walkthrough
LICENCES.md                every sound, its source and licence. Update before any release.
CLAUDE.md                  conventions for Claude / agents working in this repo
```

**Not in the repo** (kept on the PC only): `Waveform/` (sample kit and Waveform projects), `Sounds/` (downloaded packs), `Tracks/` and `Library/**/*.wav` (rendered audio). Sample packs can't be redistributed, and audio is regenerated from code.

## Quick start

```powershell
# one-time: install the exporter
cd C:\HomeProjects\jazzy-liquid-dnb\tools\strudel-loop-exporter
npm.cmd install
npx.cmd playwright install chromium

# export a workbench's loops into Library\
cd C:\HomeProjects\jazzy-liquid-dnb\Strudel
..\tools\strudel-loop-exporter\export-loops.cmd daybreak-drums.strudel.js
..\tools\strudel-loop-exporter\export-loops.cmd track2.strudel.js
```

To play a file in strudel.cc: run the sampler in the kit folder
(`npx.cmd @strudel/sampler` inside `Waveform\D_B Essentials\liquid-kit`), then paste the file into Strudel.

## Connecting the existing PC folder to this repo

The PC folder already contains these files, so adopt the repo's history without touching anything:

```powershell
cd C:\HomeProjects\jazzy-liquid-dnb
git init -b main
git remote add origin https://github.com/pharazyn42/dnb.git
git fetch origin
git reset origin/main
git status    # should show nothing to commit; samples and audio are ignored
```
