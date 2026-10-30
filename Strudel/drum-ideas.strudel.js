// DRUM IDEAS: four liquid DnB grooves to audition (humanised, drums only)
// Same kit, same FEEL as daybreak-drums. Each option is its own set of layers,
// so you can mix and match (e.g. kick from 2, hats from 3) once you've picked.
//
// HOW TO USE
// 1. Set PART to 'idea1' ... 'idea4' to hear one groove; 'all4' plays them one
//    after another (8 bars each) so you can compare them in a single listen.
// 2. Tweak, re-run (Ctrl+Enter). Export the keepers:
//      ..\tools\strudel-loop-exporter\export-loops.cmd drum-ideas.strudel.js --only idea2_kick,idea2_snare
//
// THE FOUR IDEAS (all 2-bar phrases, 16 steps a bar: 1 e & a 2 e & a 3 e & a 4 e & a)
//   1 Classic two-step : kick on 1 and the "&" of 3, snare 2 and 4. The reference.
//   2 Skipping         : adds a kick on the "&" of 2, and a push on the "e" of 4.
//   3 Shuffled         : same bones as 1 but 16th hats swung hard, rolling feel.
//   4 Half-feel        : one snare per bar on 3, open space, ghosts fill the gaps.
// Open hats sit on the snare beats (2 and 4) in 1 and 2, cutting the closed hat.
//
// @track DrumIdeas
// @group drums
// @kit ../Waveform/D_B Essentials/liquid-kit
// @library ../Library
// @export idea1_kick    8  loop   classic two-step kick
// @export idea1_snare   8  loop   backbeat on 2 and 4, laid back
// @export idea1_ghost   8  loop   quiet off-beat snares
// @export idea1_hats    8  loop   8th hats, open hat on 2 and 4
// @export idea2_kick    8  loop   skipping kick (early syncopation + push)
// @export idea2_snare   8  loop   backbeat on 2 and 4
// @export idea2_ghost   8  loop   ghosts around the skip
// @export idea2_hats    8  loop   8ths with a 16th pickup
// @export idea3_kick    8  loop   two-step kick with a bar-2 push
// @export idea3_snare   8  loop   backbeat on 2 and 4
// @export idea3_ghost   8  loop   rolling ghost 16ths
// @export idea3_hats    8  loop   swung 16th hats, open on the "a" of 4
// @export idea4_kick    8  loop   spacious kick
// @export idea4_snare   8  loop   single snare on beat 3
// @export idea4_ghost   8  loop   ghosts filling the space
// @export idea4_hats    8  loop   sparse 8th hats

samples('http://localhost:5432/')   // your liquid-kit (run the sampler)

setcpm(174/4)

const PART = 'idea1'

// ===================== FEEL =====================
// Set them all to 0 to hear the robotic version.
const FEEL = {
  swing: 11,     // ms the off-beat 8th hats sit late (0 = straight, ~15 = lazy)
  shuffle: 24,   // ms the off 16ths sit late in idea 3 (the shuffled one)
  laidBack: 4,   // ms the backbeat snare sits behind the beat
  drift: 4,      // ms of random timing drift on hats, ghosts and fills
  dyn: 1,        // 0-1: how much hit levels vary
  tone: 1,       // 0-1: how much each hit's pitch varies
}

const swing = seq(0, FEEL.swing / 1000).fast(4)        // late on every off-8th
const shuffle = seq(0, FEEL.shuffle / 1000).fast(8)    // late on every off-16th
const drift = rand.range(0, FEEL.drift / 1000)
const vary = (lo) => perlin.range(1 - (1 - lo) * FEEL.dyn, 1)
const pitch = (amt) => rand.range(1 - amt * FEEL.tone, 1 + amt * FEEL.tone)
const phrase = perlin.slow(4).range(-.05 * FEEL.dyn, 0)

// ===================== PREVIEWS =====================
const ideaMask = (n) => ({
  ['idea' + n + '_kick']: 1, ['idea' + n + '_snare']: 1,
  ['idea' + n + '_ghost']: 1, ['idea' + n + '_hats']: 1,
})
// 'all4': idea 1 for bars 1-8, idea 2 for 9-16, and so on (32 bars)
const slot = (n) => mini('<' + [1, 2, 3, 4].map(i => (i === n ? '1' : '0') + '!8').join(' ') + '>')
const preview = {
  idea1: ideaMask(1),
  idea2: ideaMask(2),
  idea3: ideaMask(3),
  idea4: ideaMask(4),
  all4: Object.assign({},
    ...[1, 2, 3, 4].map(n => Object.fromEntries(
      Object.keys(ideaMask(n)).map(k => [k, slot(n)])))),
}

const part = (name, pat) => {
  if (PART === name) return pat
  const m = preview[PART] && preview[PART][name]
  if (m === undefined) return silence
  return m === 1 ? pat : pat.mask(m)
}

// ===================== IDEA 1: CLASSIC TWO-STEP =====================
$: part('idea1_kick', cat(
  s("kick ~ ~ ~ ~ ~ ~ ~ ~ ~ kick ~ ~ ~ ~ ~"),
  s("kick ~ ~ ~ ~ ~ ~ ~ ~ ~ kick ~ ~ ~ ~ ~")).n(11)
  .velocity(vary(.95)))

$: part('idea1_snare', s("~ ~ ~ ~ snare ~ ~ ~ ~ ~ ~ ~ snare ~ ~ ~").n(13)
  .nudge(FEEL.laidBack / 1000)
  .velocity(vary(.9).add(phrase))
  .speed(pitch(.01)))

