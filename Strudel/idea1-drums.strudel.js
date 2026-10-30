// IDEA 1 DRUMS: classic two-step, built out (humanised)
// Grown from idea 1 in drum-ideas.strudel.js: kick on 1 and the "&" of 3,
// snare 2 and 4, open hat on the snare beats. This adds what you need to
// arrange it: a second energy level, 4-bar variation, fills and builds.
//
// Same principle as daybreak-drums: performance lives here, sound lives in
// Waveform. Exports are dry, centred and uncompressed.
//
// HOW TO USE
// 1. Set PART to a preview to hear parts together:
//      'groove'   : the plain idea 1 groove, small fill on bar 8
//      'groove_b' : busier version (push kicks, busier ghosts + hats)
//      'phrase'   : 16 bars: 8 of groove, 8 of groove_b, big fill on bar 16
//      'build'    : 8 bars: soft hats, muffled kick, roll in bars 5-8
//      'song'     : the whole 80-bar drum arrangement (see ARRANGEMENT below)
//    or to a single part name to hear just that layer.
// 2. Tweak FEEL or any line marked TWEAK, then re-run (Ctrl+Enter).
// 3. Export everything to the loop library (from the Strudel folder):
//      ..\tools\strudel-loop-exporter\export-loops.cmd idea1-drums.strudel.js
//    or a few parts:  ... idea1-drums.strudel.js --only kick_A,snare
//
// STEPS: 16 a bar. 0 = beat 1, 4 = beat 2, 8 = beat 3, 12 = beat 4.
//
// @track Idea1
// @group drums
// @key Eb
// @kit ../Waveform/D_B Essentials/liquid-kit
// @library ../Library
// @export kick_A         8  loop      main kick, also the sidechain source
// @export kick_B         8  loop      kick_A plus soft push kicks (4-bar variation)
// @export snare          8  loop      backbeat on 2 and 4, laid back
// @export ghost_A        8  loop      sparse quiet off-beat snares
// @export ghost_B        8  loop      busier ghosts, changes every bar
// @export hats           8  loop      8th hats + open hat on 2 and 4, choke baked in
// @export hats_B         8  loop      hats with quiet 16th pickups
// @export ticks          8  loop      quiet 16ths for extra energy
// @export hat_soft       8  loop      filtered hats that open up (builds)
// @export kick_muffled   8  loop      low-passed kick for intros/builds
// @export kick_A_end     8  loop      kick_A with bar 8 silent, for a big fill
// @export kick_B_end     8  loop      kick_B with bar 8 silent, for a big fill
// @export snare_end      8  loop      snare with bar 8 silent, for a big fill
// @export ghost_A_end    8  loop      ghost_A with bar 8 silent, for a big fill
// @export ghost_B_end    8  loop      ghost_B with bar 8 silent, for a big fill
// @export roll           4  oneshot   snare roll into a drop
// @export fill_small     1  oneshot   pickups ON TOP of a normal beat bar
// @export fill_big       1  oneshot   REPLACES kick + snare + ghost for that bar
// @export fill_tumble    1  oneshot   pitched-down snares, tom-style, REPLACES the beat
// @export song          80  oneshot   the whole drum arrangement, as a reference bounce

samples('http://localhost:5432/')   // your liquid-kit (run the sampler)

setcpm(174/4)

const PART = 'groove'

// ===================== FEEL =====================
// TWEAK these to taste. Set them all to 0 to hear the robotic version.
const FEEL = {
  swing: 11,     // ms the off-beat 8th hats sit late (0 = straight, ~15 = lazy)
  laidBack: 4,   // ms the backbeat snare sits behind the beat (classic liquid)
  drift: 4,      // ms of random timing drift on hats, ghosts and fills
  dyn: 1,        // 0-1: how much hit levels vary (0 = machine-flat)
  tone: 1,       // 0-1: how much each hit's pitch varies
}

// timing feel uses nudge (seconds added at play time), always later, never
// earlier, so nothing falls before bar 1. Not patterned .late(): too slow.
const swing = seq(0, FEEL.swing / 1000).fast(4)        // late on every off-8th
const drift = rand.range(0, FEEL.drift / 1000)         // fresh amount per hit
const vary = (lo) => perlin.range(1 - (1 - lo) * FEEL.dyn, 1)
const pitch = (amt) => rand.range(1 - amt * FEEL.tone, 1 + amt * FEEL.tone)
const phrase = perlin.slow(4).range(-.05 * FEEL.dyn, 0)  // slow lean in and out

