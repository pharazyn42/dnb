// PIANO IDEA: transcription check (from IMG_4760.mov)
// Paste into Strudel and press play. This is only my reading of what you
// played, so you can check the notes and chords by ear before we build the track.
//
// Your 8th notes (~100 BPM, played freely) become quarter notes at 174,
// which is almost the same speed (0.30 s vs 0.34 s per note).
// So each of your bars = 2 bars at 174, and the whole idea = 16 bars.

setcpm(174/4)
// to hear it closer to the speed you played it, use this instead:
// setcpm(200/4)

// right hand: the A-B-C-E figure, low octave for 8 bars, then up an octave
$: note("<[a4 b4 c5 e5]!8 [a5 b5 c6 e6]!8>")
  .s("piano").velocity(perlin.range(.75, .9)).clip(1.2).room(.3)

// left hand: your voicings, one chord per 2 bars
//   1 Am | 2 Am9 (the C comes from the right hand) | 3 Fmaj7 | 4 Am(add9)
//   5 Am | 6 C/G for one bar, then Am9 | 7 Fmaj7/A | 8 Am(add9)
$: note(`<
  [a3,c4]
  [a2,g3,b3,e4]
  [f2,f3,a3,c4,e4]
  [a2,e3,a3,b3,e4]
  [a2,a3,c4,e4]
  [[g3,c4,e4] [a2,g3,b3,e4]]
  [a2,f3,c4,e4]
  [e3,a3,b3,e4]
>/2`).s("piano").velocity(.6).clip(1).room(.3)
