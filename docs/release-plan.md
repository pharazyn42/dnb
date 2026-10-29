# Liquid DnB Release Plan

Melodic, piano-led liquid DnB for study/focus listening, written in Strudel, finished in Waveform Free, released on Spotify (and other streaming services) and YouTube.

**Core assumption:** build a catalogue of **15–25 finished tracks** before releasing anything. Nothing goes public until the bank is built and the licensing is clean.

**Time budget:** fits within ~5 hours/week. At one track every 1–2 weeks, the catalogue takes roughly **6–9 months**.

---

## 1. Licensing check of the toolchain

Short answer: **the tools are fine; some of Strudel's built-in sounds are not safe for commercial release.** The software you use to make, route, mix and master doesn't put any licence on your music. The *samples* you play through it can.

| Part | Status | Notes |
|---|---|---|
| Strudel (the software) | ✅ OK | AGPLv3 covers distributing the *software*, not music you make with it. |
| Strudel synths (`sine`, `sawtooth`, `supersaw` etc.) | ✅ OK | Generated in the browser; no samples involved. |
| Strudel drum machines (`.bank("RolandTR909")` etc.) | ⚠️ **Replace** | From the *tidal-drum-machines* collection: recordings of commercial drum machines with no clear licence. The hardware makers may hold the rights. |
| Strudel `piano` | ✅ OK with credit | Appears to be the Salamander Grand Piano, licensed CC BY 3.0: commercial use allowed **if you credit** "Salamander Grand Piano by Alexander Holm". |
| Strudel `gm_*` sounds (e.g. `gm_epiano1` Rhodes) | ⚠️ **Replace** | From the WebAudioFont data set, which mixes several soundfonts. Parts are MIT-licensed (Fluid R3), but the full licence chain is unclear. |
| VCSL instruments (Strudel default) | ✅ OK | Public domain (CC0). |
| VB-Cable, loopMIDI | ✅ OK | Routing only. |
| Waveform Free | ✅ OK | Free for commercial music. |
| TDR Nova, TDR Kotelnikov, LoudMax, Youlean | ✅ OK | Processing/metering only; no claim on your output. |

