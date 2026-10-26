let radiatorMetal, panMetal, pipeTone, bagSynth, drillSynth, drillFilter
let neighborSynth, neighborDrillSynth, bellSynth
let distortionNode, delayNode, reverbNode
let bagLoop
let audioIsReady = false
let audioStarting = null

// Батарея: удар
const radiatorSettings = {
  volume: -14,
  harmonicity: 5.1,
  modulationIndex: 32,
  octaves: 1.5,
  resonance: 3000,
  envelope: { attack: 0.001, decay: 0.15, release: 0.05 }
}

// Батарея и сковородки: звон трубы
const pipeSettings = {
  volume: 3,
  harmonicity: 2,
  modulationIndex: 10,
  oscillator: { type: 'sine' },
  modulation: { type: 'sine' },
  envelope: { attack: 0.001, decay: 1.2, sustain: 0, release: 0.8 },
  modulationEnvelope: { attack: 0.001, decay: 0.25, sustain: 0.1, release: 0.5 }
}

// Сковородки: удар
const panSettings = {
  volume: -18,
  harmonicity: 3.1,
  modulationIndex: 12,
  octaves: 0.8,
  resonance: 900,
  envelope: { attack: 0.001, decay: 0.6, release: 0.4 }
}

// Пакет
const bagSettings = {
  volume: 4,
  noise: { type: 'pink' },
  envelope: { attack: 0.001, decay: 0.04, sustain: 0, release: 0.02 }
}

// Перфоратор
const drillSettings = {
  volume: 5,
  noise: { type: 'white' },
  envelope: { attack: 0.01, decay: 0.05, sustain: 1, release: 0.08 }
}

// Сосед
const neighborSettings = {
  volume: -9,
  pitchDecay: 0.03,
  octaves: 5,
  envelope: { attack: 0.001, decay: 0.35, sustain: 0, release: 0.1 }
}

// Перфоратор соседа
const neighborDrillSettings = {
  volume: -5,
  noise: { type: 'brown' },
  envelope: { attack: 0.01, decay: 0.05, sustain: 1, release: 0.08 }
}

// Звонок
const bellSettings = {
  volume: -1,
  oscillator: { type: 'triangle' },
  envelope: { attack: 0.005, decay: 1.8, sustain: 0, release: 1.5 }
}

function initAudio() {
  if (!audioStarting) audioStarting = createAudio()
  return audioStarting
}

async function createAudio() {
  await Tone.start()

  // Эффекты
  Tone.getDestination().volume.value = -6
  const limiterNode = new Tone.Limiter(-3).toDestination()
  reverbNode = new Tone.Reverb({ decay: 2.8, preDelay: 0.02, wet: 0.3 })
  delayNode = new Tone.FeedbackDelay({ delayTime: '8n', feedback: 0.35, wet: 0.1 })
  distortionNode = new Tone.Distortion({ distortion: 0.2, wet: 0.1 })
  distortionNode.chain(delayNode, reverbNode, limiterNode)

  // Батарея и сковородки
  radiatorMetal = new Tone.MetalSynth(radiatorSettings).connect(distortionNode)
  panMetal = new Tone.MetalSynth(panSettings).connect(distortionNode)
  pipeTone = new Tone.PolySynth(Tone.FMSynth, pipeSettings).connect(distortionNode)

  // Пакет
  const bagFilter = new Tone.Filter(1400, 'highpass').connect(distortionNode)
  bagSynth = new Tone.NoiseSynth(bagSettings).connect(bagFilter)

  // Перфоратор
  const drillTremolo = new Tone.Tremolo(28, 0.9).start().connect(distortionNode)
  drillFilter = new Tone.Filter({ frequency: 900, type: 'bandpass', Q: 3 }).connect(drillTremolo)
  drillSynth = new Tone.NoiseSynth(drillSettings).connect(drillFilter)

  // Сосед за стеной
  const wallFilter = new Tone.Filter(450, 'lowpass').connect(limiterNode)
  neighborSynth = new Tone.MembraneSynth(neighborSettings).connect(wallFilter)
  const neighborTremolo = new Tone.Tremolo(22, 0.8).start().connect(wallFilter)
  neighborDrillSynth = new Tone.NoiseSynth(neighborDrillSettings).connect(neighborTremolo)

  // Звонок
  bellSynth = new Tone.Synth(bellSettings).connect(reverbNode)

  // Пакет в руках
  bagLoop = new Tone.Loop((time) => hitBag(time, 0.3 + Math.random() * 0.7), '32n')
  bagLoop.probability = 0.7
  bagLoop.humanize = '64n'

  Tone.getTransport().bpm.value = BPM
  Tone.getTransport().start()
  createPlayer()
  audioIsReady = true
}

// Один голос нельзя запустить дважды в одно время
const lastStartTime = {}

function getStartTime(voice, time = Tone.now()) {
  const startTime = Math.max(time, (lastStartTime[voice] || 0) + 0.005)
  lastStartTime[voice] = startTime
  return startTime
}

function randomVelocity() {
  return 0.8 + Math.random() * 0.2
}

function playRadiator(note, time, velocity = randomVelocity()) {
  const startTime = getStartTime('radiator', time)
  radiatorMetal.triggerAttackRelease(note, '32n', startTime, velocity)
  pipeTone.triggerAttackRelease(note, '8n', startTime, velocity)
}

function playPan(note, time, velocity = randomVelocity()) {
  const startTime = getStartTime('pan', time)
  panMetal.triggerAttackRelease(note, '8n', startTime, velocity)
  pipeTone.triggerAttackRelease(note, '4n', startTime, velocity * 0.7)
}

function hitBag(time, velocity = 1) {
  const duration = 0.01 + Math.random() * 0.05
  bagSynth.triggerAttackRelease(duration, getStartTime('bag', time), velocity)
}

function drillHit(time, velocity = 1) {
  drillSynth.triggerAttackRelease('16n', getStartTime('drill', time), velocity)
}

function startDrill() {
  drillSynth.triggerAttack(getStartTime('drill'))
}

function stopDrill() {
  drillSynth.triggerRelease(getStartTime('drill'))
}

function riseDrill(time) {
  drillFilter.frequency.rampTo(3500, '1m', time)
}

function resetDrill(time = Tone.now()) {
  drillFilter.frequency.cancelScheduledValues(time)
  drillFilter.frequency.setValueAtTime(900, time)
}

function neighborKnock(time, velocity = 1) {
  neighborSynth.triggerAttackRelease('G1', '16n', getStartTime('neighbor', time), velocity)
}

function neighborDrillHit(time, velocity = 1) {
  neighborDrillSynth.triggerAttackRelease('16n', getStartTime('neighborDrill', time), velocity)
}

function ringBell(note, time, velocity = 1) {
  bellSynth.triggerAttackRelease(note, '4n', getStartTime('bell', time), velocity)
}

// Сковородки-ручки
function setPanParam(param, amount) {
  if (!audioIsReady) return

  if (param === 'ring') {
    radiatorMetal.harmonicity = 1 + amount * 11
    pipeTone.set({ harmonicity: 1 + amount * 3 })
  }

  if (param === 'echo') {
    reverbNode.wet.value = amount * 0.8
    delayNode.wet.value = amount * 0.4
  }

  if (param === 'brightness') {
    radiatorMetal.resonance = 800 + amount * 6200
    panMetal.resonance = 400 + amount * 2400
    pipeTone.set({ modulationIndex: 2 + amount * 16 })
  }

  if (param === 'anger') {
    distortionNode.distortion = 0.1 + amount * 0.9
    distortionNode.wet.value = amount
  }
}
