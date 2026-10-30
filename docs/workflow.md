# Liquid DnB: Free Production Workflow

> **Current approach (Oct 2026):** write parts in `Strudel/` workbenches and export loops with `tools/strudel-loop-exporter` (see the root README). The stem-export and recording routes below still work but are the older method.


Strudel (with your own licence-clean samples) → export audio from Strudel → Waveform Free → mix → master → WAV. All free, on Windows.

---

## 1. Install once

| Tool | Purpose |
|---|---|
| [Waveform Free](https://www.tracktion.com/products/waveform-free) | DAW for mixing and mastering |
| TDR Nova | EQ (including dynamic EQ) |
| TDR Kotelnikov | Bus compressor ("glue") |
| LoudMax | Limiter |
| Youlean Loudness Meter | LUFS metering |
| [OBS Studio](https://obsproject.com/) | Screen-records Strudel while you write, for making-of videos and Shorts |
| Node.js *(optional)* | Only needed to serve samples with Strudel's sampler tool, or to run Strudel from source |
| VB-Cable *(optional)* | Only for the fallback recording route (see end) |
| loopMIDI *(optional)* | Only for the MIDI route (see end) |

**Strudel offline:** the most reliable route is to run Strudel from source (needs Node.js, pnpm and Git):

```
npm install -g pnpm
git clone https://codeberg.org/uzu/strudel.git C:\HomeProjects\strudel
cd C:\HomeProjects\strudel
pnpm i
pnpm dev
```

Then open the URL it prints (normally `http://localhost:4321`). To match the exporter, check out the tag for Strudel 1.3.0 (`git tag` lists them) and run `pnpm i` again. The lighter alternative is installing strudel.cc as an app from Chrome (see the [offline guide](https://strudel.cc/learn/pwa/#using-strudel-offline)), but that only caches what you've already loaded.

**Offline sounds:**
- Your kit: run `npx @strudel/sampler` in the `liquid-kit` folder (serves on port 5432).
- Salamander piano: run `node tools/fetch-piano.mjs --serve` from the repo root. It downloads the piano once to `..\strudel-samples` (outside the repo, so nothing is committed), then serves it on port 5433. On later runs it reuses the files without needing the internet.
- In the workbench, set `const OFFLINE = true` to load the piano from `http://localhost:5433/piano.json`, or `false` to fetch it from GitHub. If the exporter renders with `OFFLINE = true`, keep the piano server running.

---

## 2. Load licence-clean samples into Strudel

Strudel's built-in drum machines and `gm_*` sounds aren't safe for commercial release (see the licensing table in `liquid-dnb-release-plan.md`). Replace them with samples you can document:

- **Option A (simplest):** in Strudel's **sounds** tab, use **import sounds folder** to load a folder of samples. They're stored in your browser, not uploaded.
- **Option B (most reliable):** serve a samples folder locally with Strudel's sampler tool (needs Node.js). See [Strudel: loading samples from disk](https://strudel.cc/learn/samples/).

Then:
- Check the sounds tab for the names your samples are given, and swap them into the code, e.g. replace `s("bd").bank("RolandTR909")` with your own kick's name.
- Log every sample source and its licence in `LICENCES.md`.

Strudel's own synths (`sine`, `sawtooth`, `supersaw`) and the Salamander `piano` (credit required) can stay.

### Finding better sounds

Sound selection is the biggest single factor in sounding professional. Free options, roughly in order of usefulness:

**1. Free packs with clear licences**
- **[MusicRadar SampleRadar](https://www.musicradar.com/news/tech/sampleradar-free-sample-downloads-217833):** every sample is made for them and guaranteed royalty-free (use in your music; don't redistribute). Its drum and bass packs (essentials, analogue DnB, pads, atmospheres, sub bass, drum breaks) cover nearly everything this style needs. Start with the **475 drum 'n' bass essentials** pack.
- **Freesound.org:** filter by the **CC0** licence (public domain, no credit needed). Good for textures: rain, vinyl crackle, room tone, foley for transitions.
- **Free brand packs** (e.g. Slate Digital SEISMIC): read the licence text and save it with the samples.

**2. Record your own (the biggest advantage)**
Your own recordings are 100% yours, with no licence questions:
- Record a digital piano or keyboard's piano/Rhodes sounds. Using a keyboard's built-in sounds in your music is normal practice.
- Make a **multisample**: record one note every few semitones and load them as a pitched instrument in Strudel. A weekend project that gives you a signature keys sound.
- Record household textures (keys jangling, a pan hit, rain on a window) for percussion and atmosphere.

**3. Make Strudel's synths sound richer** (free and licence-free)
- **Layer:** sine sub + a quiet, filtered `supersaw` for a fuller bass.
- **Movement:** slowly modulate filters, e.g. `.lpf(sine.range(400, 2000).slow(16))`.
- **Character:** a touch of `.shape()` saturation or `.crush()` for warmth and grit.
- **Space:** do reverb and delay in Waveform rather than Strudel.

**Loading pitched instruments**
One-shots (drums, FX) load via the folder import or the sampler tool. For pitched instruments, map files to notes so Strudel can play any pitch from a handful of samples:

```js
samples({
  myrhodes: { c3: 'rhodes_c3.wav', e3: 'rhodes_e3.wav', ab3: 'rhodes_ab3.wav' }
}, 'http://localhost:5432/')
```

Then use `.s("myrhodes")`. Add every new sound to `LICENCES.md` as you go.

---

## 3. Write and record the session

- Start an **OBS** screen recording before you begin writing, for making-of footage.
- Build the track in Strudel (track code template at the bottom of this file).

---

## 4. Export stems from Strudel

Use Strudel's **export tab** to render audio:

1. Set the export range to cover the whole track (the template is **112 cycles** = 112 bars).
2. Export the **full mix** once as a reference.
3. Export **one stem per pass**, muting every other layer by changing `$:` to `_$:`:

| Pass | Layers to leave on |
|---|---|
| 1 | Drums + snare roll |
| 2 | Hats (both hat layers) |
| 3 | Sub bass |
| 4 | Rhodes / keys |
| 5 | Pad |
| 6 | Piano |

Every export starts at cycle 0, so stems should line up automatically. The **sync hit** in the code is a backup: if anything drifts, line up the rim shots on bar 1, then cut them out.

---

## 5. Import into Waveform

- New project, set tempo to **174 BPM before importing anything**.
- **Turn auto-tempo off.** Waveform guesses the tempo of imported audio and time-stretches clips to "fit" the project. It guessed the drums right but the keys as ~58 BPM, squashing them to a third of their length. Strudel exports are already exactly at project tempo, so they never need stretching:
  - Look in Waveform's settings for auto-detecting tempo / auto-tempo on imported audio and switch it off.
  - On any clip that comes in the wrong length: select it on its own, then in the clip properties panel turn **Auto Tempo off** (or set the clip's BPM to **174**).
  - If the clip plays at the right speed but still ends early, drag its right-hand edge out to reveal the rest of the audio, or delete and re-import it.
- Drag each stem onto its own track, all starting at **bar 1**.
- Check alignment by playing everything together against the full-mix reference. Every clip should end at the same point.
- Remove the sync clicks: split each clip just after the click (~50 ms) and delete that slice. Mute the full-mix track but keep it as an A/B reference.

**Template lesson:** put the sync click a bar *before* the music starts, so removing it never trims the first notes.

---

## 6. Mix

- Balance the **kick and sub first**, then build everything else around them.
- High-pass the **pad, Rhodes and piano at ~150 Hz** so they stay clear of the sub.
- Pan the hats slightly off-centre.
- Leave **peaks around −6 dB** on the master for mastering headroom.

---

## 7. Master (master track, in this order)

1. **TDR Nova:** gentle cleanup; low cut at ~25 Hz; tame any harshness at 2–5 kHz.
2. **TDR Kotelnikov:** 1–2 dB of gain reduction to glue the mix.
3. **LoudMax:** ceiling **−1 dB**; push until Youlean reads about **−9 LUFS** integrated (club level; streaming services turn it down to −14).
4. **Youlean Loudness Meter:** last in the chain, for metering only.

---

## 8. Export and check

- Render a **24-bit WAV** (master copy) plus an **MP3** for sharing.
- Listen on earbuds, in the car and on your phone.
- If the sub disappears or the hats sting on any of them, go back to step 6.

---

## Alternative: write loops in Strudel, arrange in Waveform

Instead of arranging the full track in Strudel with masks, write each part as a short loop, export the loops, and do the looping and arranging in Waveform. Code for patterns and sounds; the DAW for structure.

**Why**
- Arranging visually (dragging blocks) is easier to tweak than editing mask strings.
- Exports are short and quick: 8 bars per part instead of 2.5 minutes.
- Fewer sync problems: every loop is a clean multiple of bars.

**How**
1. In Strudel, write each part on its own, with **no masks**.
2. Export each part at exactly **8 cycles (8 bars)**, starting at cycle 0. That's one full pass of the chord progression.
3. Export **dry**: remove `.room()` and `.delay()` before exporting, and add reverb and delay in Waveform instead. Otherwise tails get cut off and click where the loop restarts.
4. Export **variations** so the track doesn't loop identically: e.g. drums A, drums B, a 1-bar fill, a snare roll, a filtered intro version of the keys.
5. In Waveform (tempo 174, auto-tempo off), drop the loops onto tracks and arrange: intro, drop, breakdown, drop, outro.
6. Add movement with **automation** (filters opening, reverb swells, something changing every 8 bars) to avoid a mechanical feel.

**Naming scheme**
`part_variation_length_bpm.wav`, e.g.:
- `drums_A_8bars_174.wav`
- `drums_fill_1bar_174.wav`
- `keys_Fm_8bars_174.wav`
- `sub_8bars_174.wav`

**Videos:** the making-of becomes "writing the parts in code" plus a shorter "arranging in Waveform" segment.

---

## Fallback: record the browser output (VB-Cable)

Use this only if the export tab doesn't do what you need.

- **Windows:** Settings → System → Sound → Volume mixer → set **Chrome** output to **CABLE Input**.
- **Waveform:** audio input = **CABLE Output**; output = headphones/speakers.
- Record one stem per pass in real time, keeping the sync hit on, then line up the rim shots on bar 1.

---

## Optional: MIDI route

Use this to play Strudel's patterns through instruments inside Waveform instead.

1. Install **loopMIDI** and create a port.
2. In Strudel (desktop Chrome), add `.midi('loopMIDI Port').midichan(n)` to each layer, with a different channel per layer.
3. In Waveform, set each MIDI track's input to loopMIDI on the matching channel, load an instrument and record.
4. Drums must be rewritten as `note(...)` mapped to a drum kit (e.g. C1 = kick, D1 = snare), because `s("bd")` doesn't send MIDI notes.

---

## Track code template (Strudel)

Structure: intro 16 | drop 32 | breakdown 16 | drop 32 | outro 16 bars (112 bars, ~2:35 at 174 BPM).
Each `1!32` in the masks means "on for 32 bars"; every mask must add up to 112.

> ⚠️ The drum machine (`.bank(...)`) and `gm_epiano1` sounds below are placeholders for writing. Swap them for your licence-clean samples before exporting anything for release.

```js
setcpm(174/4)

// section masks, one value per bar
// intro 16 | drop 32 | breakdown 16 | drop 32 | outro 16
const drums = "<0!16 1!32 0!16 1!40 0!8>"
const hats  = "<0!8 1!40 0!16 1!40 0!8>"
const low   = "<0!16 1!32 0!16 1!32 0!16>"
const keys  = "<0!48 1!56 0!8>"
const roll  = "<0!12 1!4 0!44 1!4 0!48>"

// sync hit for lining up stems (bar 1 only) - backup alignment aid
$: s("rim").mask("<1 0!111>")

// two-step drums
$: s("bd ~ ~ ~ ~ ~ ~ ~ ~ ~ bd ~ ~ ~ ~ ~, ~ ~ ~ ~ sd ~ ~ ~ ~ ~ ~ ~ sd ~ ~ ~")
  .bank("RolandTR909").mask(drums)

// snare roll build into each drop
$: s("sd*<4 8 16 32>").bank("RolandTR909")
  .gain("<.3 .4 .55 .7>").mask(roll)

// hats
$: s("hh*8, ~ oh ~ oh").bank("RolandTR909")
  .gain("[.5 .3]*4").hpf(6000).mask(hats)

$: s("hh*16").bank("RolandTR808")
  .gain(.12).hpf(8000).mask(low)

// Rhodes chords, all the way through
$: chord("<Fm9 Db^7 Bbm9 C7>/2").voicing()
  .s("gm_epiano1").room(.7).gain(.4)

// sub bass
$: note("<f1 db1 bb0 c1>/2")
  .struct("x ~ ~ ~ ~ ~ x ~ ~ ~ x ~ ~ ~ ~ ~")
  .s("sine").gain(1.1).mask(low)

// pad, all the way through
$: chord("<Fm9 Db^7 Bbm9 C7>/2").voicing()
  .s("sawtooth").lpf(sine.range(400, 2000).slow(8))
  .attack(.5).release(2).room(.9).gain(.2)

// piano melody from the breakdown onwards
$: note(`<
  [c5 ~ ab4 ~ eb5 ~ ~ c5]
  [g5 ~ ~ f5 eb5 ~ c5 ~]
  [f5 ~ ab4 ~ c5 ~ ~ db5]
  [c5 ~ ~ ab4 f4 ~ ~ ~]
  [db5 ~ f5 ~ ab5 ~ ~ f5]
  [eb5 ~ ~ db5 c5 ~ ~ ~]
  [e5 ~ g5 ~ bb5 ~ ~ g5]
  [e5 ~ ~ c5 ~ ~ ~ ~]
>`).s("piano").room(.6).delay(.25).gain(.55).mask(keys)
```