### The fix: a licence-clean sound palette
Load samples you can document straight into Strudel (via the sounds tab or Strudel's sampler tool) and export stems from Strudel's **export tab**. The MIDI route into Waveform remains an option for using plugin instruments. Sounds to use:

- **Drums:** a free drum pack with a written royalty-free licence, or your own recordings. Keep the licence file.
- **Rhodes / keys:** a free instrument with a clear commercial licence (e.g. Spitfire LABS). Check the licence before use.
- **Piano:** Salamander (with credit), or a free piano plugin with a clear licence.
- **Pads / bass:** a free synth like Vital, or Strudel's own synths.

**Rule:** keep a `LICENCES.md` in the project folder listing every sound source, its licence and a link. If you can't document a sound, don't release it.

---

## 2. Phase 1: build the catalogue (months 1–9)

### Per-track process
1. Write the piano idea (chords + melody); jazz voicings are your edge.
2. Sketch in Strudel: drums, sub, chords, melody, arrangement with masks.
3. Swap in the licence-clean sounds and export stems from Strudel's export tab (or use the MIDI route for plugin instruments).
4. Mix and master (see `liquid-dnb-free-workflow.md`).
5. Export WAV (24-bit master) + MP3.
6. Log it in the catalogue tracker (below).

### Keep a consistent sound
Study listeners return to a *mood*, not individual tracks. Keep:
- tempo at 172–176 BPM
- the same core drum kit and sub
- piano/Rhodes up front
- similar loudness (about −9 to −11 LUFS)

Vary keys and progressions, but keep the palette.

### Catalogue tracker
| # | Title | Key | BPM | Length | Status | Sounds logged | Released |
|---|---|---|---|---|---|---|---|
| 1 | | F minor | 174 | 2:35 | Sketch | ☐ | |

### Milestones
- **Track 5:** review honestly whether the sound is consistent and finished enough; fix the template before going further.
- **Track 15:** minimum to launch.
- **Track 25:** ideal launch bank.

---

## 3. Phase 2: identity and admin (alongside tracks 10–15)

- **Artist name:** check it isn't taken on Spotify, YouTube or Instagram.
- **Artwork:** your own photos, or images with a clear commercial licence. Never Google or Pinterest images. One consistent visual style for every cover.
- **Employment contract:** check your IP and outside-interests clauses before releasing anything commercially.
- **Tax:** income goes under your sole trader setup; the UK trading allowance covers the first £1,000 of gross trading income a year.
- **Royalties:** consider registering with PRS for Music (songwriting royalties) once releases are live.

---

## 4. Phase 3: Spotify launch (from catalogue complete)

### Distribution
- Use a distributor: DistroKid (~£20/year, unlimited releases) or a free tier like RouteNote.
- Include credits (e.g. Salamander) in metadata or descriptions where the licence requires it.

### Release cadence
- Release **a single every 2–3 weeks** from the bank rather than dumping everything at once. Each release is another chance at playlists and the algorithm.
- After 6–8 singles, bundle them with new tracks into an EP/album.
- 20 tracks at this pace = roughly a year of releases without writing anything new.

### Promotion
- **Pitch every release in Spotify for Artists** at least 7 days before it goes live.
- Approach independent "study / focus / liquid DnB" playlist curators directly.
- **Never pay for streams or bot playlists.** Artificial streams can get tracks removed and accounts penalised.

### Realistic numbers
- Pay: roughly £0.002–0.004 per stream.
- A track must get at least 1,000 streams in 12 months to earn anything.
- 1 million total streams ≈ £2,500–3,500.

---

## 5. Phase 4: YouTube (start once ~10 tracks are released)

### Format
- **1–2 hour mixes** built from the catalogue, with a strong, consistent visual (looping artwork or a slow animated scene).
- Chapters in the description listing each track (and linking to Spotify).

### Staying monetisable
YouTube's **"inauthentic content"** policy (July 2025) targets mass-produced, repetitive channels, which describes many study-music channels. To show genuine human authorship:
- Occasional videos of you **playing the piano parts**.
- **"Making of" / Strudel tutorial** videos: code on screen, track built live. These also attract a separate (coder/producer) audience.
- **Shorts:** 30–60 second clips of a drop or piano motif, linking to the full mix.

### Monetisation path
- YouTube Partner Program: a 500-subscriber tier unlocks fan funding; full ad revenue needs more subscribers and watch time. Thresholds are reportedly rising for new applicants in 2027, so check the current requirements when you start.
- Expect 6–12 months before YouTube earns anything.

### Making the videos (no experience needed)
No face, talking or fancy editing required; the music carries them.

**What to film**
- **Screen:** record Strudel with **OBS Studio** (free, Windows) while building or tweaking a track. Code appearing as the music changes is the hook.
- **Hands:** iPhone on a stand above the piano keys, playing the melody or chords. Natural light; landscape for YouTube, portrait for Shorts.
- **Audio:** always use the **final mastered WAV** as the soundtrack, never room or laptop audio. Biggest quality jump for no effort.

**Starter formats**
- **Shorts (vertical, under a minute):** the drop hitting with code on screen, or hands playing the motif, then the full DnB version kicking in.
- **Making-of (5–10 minutes):** an empty Strudel page to the finished drop, sped up in places, with short text captions instead of voiceover.

**Editing with Claude**
Upload the clips plus the mastered WAV and Claude can:
- cut, trim and join clips, with the mastered audio underneath
- line cuts up to the beat (finding drops and kicks in the audio)
- make vertical 9:16 versions for Shorts from landscape footage
- add captions, titles and on-screen code/text
- export ready-to-upload files

Limits: Claude checks footage via extracted frames rather than watching it, and large files are slow to upload from a phone, so keep clips short. Use a free phone editor like **CapCut** for quick, fiddly tweaks.

**First test:** film 30 seconds of hands playing the piano melody from the first track, then send it with the WAV to make a Short where the piano builds into the drop.

---

## 6. Income potential

Rough monthly estimates **about two years in** (decent catalogue, YouTube monetised). Year 1 will be lower. The niche is hit-driven, so the spread is huge: quality and the jazz-piano angle matter more than volume.

### Music only (Spotify + YouTube mixes)

| Scenario | Track every 1–2 weeks (~70 tracks) | Once a month (~24 tracks) |
|---|---|---|
| Low | £0–20 | £0 |
| Likely | £100–200 | £30–70 |
| Mid | £400–600 | £150–250 |
| High | £3,000+ | £1,000+ |

Likely case per year: ~£1,200–2,400 (fast) vs ~£400–800 (monthly).

### Music + making-of / code videos (1–2 videos a month)

| Scenario | Track every 1–2 weeks + videos | Monthly track + videos |
|---|---|---|
| Low | £0–30 | £0 |
| Likely | £200–400 | £80–150 |
| Mid | £800–1,200 | £350–600 |
| High | £5,000+ | £2,000+ |

### Assumptions
Per track, per month, at ~£0.003 per stream:
- **Low:** <150 streams/track; most tracks miss Spotify's 1,000-streams-a-year minimum and earn nothing. YouTube not monetised.
- **Likely:** ~500 streams/track from algorithmic plays and small playlists; YouTube just past monetisation.
- **Mid:** ~1,500 streams/track from regular independent study-playlist placement; ~100k YouTube views/month.
- **High:** one or two tracks on big editorial/study playlists (~10k avg per track); mixes or tutorials take off.

### Why the videos matter
- **Better ad rates:** tech/tutorial content earns very roughly £3–8 per 1,000 views vs £1–2 for music mixes.
- **Faster monetisation:** visible human authorship is the best answer to YouTube's inauthentic-content policy, and builds subscribers faster.
- **More streams:** viewers who watch a track being built often go and stream it.
- **Extra income streams:** coders/producers pay for things: memberships/Patreon, Strudel template packs, sponsorships.

### What cadence changes
- Income scales roughly with catalogue size: the faster pace earns ~3x at every level.
- More releases = more chances at a playlist hit, and Spotify's algorithm rewards consistency, so speed also raises the odds of the higher scenarios.
- **Time is the constraint:** a track every 1–2 weeks is a lot within ~5 hours/week. Start at **one track a month** while learning; speed up once the template and sound palette are settled.
- **Capture videos as a by-product:** screen-record every writing session in OBS, then send the footage to Claude to cut into a making-of plus Shorts. Adds ~30–60 minutes per track rather than a separate project.

### Tax note
The UK trading allowance covers the first £1,000 of gross trading income a year; above that, it goes on your sole trader self-assessment.

---

## 7. Risks

| Risk | Mitigation |
|---|---|
| Unlicensed samples → takedowns or claims | Licence-clean palette; `LICENCES.md` per project |
| Content ID claims on shared free samples | Prefer unique or processed sounds; keep licence proof to dispute claims |
| YouTube demonetisation (inauthentic content) | Visible human authorship: piano videos, making-of, tutorials |
| Saturated niche | Lean into the jazz-piano angle as the signature sound |
| Burnout at 5 h/week | One track per 1–2 weeks is the target, not a minimum |
| Employment contract conflict | Check IP/outside-interests clauses before release |

---

## 8. Decision points

- **After track 5:** is the sound worth continuing? Adjust the template.
- **After 3 months of releases:** monthly listeners and saves trending up? Double down on what playlists responded to.
- **After 6 months of YouTube:** subscriber growth on track for the Partner Program? If not, shift effort to Spotify and the tutorial angle.
