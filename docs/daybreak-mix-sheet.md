# Daybreak: Production & Mix Sheet

> **Note:** written for the full-track stem workflow. With the loop workflow, the `kick_A` / `kick_B` loops replace the `10_kickkey` stem as the sidechain source, and there is no sub stem.


Working title. Strudel code: `daybreak-full.strudel.js`

| | |
|---|---|
| Tempo | 174 BPM |
| Key | E♭ major (Eb^7 – Cm9 – Ab^7 – B♭7) |
| Length | 128 bars, ~2:57 |
| Sounds | liquid-kit samples (SampleRadar), Strudel synths, Salamander piano. **No placeholder sounds.** |

## Structure

| Section | Bars | Time | What happens |
|---|---|---|---|
| Intro | 1–16 | 0:00 | Air, vowel pad, pad filter opening; FM keys from bar 5; filtered hats bar 9; riser bar 9; muffled kick + roll bar 13; gap + reverse hit bar 16 |
| Drop 1 | 17–48 | 0:22 | Impact; full kit; keys only for 16 bars, then piano call (A) and answer (B); 16th ticks join at bar 33 |
| Breakdown | 49–80 | 1:06 | Drums out; piano an octave lower over warm pad and soft sub; keys + hats return bar 65 with pad opening; riser and muffled kick bar 73; roll bar 77; gap + reverse hit bar 80 |
| Drop 2 | 81–112 | 1:50 | Impact; everything in, piano from the start, ticks throughout |
| Outro | 113–128 | 2:34 | Beat for 8 bars, hats to bar 124, then keys and pad with the filter closing |

Fills: small snare fill at the end of every 8-bar phrase, big fill (replacing the beat) at the end of every 16. Crash on each new 8-bar phrase.

---

## 1. Export stems from Strudel

Change one line at the top of the code, `const STEM = 'all'`, and export **cycles 0 to 128** for each:

| `STEM` value | File name | Contents |
|---|---|---|
| `'all'` | `00_fullmix` | Reference only |
| `'drums'` | `01_drums` | Kick, snare, ghosts, fills, rolls, muffled kick |
| `'hats'` | `02_hats` | Closed, open, 16th ticks, filtered build hats |
| `'sub'` | `03_sub` | Sine sub (all parts) |
| `'midbass'` | `04_midbass` | Supersaw layer an octave up |
| `'keys'` | `05_keys` | FM Rhodes |
| `'pad'` | `06_pad` | Saw pads + vowel layer |
| `'piano'` | `07_piano` | All melody parts |
| `'fx'` | `08_fx` | Riser, reverse hits, impacts, crashes |
| `'air'` | `09_air` | Pink-noise texture |
| `'kickkey'` | `10_kickkey` | **Sidechain trigger only, never heard** |

Each file should be ~2:57. Quick listen before each export to confirm only that stem plays.

---

## 2. Waveform setup

1. New project, **tempo 174 first**, then check auto-tempo is off (see workflow doc, step 5).
2. Drag in all 11 files, each on its own track, all starting at **bar 1**.
3. Confirm every clip ends at the same point. Mute `00_fullmix` (keep it for A/B) and **mute `10_kickkey`** (it only feeds the sidechain).
4. Make two **return/aux tracks**: `REVERB` (Waveform's reverb, 100% wet, ~2 s decay, pre-delay ~20 ms) and `DELAY` (synced 1/8 dotted, ~25% feedback, high-passed at 300 Hz).

---

## 3. Mix, in this order

**Gain staging:** start every fader at −10 dB, then bring up in this order. Aim for master **peaks around −6 dB** with nothing on the master yet.

### 3.1 Kick and sub (the foundation)
- Bring up `01_drums` until the kick peaks around −12 dB on its own.
- Bring up `03_sub` until it feels as weighty as the kick, not louder. Check on headphones *and* speakers.
- `03_sub`: low-pass ~120 Hz, keep it centred.
- **Sidechain the sub** to `10_kickkey`: ratio 4:1+, attack fastest, release ~60–80 ms, **4–6 dB** gain reduction. The kick should punch through with no boomy overlap.

### 3.2 Snare and hats
- Snare cuts through at roughly the same perceived level as the kick.
- `02_hats`: high-pass ~400 Hz. If they sting, a narrow 1–2 dB dip around 8–10 kHz. Keep them a good few dB below the snare.

### 3.3 Mid-bass
- `04_midbass`: high-pass ~80 Hz. Bring it up only until the bass is audible on **phone speakers**. It should disappear into the sub on big speakers.
- Sidechain it to `10_kickkey` too (3–4 dB, release ~80 ms).

### 3.4 Keys, pad, piano (the music)
| Stem | High-pass | EQ | Sidechain to kickkey | Sends |
|---|---|---|---|---|
| `05_keys` | ~150 Hz | Dip 1–2 dB around 300 Hz if muddy | 2–3 dB, release ~100 ms | Reverb low, delay low |
| `06_pad` | ~200 Hz | Dip 300–500 Hz if boxy | **4–6 dB**, release ~120 ms (this is the "breathing") | Reverb medium |
| `07_piano` | ~120 Hz | +1–2 dB around 3 kHz if it's buried | None | Reverb medium, delay low |

- The **piano is the lead**: everything else makes room for it. In the drops, pull pad and keys down until the melody sits clearly on top.
- The stems already contain some Strudel reverb, so start sends low and add only until it feels spacious.

### 3.5 FX and air
- `08_fx`: high-pass ~200 Hz on crashes if they clash with the sub drop. The impacts should feel big but not jump out of the mix.
- `09_air`: barely audible. If you notice it, it's too loud; if you mute it and the track feels drier, it's right.

### 3.6 Drum bus glue (optional)
Group `01_drums` and `02_hats` to a bus with **TDR Kotelnikov**: 2:1, slow-ish attack, auto release, 1–2 dB reduction.

### Sidechain setup in Waveform
On each track to duck, add Waveform's built-in compressor and set its **sidechain / trigger source** to the `10_kickkey` track. If you can't find the sidechain option, send me a screenshot of the compressor and I'll point to it.

---

## 4. Checks before mastering

- [ ] Master peaks around −6 dB, no red anywhere
- [ ] Kick and sub never fight (solo them together through the drops)
- [ ] Piano melody is clear in both drops
- [ ] Bass audible on phone speaker
- [ ] Both gaps (bars 16 and 80) feel like a held breath, and the drops hit harder after them
- [ ] Transitions at bars 48 and 112 feel smooth, not abrupt
- [ ] A/B against a commercial liquid track you like, at **matched volume**: compare low end, brightness and how loud the piano sits

---

## 5. Master

Follow `liquid-dnb-free-workflow.md`, step 7: Nova → Kotelnikov → LoudMax → Youlean. Targets: **about −9 LUFS integrated**, true peak below **−1 dB**.

Export a 24-bit WAV + MP3 and test on earbuds, phone and car.