// ===================== PREVIEWS =====================
// 1 = every bar, or a per-bar mask. The 16-bar masks run bars 1-16.
const preview = {
  groove:   { kick_A: 1, snare: 1, ghost_A: 1, hats: 1, ticks: 1,
              fill_small: "<0!7 1>" },
  groove_b: { kick_B: 1, snare: 1, ghost_B: 1, hats_B: 1, ticks: 1,
              fill_small: "<0!3 1 0!3 1>" },
  // bars 1-8 groove (small fill on 8), bars 9-16 groove_b with the "_end"
  // loops (bar 16 left empty) and fill_big on bar 16
  phrase:   { kick_A: "<1!8 0!8>", snare: "<1!8 0!8>", ghost_A: "<1!8 0!8>",
              hats: "<1!8 0!8>", ticks: 1, fill_small: "<0!7 1 0!8>",
              kick_B_end: "<0!8 1!7 0>", snare_end: "<0!8 1!7 0>",
              ghost_B_end: "<0!8 1!7 0>", hats_B: "<0!8 1!8>",
              fill_big: "<0!15 1>" },
  build:    { hat_soft: 1, kick_muffled: "<0!4 1!4>", roll: "<0!4 1!4>" },
}

// ===================== ARRANGEMENT =====================
// bar numbers are 1-based. at([from, to], ...) = a per-bar mask, on in those bars
//
//    1- 8  Intro       soft hats; muffled kick joins at bar 5
//    9-24  Verse       idea 1 groove (A level); ticks join at bar 17; small fill, bar 16
//   25-32  Build       soft hats + muffled kick; roll in bars 29-32
//   33-48  Drop 1      B level (push kicks, busy ghosts, hat pickups, ticks);
//                      small fill bar 40; big fill replaces the beat on bar 48
//   49-56  Breakdown   soft hats + muffled kick; snare returns at bar 53;
//                      tumble fill replaces bar 56
//   57-72  Drop 2      as Drop 1, small fill bar 64, big fill on bar 72
//   73-80  Outro       A level groove for 4 bars, then soft hats + muffled kick
const TOTAL = 80
const at = (...ranges) => mini('<' + Array.from({ length: TOTAL }, (_, i) =>
  ranges.some(([a, b]) => i + 1 >= a && i + 1 <= b) ? '1' : '0').join(' ') + '>')

const song = {
  hat_soft:     at([1, 8], [25, 32], [49, 56], [77, 80]),
  kick_muffled: at([5, 8], [25, 32], [49, 55], [77, 80]),
  kick_A:       at([9, 24], [73, 76]),
  snare:        at([9, 24], [33, 47], [53, 55], [57, 71], [73, 76]),
  ghost_A:      at([9, 24], [73, 76]),
  hats:         at([9, 24], [73, 76]),
  ticks:        at([17, 24], [33, 48], [57, 72]),
  kick_B:       at([33, 47], [57, 71]),
  ghost_B:      at([33, 47], [57, 71]),
  hats_B:       at([33, 48], [57, 72]),
  roll:         at([29, 32]),
  fill_small:   at([16, 16], [40, 40], [64, 64]),
  fill_big:     at([48, 48], [72, 72]),
  fill_tumble:  at([56, 56]),
}
preview['song'] = song   // quoted so the exporter's "is this part used?" check sees it

// "_end" versions: same loop, bar 8 left silent so a big fill can take it
const endBar = "<1!7 0>"

const part = (name, pat) => {
  if (PART === name) return pat
  const m = preview[PART] && preview[PART][name]
  if (m === undefined) return silence
  return m === 1 ? pat : pat.mask(m)
}

// ===================== KICKS =====================
// Dead on the grid, barely varying: the anchor everything else moves around.
const kickA = s("kick ~ ~ ~ ~ ~ ~ ~ ~ ~ kick ~ ~ ~ ~ ~").n(11)
  .velocity(vary(.95))

// soft push kicks on a 4-bar cycle: bar 2 on the "e" of 4, bar 4 on the "&" of 4
const push = cat(
  silence,
  s("~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ kick ~ ~"),
  silence,
  s("~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ kick ~")).n(11)
  .gain(.8)                        // TWEAK: push-kick level
  .velocity(vary(.9))
const kickB = stack(kickA, push)

$: part('kick_A', kickA)
$: part('kick_B', kickB)
$: part('kick_A_end', kickA.mask(endBar))
$: part('kick_B_end', kickB.mask(endBar))

$: part('kick_muffled', s("kick ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~").n(11)
  .lpf(900))                       // TWEAK: lower = more distant

// ===================== SNARES =====================
// Backbeat sits slightly behind the beat: the relaxed liquid feel
const snare = s("~ ~ ~ ~ snare ~ ~ ~ ~ ~ ~ ~ snare ~ ~ ~").n(13)
  .nudge(FEEL.laidBack / 1000)
  .velocity(vary(.9).add(phrase))
  .speed(pitch(.01))

$: part('snare', snare)
$: part('snare_end', snare.mask(endBar))

// Ghosts: soft, a touch darker, loose in time
const ghostFx = p => p.n(13)
  .gain(.2)                        // TWEAK: how audible the ghosts are
  .velocity(vary(.55))
  .nudge(drift)
  .lpf(5000)
  .speed(pitch(.02))

