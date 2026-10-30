// TRACK 2 (working title): your A-B-C-E piano idea as a full liquid DnB track
// 128 bars at 174 BPM (~2:57), A minor
//
// intro 1-16 | drop 1 17-48 | breakdown 49-64 | build 65-80 | drop 2 81-112 | outro 113-128
//
// PLAY:   PART = 'song' plays the whole arranged track.
// TWEAK:  set PART to one part name (below) to hear it on its own.
// EXPORT: ..\tools\strudel-loop-exporter\export-loops.cmd track2.strudel.js
//         Melodic parts export as 16-bar loops (one pass of your progression).
//         Drums: use the Daybreak drum loops already in Library\Daybreak\drums.
//
// SOUNDS: needs the sampler running in your liquid-kit folder (see below)
//         and an internet connection for the piano samples.
//
// @track Track2
// @group music
// @key Am
// @kit ../Waveform/D_B Essentials/liquid-kit
// @library ../Library
// @export piano_rh  16  loop      your A-B-C-E figure (low octave, then high)
// @export piano_lh  16  loop      your left-hand voicings
// @export pad       16  loop      warm pad doubling your voicings
// @export bass      16  loop      two-step bass following the chord roots
// @export song     128  oneshot   the whole arranged track, as a reference bounce

samples('http://localhost:5432/')   // your liquid-kit (run the sampler)
// Piano source: false = fetch from GitHub; true = local copy (node tools/fetch-piano.mjs --serve)
const OFFLINE = false
samples(OFFLINE ? 'http://localhost:5433/piano.json'
                : 'https://raw.githubusercontent.com/felixroos/dough-samples/main/piano.json')  // Salamander piano

setcpm(174/4)

const PART = 'song'

// ===================== ARRANGEMENT =====================
// bars(...) turns bar ranges into a 128-bar on/off mask, so the structure
// reads like a plan. gap: bars whose second half is silent (the breath
// before a drop).
const bars = (ranges, gaps = []) => mini('<' + Array.from({ length: 128 }, (_, i) => {
  const b = i + 1
  if (!ranges.some(([a, z]) => b >= a && b <= z)) return 0
  return gaps.includes(b) ? '[1 0]' : 1
}).join(' ') + '>')

const SONG = {
  piano_rh:     bars([[1, 64], [81, 128]], [16, 80]),
  piano_lh:     bars([[1, 128]], [16, 80]),
  pad:          bars([[9, 128]], [16, 80]),
  bass:         bars([[17, 48], [73, 120]], [80]),
  // drums
  kick_A:       bars([[17, 31], [113, 120]]),
  kick_B:       bars([[33, 47], [81, 95], [97, 111]]),
  snare:        bars([[17, 31], [33, 47], [81, 95], [97, 111], [113, 120]]),
  ghost:        bars([[17, 31], [33, 47], [81, 95], [97, 111], [113, 120]]),
  hats:         bars([[17, 48], [81, 124]]),
  ticks:        bars([[33, 48], [81, 112]]),
  hat_soft:     bars([[9, 16], [65, 80]], [16, 80]),
  kick_muffled: bars([[13, 16], [73, 80]], [16, 80]),
  fill_small:   bars([[24, 24], [40, 40], [88, 88], [104, 104]]),
  fill_big:     bars([[32, 32], [48, 48], [96, 96], [112, 112]]),
  roll:         bars([[13, 16], [77, 80]], [16, 80]),
  // fx
  riser:        bars([[9, 16], [73, 80]], [16, 80]),
  revhit:       bars([[16, 16], [80, 80]]),
  impact:       bars([[17, 17], [81, 81]]),
  crash:        bars([[33, 33], [49, 49], [97, 97], [113, 113]]),
  air:          bars([[1, 128]]),
}

const part = (name, pat) => {
  if (PART === name) return pat
  if (PART === 'song' && SONG[name]) return pat.mask(SONG[name])
  return silence
}

// ===================== FEEL (same as the Daybreak drums) =====================
const FEEL = { swing: 11, laidBack: 4, drift: 4, dyn: 1, tone: 1 }
const cyc = ms => ms / (240000 / 174)
// timing feel uses nudge (seconds added to each sample's start at play
// time): same result as shifting the pattern, but far cheaper to compute
const swing = seq(0, FEEL.swing / 1000).fast(4)        // off-8ths sit late
const drift = rand.range(0, FEEL.drift / 1000)         // per-hit looseness
const vary = (lo) => perlin.range(1 - (1 - lo) * FEEL.dyn, 1)
const pitch = (amt) => rand.range(1 - amt * FEEL.tone, 1 + amt * FEEL.tone)
const phrase = perlin.slow(4).range(-.05 * FEEL.dyn, 0)

// ===================== YOUR PIANO =====================
// right hand: the A-B-C-E figure, low octave for 8 bars, then up an octave
$: part('piano_rh', note("<[a4 b4 c5 e5]!8 [a5 b5 c6 e6]!8>")
  .s("piano")
  .velocity(perlin.range(.7, .9))        // played, not programmed
  .nudge(rand.range(0, .008))       // a few ms of human looseness
  .clip(1.2))