$: part('idea1_ghost', cat(
  s("~ ~ ~ ~ ~ ~ ~ snare ~ ~ ~ ~ ~ ~ ~ snare"),
  s("~ ~ ~ ~ ~ ~ ~ snare ~ ~ ~ ~ ~ ~ ~ ~")).n(13)
  .gain(.2).velocity(vary(.55)).nudge(drift).lpf(5000).speed(pitch(.02)))

$: part('idea1_hats', stack(
  s("hat hat ~ hat hat hat ~ hat").n(7).gain("[.5 .3]*4"),
  s("~ [ohat ~] ~ [ohat ~]").n(3).clip(1).release(.02))
  .nudge(swing.add(drift))
  .velocity(vary(.8).add(phrase))
  .speed(pitch(.015)))

// ===================== IDEA 2: SKIPPING =====================
// bar 1: kick on 1, "&" of 2, "&" of 3; bar 2 adds a push on the "e" of 4
$: part('idea2_kick', cat(
  s("kick ~ ~ ~ ~ ~ kick ~ ~ ~ kick ~ ~ ~ ~ ~"),
  s("kick ~ ~ ~ ~ ~ kick ~ ~ ~ kick ~ ~ kick ~ ~")).n(11)
  .gain(cat(1, "1 .8"))
  .velocity(vary(.95)))

$: part('idea2_snare', s("~ ~ ~ ~ snare ~ ~ ~ ~ ~ ~ ~ snare ~ ~ ~").n(13)
  .nudge(FEEL.laidBack / 1000)
  .velocity(vary(.9).add(phrase))
  .speed(pitch(.01)))

$: part('idea2_ghost', cat(
  s("~ ~ ~ ~ ~ ~ ~ ~ ~ snare ~ ~ ~ ~ ~ snare"),
  s("~ ~ ~ snare ~ ~ ~ ~ ~ snare ~ ~ ~ ~ ~ ~")).n(13)
  .gain(.2).velocity(vary(.55)).nudge(drift).lpf(5000).speed(pitch(.02)))

// 8ths with a quiet 16th pickup on the "a" of 3 and the "a" of 4
$: part('idea2_hats', stack(
  s("hat hat ~ hat hat hat ~ hat").n(7).gain("[.5 .3]*4"),
  s("~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ hat ~ ~ ~ hat").n(7).gain(.2),
  s("~ [ohat ~] ~ [ohat ~]").n(3).clip(1).release(.02))
  .nudge(swing.add(drift))
  .velocity(vary(.8).add(phrase))
  .speed(pitch(.015)))

// ===================== IDEA 3: SHUFFLED =====================
$: part('idea3_kick', cat(
  s("kick ~ ~ ~ ~ ~ ~ ~ ~ ~ kick ~ ~ ~ ~ ~"),
  s("kick ~ ~ ~ ~ ~ ~ ~ ~ ~ kick ~ ~ ~ kick ~")).n(11)
  .gain(cat(1, "1 .75"))
  .velocity(vary(.95)))

$: part('idea3_snare', s("~ ~ ~ ~ snare ~ ~ ~ ~ ~ ~ ~ snare ~ ~ ~").n(13)
  .nudge(FEEL.laidBack / 1000)
  .velocity(vary(.9).add(phrase))
  .speed(pitch(.01)))

// ghosts on most off-16ths: quiet, so they read as a texture not a pattern
$: part('idea3_ghost', s("~ snare ~ ~ ~ ~ snare ~ ~ snare ~ ~ ~ ~ snare ~").n(13)
  .gain(.14).velocity(vary(.5)).nudge(shuffle.add(drift)).lpf(4500).speed(pitch(.02)))

// every 16th hat, off-16ths pushed late by FEEL.shuffle; open hat on the "a" of 4
$: part('idea3_hats', stack(
  s("hat hat hat hat hat hat hat hat hat hat hat hat hat hat hat ~").n(7)
    .gain("[.5 .2 .35 .2]*4"),   // the last 16th is the open hat, so no closed one
  s("~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ohat").n(3).clip(1).release(.02))
  .nudge(shuffle.add(drift))
  .velocity(vary(.75).add(phrase))
  .speed(pitch(.015)))

// ===================== IDEA 4: HALF-FEEL =====================
// snare only on beat 3, so it feels slower under the same 174 pulse
$: part('idea4_kick', cat(
  s("kick ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ kick ~ ~ ~ ~"),
  s("kick ~ ~ kick ~ ~ ~ ~ ~ ~ ~ kick ~ ~ ~ ~")).n(11)
  .velocity(vary(.95)))

$: part('idea4_snare', s("~ ~ ~ ~ ~ ~ ~ ~ snare ~ ~ ~ ~ ~ ~ ~").n(13)
  .nudge(FEEL.laidBack / 1000)
  .velocity(vary(.9).add(phrase))
  .speed(pitch(.01)))

$: part('idea4_ghost', cat(
  s("~ ~ ~ ~ ~ snare ~ ~ ~ ~ ~ ~ ~ ~ snare ~"),
  s("~ ~ ~ ~ ~ ~ snare ~ ~ ~ ~ ~ ~ snare ~ snare")).n(13)
  .gain(.18).velocity(vary(.55)).nudge(drift).lpf(4500).speed(pitch(.02)))

$: part('idea4_hats', stack(
  s("hat ~ hat ~ hat ~ hat ~").n(7).gain("[.45 .3]*2"),
  s("~ ~ ~ ~ ~ ~ ~ [ohat ~]").n(3).clip(1).release(.02))
  .nudge(swing.add(drift))
  .velocity(vary(.8).add(phrase))
  .speed(pitch(.015)))

// ===================== HEADROOM =====================
all(x => x.postgain(.8))
