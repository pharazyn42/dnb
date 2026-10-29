// DAYBREAK: DRUMS WORKBENCH (humanised)
// Every drum element on its own line. Tweak here, then export each as a loop.
//
// PRINCIPLE: performance lives here, sound lives in Waveform.
//   Here:     timing feel, dynamics, hit-to-hit variation, what a drummer can
//             physically play, hi-hat choke.
//   Waveform: EQ, compression, saturation, reverb, panning, loudness.
//   So these exports are deliberately dry, centred and un-compressed.
//
// HOW TO USE
// 1. Set PART to a preview ('grooveA', 'grooveB', 'build') to hear parts together.
// 2. Adjust the FEEL settings or any line marked TWEAK, then re-run (Ctrl+Enter).
// 3. Export everything to the loop library in one go (see the exporter README).
//    From this folder (C:\HomeProjects\jazzy-liquid-dnb\Strudel):
//      ..\tools\strudel-loop-exporter\export-loops.cmd daybreak-drums.strudel.js
//    or a few parts:  ... daybreak-drums.strudel.js --only snare,hats
//
// EXPORT LIST: read by the exporter. <part> <bars> <loop|oneshot>
//   loop    = seamless: tails from the end wrap round to the start
//   oneshot = placed once (fills, rolls): tails ring out past the end
//
// @track Daybreak
// @group drums
// @key Eb
// @kit ../Waveform/D_B Essentials/liquid-kit
// @library ../Library
// @export kick_A        8  loop      main kick, also the sidechain source
// @export kick_B        8  loop      adds the push kick before beat 4
// @export snare         8  loop      backbeat on 2 and 4, laid back
// @export ghost         8  loop      quiet off-beat snares
// @export hats          8  loop      closed + open hats with choke
// @export ticks         8  loop      quiet 16ths for extra energy
// @export hat_soft      8  loop      filtered hats that open up (builds)
// @export kick_muffled  8  loop      low-passed kick for intros/builds
// @export kick_A_end    8  loop      kick_A with bar 8 silent, for a big fill
// @export kick_B_end    8  loop      kick_B with bar 8 silent, for a big fill
// @export snare_end     8  loop      snare with bar 8 silent, for a big fill
// @export ghost_end     8  loop      ghost with bar 8 silent, for a big fill
// @export roll          4  oneshot   snare roll into a drop
// @export fill_small    1  oneshot   pickups ON TOP of a normal beat bar
// @export fill_big      1  oneshot   REPLACES kick + snare + ghost for that bar

setcpm(174/4)

const PART = 'grooveA'

// ===================== FEEL =====================
// TWEAK these to taste. Set them all to 0 to hear the robotic version.
const FEEL = {
  swing: 11,     // ms the off-beat 8th hats sit late (0 = straight, ~15 = lazy)
  laidBack: 4,   // ms the backbeat snare sits behind the beat (classic liquid)
  drift: 4,      // ms of random timing drift on hats, ghosts and fills
  dyn: 1,        // 0-1: how much hit levels vary (0 = machine-flat)
  tone: 1,       // 0-1: how much each hit's pitch varies (like a real drum's
}                //      hits never being identical)

const cyc = ms => ms / (240000 / 174)                  // ms -> cycles at 174
// timing feel uses nudge: seconds added to each sample's start at play time.
// Same result as shifting the pattern, but far cheaper for Strudel to compute.
// Always later, never earlier, so nothing falls before bar 1.
const swing = seq(0, FEEL.swing / 1000).fast(4)        // late on every off-8th
const drift = rand.range(0, FEEL.drift / 1000)         // fresh amount per hit
const vary = (lo) => perlin.range(1 - (1 - lo) * FEEL.dyn, 1)   // smooth level
const pitch = (amt) => rand.range(1 - amt * FEEL.tone, 1 + amt * FEEL.tone)
// slow 4-bar swell on top of the hit-to-hit variation, like a player
// leaning in and out across a phrase
const phrase = perlin.slow(4).range(-.05 * FEEL.dyn, 0)

// ===================== PREVIEWS =====================
// which parts play in each preview: 1 = every bar, or a per-bar mask
const preview = {
  // 8-bar phrase: main groove, small fill on bar 8
  grooveA: { kick_A: 1, snare: 1, ghost: 1, hats: 1, ticks: 1,
             fill_small: "<0!7 1>" },
  // 8-bar phrase: push-kick groove, big fill replacing the beat on bar 8
  // (uses the _end loops, exactly as you'd lay it out in Waveform)
  grooveB: { kick_B_end: 1, snare_end: 1, ghost_end: 1,
             hats: 1, ticks: 1, fill_big: "<0!7 1>" },
  // 8-bar build: soft hats throughout, muffled kick and roll in bars 5-8
  build:   { hat_soft: 1, kick_muffled: "<0!4 1!4>", roll: "<0!4 1!4>" },
}

// "_end" versions: same loop, bar 8 left silent so a big fill can take it
const endBar = "<1!7 0>"

const part = (name, pat) => {
  if (PART === name) return pat
  const m = preview[PART] && preview[PART][name]
  if (m === undefined) return silence
  return m === 1 ? pat : pat.mask(m)
}

// ===================== KICKS =====================
// The kick is the anchor: dead on the grid, barely varying. Everything
// else moves around it, which is what makes the groove feel human.
const kickA = s("kick ~ ~ ~ ~ ~ ~ ~ ~ ~ kick ~ ~ ~ ~ ~").n(11)
  .velocity(vary(.95))

const kickB = s("kick ~ ~ ~ ~ ~ ~ ~ ~ ~ kick ~ ~ kick ~ ~").n(11)
  .gain("1 .8")                    // TWEAK: push-kick level
  .velocity(vary(.95))

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

// Ghost notes: soft, a touch darker (a lightly struck snare has less
// crack), and loose in time
const ghost = s("~ ~ ~ ~ ~ ~ ~ snare ~ ~ ~ ~ ~ ~ ~ snare").n(13)
  .gain(.2)                        // TWEAK: how audible the ghosts are
  .velocity(vary(.55))
  .nudge(drift)
  .lpf(5000)
  .speed(pitch(.02))

$: part('ghost', ghost)
$: part('ghost_end', ghost.mask(endBar))

// ===================== HATS =====================
// One part for closed + open hats so the choke is baked in:
// - no closed hat is played at the same moment as an open one
//   (a drummer's hand can't do both)
// - each open hat is cut short when the next closed hat lands,
//   exactly like a real hi-hat pedal closing
$: part('hats', stack(
  s("hat hat ~ hat hat hat ~ hat").n(7)
    .gain("[.5 .3]*4"),            // accented on the beat
  s("~ [ohat ~] ~ [ohat ~]").n(3)  // each open hat lasts one 8th...
    .clip(1).release(.02)          // ...then the pedal closes it
)
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