// left hand: your voicings, one chord per 2 bars
//   Am | Am9 | Fmaj7 | Am(add9) | Am | C/G then Am9 | Fmaj7/A | Am(add9)
const voicings = `<
  [a3,c4]
  [a2,g3,b3,e4]
  [f2,f3,a3,c4,e4]
  [a2,e3,a3,b3,e4]
  [a2,a3,c4,e4]
  [[g3,c4,e4] [a2,g3,b3,e4]]
  [a2,f3,c4,e4]
  [e3,a3,b3,e4]
>/2`

$: part('piano_lh', note(voicings)
  .s("piano").velocity(.6).clip(1))

// ===================== PAD =====================
// your voicings an octave up on a soft saw pad, filter slowly breathing
$: part('pad', note(voicings).add(note(12))
  .s("sawtooth").lpf(sine.range(700, 1800).slow(16))
  .attack(.8).release(1.2).gain(.12))

// ===================== BASS =====================
// two-step rhythm on the chord roots, one note per bar
// (G under the C/G, F under the Fmaj7/A for movement)
// warm filtered saw, not a pure sine sub. TWEAK: mute if you prefer no bass
$: part('bass', note("<a1 a1 a1 a1 f1 f1 a1 a1 a1 a1 g1 a1 f1 f1 a1 a1>")
  .struct("x ~ ~ ~ ~ ~ x ~ ~ ~ x ~ ~ ~ ~ ~")
  .s("sawtooth").lpf(320).lpq(2)
  .decay(.35).sustain(.5).release(.1)
  .gain(.55))

// ===================== DRUMS (Daybreak kit and feel) =====================
const kickA = s("kick ~ ~ ~ ~ ~ ~ ~ ~ ~ kick ~ ~ ~ ~ ~").n(11).velocity(vary(.95))
const kickB = s("kick ~ ~ ~ ~ ~ ~ ~ ~ ~ kick ~ ~ kick ~ ~").n(11).gain("1 .8").velocity(vary(.95))
$: part('kick_A', kickA)
$: part('kick_B', kickB)

$: part('kick_muffled', s("kick ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~").n(11).lpf(900))

$: part('snare', s("~ ~ ~ ~ snare ~ ~ ~ ~ ~ ~ ~ snare ~ ~ ~").n(13)
  .nudge(FEEL.laidBack / 1000).velocity(vary(.9).add(phrase)).speed(pitch(.01)))

$: part('ghost', s("~ ~ ~ ~ ~ ~ ~ snare ~ ~ ~ ~ ~ ~ ~ snare").n(13)
  .gain(.2).velocity(vary(.55)).nudge(drift).lpf(5000).speed(pitch(.02)))

$: part('hats', stack(
  s("hat hat ~ hat hat hat ~ hat").n(7).gain("[.5 .3]*4"),
  s("~ [ohat ~] ~ [ohat ~]").n(3).clip(1).release(.02)
).nudge(swing.add(drift)).velocity(vary(.8).add(phrase)).speed(pitch(.015)))

$: part('ticks', s("hat*16").n(7).gain(.1).hpf(8000)
  .nudge(swing.add(drift)).velocity(vary(.6)).speed(pitch(.02)))

$: part('hat_soft', s("hat*8").n(7).gain("[.4 .2]*4")
  .lpf(saw.range(2000, 9000).slow(8))
  .nudge(swing.add(drift)).velocity(vary(.8)).speed(pitch(.015)))

$: part('fill_small', s("~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ snare ~ snare").n(13)
  .gain(.35).nudge(drift).velocity(rand.range(.8, 1)).speed(pitch(.03)))

$: part('fill_big', stack(
  s("kick ~ ~ ~").n(11),
  s("~ ~ ~ ~ snare ~ ~ snare ~ snare ~ snare snare ~ snare snare").n(13)
    .gain(saw.range(.35, .75)).nudge(drift)
    .velocity(rand.range(.8, 1)).speed(pitch(.03)).cut(1)
))

$: part('roll', s("snare*<4 8 8 16>").n(13)
  .gain(saw.range(.25, .7).slow(4)).nudge(drift)
  .velocity(rand.range(.75, 1)).speed(pitch(.03)).cut(1))

// ===================== FX =====================
$: part('riser', s("white*8").legato(1).attack(.03).release(.05)
  .hpf(saw.range(300, 9000).slow(8)).gain(saw.range(0, .18).slow(8)))

$: part('revhit', s("~ revhit").n(0).fit())

$: part('impact', stack(
  s("subdrop").struct("x ~ ~ ~").gain(.8),
  s("crash").n(0).struct("x ~ ~ ~").gain(.45)
))

$: part('crash', s("crash").n(0).struct("x ~ ~ ~").gain(.25))

$: part('air', s("pink").slow(128).attack(2).release(2)
  .hpf(900).lpf(4000).gain(.04))

// ===================== HEADROOM =====================
// loops keep the usual 0.8; the full-song bounce stacks everything (impact +
// kick + bass + piano on a drop) so it gets more room to avoid clipping
all(x => x.postgain(PART === 'song' ? .5 : .8))
