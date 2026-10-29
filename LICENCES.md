# Sound Licences

Every sound used in a released track must be listed here with its source and licence. If a sound can't be documented, it doesn't go in a release.

## Shared: liquid-kit

Location: `Waveform/D_B Essentials/liquid-kit/` (**not in this repo**: the licence forbids redistribution)

Source: **MusicRadar SampleRadar, "475 free drum 'n' bass essentials samples"**
Licence: royalty-free; use in your music any way you like; do **not** redistribute the samples.
Link: [Pack page](https://www.musicradar.com/news/sampleradar-drum-and-bass-essentials-samples)

| Strudel name | Used as | File (confirmed from exporter logs) |
|---|---|---|
| `kick` `.n(11)` | Kick | `kick/D_B Kick 12.wav` |
| `snare` `.n(13)` | Snare, ghosts, fills, rolls | `snare/D_B Snare 14.wav` |
| `hat` `.n(7)` | Closed hat, 16th ticks | `hat/D_B Hat 08.wav` |
| `ohat` `.n(3)` | Open hat | `ohat/Jungle Hat 04.wav` |
| `revhit` `.n(0)` | Reverse hit into drops | `revhit/Rev Hit 01.wav` |
| `subdrop` | Drop impact | `subdrop/Sub Drop.wav` (pack's `FX/` folder) |
| `crash` `.n(0)` | Crashes | `crash/D_B Cymbal 01.wav` |

`.n()` counts from 0 in folder order, so `.n(11)` is the 12th file.

## Track: Daybreak (`Strudel/daybreak-drums.strudel.js` + earlier full-track versions)

| Sound | Used for | Source | Licence |
|---|---|---|---|
| liquid-kit (above) | Drums, hats, FX | SampleRadar D'n'B essentials | Royalty-free, no redistribution |
| Piano | Melodies | Salamander Grand Piano v3 by Alexander Holm (Strudel's `piano`) | CC BY 3.0: commercial use **with credit** ([licence](https://github.com/sfzinstruments/SalamanderGrandPiano)) |
| FM Rhodes, pads, sub, mid-bass | Keys, pads, bass | Strudel synths (`sine` + `.fm()`, `sawtooth`, `supersaw`) | Generated; no sample licence |
| Riser, air | FX, texture | Strudel noise (`white`, `pink`) | Generated; no sample licence |

## Track: Track2 (`Strudel/track2.strudel.js`)

| Sound | Used for | Source | Licence |
|---|---|---|---|
| liquid-kit (above) | Drums, FX | SampleRadar D'n'B essentials | Royalty-free, no redistribution |
| Piano | Andrew's piano part (both hands) | Salamander Grand Piano v3, loaded from Strudel's sample repo (`felixroos/dough-samples`, `piano.json`) | CC BY 3.0: commercial use **with credit** |
| Pad | Pad | Strudel synth (`sawtooth`) | Generated |
| Bass | Bass | Strudel synth (`sawtooth`) | Generated |
| Riser, air | FX, texture | Strudel noise (`white`, `pink`) | Generated |

Composition: the piano idea (A–B–C–E figure and voicings) is Andrew's own, transcribed from his recording `IMG_4760.mov`.

## Credits to include on release
- Piano: Salamander Grand Piano by Alexander Holm (CC BY 3.0)

## Not yet used (candidates, check before use)
- SampleRadar vocal packs (female vocals, ad-libs, glitch vocals): royalty-free, no redistribution
- Freesound.org: only files marked **CC0**
- Synthesizer V **Lite** voices: commercial use **prohibited**, so sketching only

## Notes
- Never commit sample WAVs; `.gitignore` excludes `Waveform/`, `Sounds/`, `Tracks/` and all audio files.
- Keep a copy of each pack page or licence text with the samples, in case of a Content ID dispute.