// A: the "a" of 2 and the "a" of 4, thinning out every other bar
const ghostA = ghostFx(cat(
  s("~ ~ ~ ~ ~ ~ ~ snare ~ ~ ~ ~ ~ ~ ~ snare"),
  s("~ ~ ~ ~ ~ ~ ~ snare ~ ~ ~ ~ ~ ~ ~ ~")))

// B: a 4-bar answer phrase, so the ghosts talk back to the kick
const ghostB = ghostFx(cat(
  s("~ ~ ~ ~ ~ ~ ~ snare ~ ~ ~ ~ ~ ~ ~ snare"),
  s("~ ~ ~ ~ ~ ~ ~ snare ~ snare ~ ~ ~ ~ ~ ~"),
  s("~ ~ ~ ~ ~ ~ ~ snare ~ ~ ~ ~ ~ ~ ~ snare"),
  s("~ ~ ~ snare ~ ~ ~ snare ~ snare ~ ~ ~ ~ snare ~")))

$: part('ghost_A', ghostA)
$: part('ghost_B', ghostB)
$: part('ghost_A_end', ghostA.mask(endBar))
$: part('ghost_B_end', ghostB.mask(endBar))

// ===================== HATS =====================
// One part for closed + open hats so the choke is baked in:
// - open hats sit on the snare beats (steps 4 and 12), where no closed hat plays
// - each open hat is cut short when the next closed hat lands
const hatBase = () => stack(
  s("hat hat ~ hat hat hat ~ hat").n(7)
    .gain("[.5 .3]*4"),            // accented on the beat
  s("~ [ohat ~] ~ [ohat ~]").n(3)  // each open hat lasts one 8th...
    .clip(1).release(.02))         // ...then the pedal closes it

$: part('hats', hatBase()
  .nudge(swing.add(drift))
  .velocity(vary(.8).add(phrase))
  .speed(pitch(.015)))

// quiet 16th pickups on the "a" of 3 and the "a" of 4 (steps 11 and 15,
// neither shared with a closed or open hat), every other bar to keep it light
$: part('hats_B', stack(
  hatBase(),
  s("~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ hat ~ ~ ~ hat").n(7)
    .gain(.2).mask("<1 0>"))
  .nudge(swing.add(drift))
  .velocity(vary(.8).add(phrase))
  .speed(pitch(.015)))

$: part('ticks', s("hat*16").n(7)
  .gain(.1).hpf(8000)
  .nudge(swing.add(drift))
  .velocity(vary(.6))
  .speed(pitch(.02)))

$: part('hat_soft', s("hat*8").n(7)
  .gain("[.4 .2]*4")
  .lpf(saw.range(2000, 9000).slow(8))   // filter opens across the 8 bars
  .nudge(swing.add(drift))
  .velocity(vary(.8))
  .speed(pitch(.015)))

// ===================== FILLS AND ROLLS =====================
// Every fill/roll hit gets its own level and pitch, and chokes the last,
// so they never sound like a machine gun.

// two soft 16th pickups after the last backbeat (sits on top of a beat bar)
$: part('fill_small', s("~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ snare ~ snare").n(13)
  .gain(.35)
  .nudge(drift)
  .velocity(rand.range(1 - .2 * FEEL.dyn, 1))
  .speed(pitch(.03)))

// groove-based fill in 16ths that replaces the beat for one bar
$: part('fill_big', stack(
  s("kick ~ ~ ~").n(11),
  s("~ ~ ~ ~ snare ~ ~ snare ~ snare ~ snare snare ~ snare snare").n(13)
    .gain(saw.range(.35, .75))     // builds through the bar
    .nudge(drift)
    .velocity(rand.range(1 - .2 * FEEL.dyn, 1))
    .speed(pitch(.03))
    .cut(1)
))

// tom-style fill: kick on 1, backbeat, then 8th and 16th snares falling in pitch
$: part('fill_tumble', stack(
  s("kick ~ ~ ~").n(11),
  s("~ ~ ~ ~ snare ~ ~ ~ snare snare snare snare snare snare snare snare").n(13)
    .speed(saw.range(1.25, .8).mul(pitch(.01)))   // pitch falls across the bar
    .gain(saw.range(.4, .7))
    .nudge(drift)
    .velocity(rand.range(1 - .2 * FEEL.dyn, 1))
    .cut(1)
))

// 4-bar roll: quarters, 8ths, 8ths, 16ths, building in level
$: part('roll', s("snare*<4 8 8 16>").n(13)
  .gain(saw.range(.25, .7).slow(4))
  .nudge(drift)
  .velocity(rand.range(1 - .25 * FEEL.dyn, 1))
  .speed(pitch(.03))
  .cut(1))

// ===================== HEADROOM =====================
// leaves room for compression and limiting in Waveform; don't push it here
all(x => x.postgain(.8))
