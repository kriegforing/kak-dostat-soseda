let songLoop
let step = 0
let isPlaying = false

// Кто что делает на своём шаге
const parts = {
  radiator: (note, time, velocity) => {
    playRadiator(note, time, velocity)
    show(() => flashSection(note), time)
  },
  pans: (note, time, velocity) => {
    playPan(note, time, velocity)
    show(() => flashPan(note), time)
  },
  bag: (hit, time, velocity) => {
    hitBag(time, velocity)
    show(squishBag, time)
  },
  drill: (hit, time, velocity) => {
    drillHit(time, velocity)
    show(shakeDrill, time)
  },
  neighbor: (hit, time, velocity) => {
    neighborKnock(time, velocity)
    show(showKnock, time)
  },
  neighborDrill: (hit, time, velocity) => {
    neighborDrillHit(time, velocity)
    show(showNeighborDrill, time)
  },
  bell: (note, time, velocity) => {
    ringBell(note, time, velocity)
    show(showBell, time)
  }
}

function createPlayer() {
  songLoop = new Tone.Loop((time) => {
    playStep(time)
    step = (step + 1) % (song.length * 16)
  }, '16n')
}

function playStep(time) {
  const barIndex = Math.floor(step / 16)
  const position = step % 16
  const bar = song[barIndex]
  const loudness = bar.soft ? 0.45 : 1

  if (position === 0) startBar(barIndex, bar, time)

  for (const part in parts) {
    const phrase = bar[part]
    if (!phrase) continue

    const token = steps[phrase][position]
    if (token === '.') continue

    const velocity = token === 'o' ? loudness * 0.45 : loudness
    parts[part](token, time, velocity)
  }
}

function startBar(barIndex, bar, time) {
  if (bar.riser === 'up') riseDrill(time)
  if (!bar.riser) resetDrill(time)

  const actIndex = acts.findIndex((act) => act.bar === barIndex)

  show(() => {
    drawBar(barIndex)
    if (actIndex >= 0) setAct(actIndex)
  }, time)
}

function show(callback, time) {
  Tone.getDraw().schedule(callback, time)
}

async function playSong() {
  await ensureAudio()
  step = 0

  if (!isPlaying) {
    isPlaying = true
    songLoop.start('+0.05')
    drawPlaying()
  }
}

function stopSong() {
  if (!isPlaying) return
  isPlaying = false
  songLoop.stop()
  drillSynth.triggerRelease(getStartTime('drill'))
  resetDrill()
  drawPlaying()
}
