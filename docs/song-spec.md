# Song spec and QA

Each track has a **spec** (`Strudel/<track>.song.json`) next to its workbench. The spec is the plan: key, chords, sections, fills and drops. Anyone writing parts, whether you, Claude or an agent, works to it, and `qa.mjs` checks the code against it.

```powershell
cd C:\HomeProjects\jazzy-liquid-dnb\Strudel
..\tools\strudel-loop-exporter\qa.cmd track2.song.json
```

QA prints a summary, writes `qa/<title>.md`, and exits 1 if anything fails. It takes about 10 s and renders no audio: it evaluates the code with Strudel's own engine and lists every note in bars 1 to `bars`.

## What it checks

| Check | Passes when |
|---|---|
| timing | no negative `.nudge()`; the music runs to the last bar |
| structure | each section's `has` parts sound in at least ¾ of its bars (rests for fills are fine); its `not` parts never sound |
| fills | `smallPart` / `bigPart` play on exactly the listed bars; big-fill bars have no `beat` parts underneath |
| gaps | in the second half of each gap bar, only the `allowed` parts start notes |
| drops | `impactPart` hits beat 1 of each drop bar |
| harmony | every note of the `pitchedParts` is a chord tone or tension of **every** bar it rings over; `bassPart` plays the chord's `bass` note |
| audio | from `Library/library.csv`: exported loops aren't silent or clipping, peaks ≤ `mix.maxPeakDbfs`, and each loop's code hash still matches the current code (if not, re-export) |

It can't judge taste: whether the voicing is nice, the groove feels right, or the mix sits. Those are for your ears.

## Format

```jsonc
{
  "title": "Track2",                       // report name: qa/track2.md
  "workbench": "track2.strudel.js",        // relative to the spec
  "bpm": 174, "beatsPerBar": 4, "bars": 128, "key": "A minor",

  "harmony": {
    "repeatEvery": 16,                     // progression length in bars
    "chords": [                            // bars are 1-based, inclusive, within one pass
      { "bars": [1, 2], "symbol": "Am", "tones": ["A","C","E"], "tensions": ["B","D","G"], "bass": "A" }
    ],
    "pitchedParts": ["piano_rh", "piano_lh", "pad", "bass"],
    "bassPart": "bass"
  },
  "groups": { "beat": ["kick_A", "kick_B", "snare", "ghost"] },   // a name usable in has/not
  "sections": [
    { "name": "intro", "bars": [1, 16], "has": ["piano_rh"], "not": ["beat", "bass"] }
  ],
  "fills": { "small": [24, 40], "big": [32, 48], "smallPart": "fill_small", "bigPart": "fill_big" },
  "gaps":  { "bars": [16, 80], "allowed": ["revhit", "air"] },
  "drops": { "bars": [17, 81], "impactPart": "impact" },
  "mix":   { "maxPeakDbfs": -1, "silentBelowDbfs": -80 }
}
```

Requirements on the workbench: a `const PART = ...` line with a `'song'` mode, and every layer written as `$: part('name', ...)` (QA uses the names to tell layers apart). Every part named in the spec must exist in the code.

**Tensions** are where the jazz lives. List the colour notes you're happy to hear over each chord (9ths, 11ths, 13ths). Anything outside tones + tensions is flagged as a wrong note, so a deliberate passing tone or chromatic approach means adding it to that chord's tensions.

## Workflow with agents

1. **Composer:** writes or edits the spec (sections, chords, fills) from your idea.
2. **Part writers:** write `$: part(...)` layers in the workbench to fit the spec.
3. **QA:** `qa.cmd` until it passes, then the exporter, then QA again (it now also checks levels and that the loops are current).
4. **You:** listen, arrange and mix in Waveform; change the spec when your ears disagree with the plan.
