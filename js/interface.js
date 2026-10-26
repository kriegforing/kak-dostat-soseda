let soundIsOn = false
let anger = 0
let bagIsHeld = false
let drillIsHeld = false
let replyUntil = 0

let home, upstairs, bubble, crack, debris, neighborDoor, door, soundSwitch, player, bag, drill, bell

// Сосед без пьесы
const freeTalk = {
  sleep: 'Хр-р-р…',
  sit: 'Что там такое?',
  stand: 'Ну всё.'
}

// Звук
async function soundOn() {
  await initAudio()
  Tone.getDestination().mute = false
  soundIsOn = true
  soundSwitch.classList.add('isOn')
  soundSwitch.setAttribute('aria-pressed', 'true')
  home.classList.remove('isMuted')

  document.querySelectorAll('.Pan').forEach((pan) => {
    setPanParam(pan.dataset.param, Number(pan.dataset.value))
  })
}

function soundOff() {
  stopSong()
  releaseBag()
  releaseDrill()
  Tone.getDestination().mute = true
  soundIsOn = false
  soundSwitch.classList.remove('isOn')
  soundSwitch.setAttribute('aria-pressed', 'false')
  home.classList.add('isMuted')
}

async function ensureAudio() {
  if (!soundIsOn) await soundOn()
}

// Вспышки
function flash(element, className = 'isHit', duration = 160) {
  if (!element) return
  element.classList.remove(className)
  void element.offsetWidth
  element.classList.add(className)
  clearTimeout(element.flashTimer)
  element.flashTimer = setTimeout(() => element.classList.remove(className), duration)
}

function flashSection(note) {
  flash(document.querySelector(`.section[data-note="${note}"]`))
}

function flashPan(note) {
  flash(document.querySelector(`.Pan[data-note="${note}"] .panBody`))
  dropDebris()
}

// Пыль и камни
function dropDebris() {
  const crackEnd = Math.min(home.offsetWidth, 60 + (anger / 100) * 1120)
  const floor = home.offsetHeight - 24
  const stones = Math.round(anger / 20)
  const stoneSize = 4 + (anger / 100) * 14

  for (let i = 0; i < 12; i++) {
    const x = 50 + Math.random() * (crackEnd - 50)
    fall('dust', x, 3 + Math.random() * 4, 80 + Math.random() * 180, 1500)
  }

  for (let i = 0; i < stones; i++) {
    const x = 50 + Math.random() * (crackEnd - 50)
    const size = stoneSize * (0.7 + Math.random() * 0.6)
    fall('stone', x, size, floor - size, 2400)
  }
}

function fall(type, x, size, distance, duration) {
  const piece = document.createElement('span')
  piece.className = type
  piece.style.left = x + 'px'
  piece.style.width = size + 'px'
  piece.style.height = size + 'px'
  debris.append(piece)

  const drift = (Math.random() - 0.5) * 40
  const spin = (Math.random() - 0.5) * 540
  const start = { transform: 'translate(0, 0) rotate(0deg)', opacity: 1 }
  const end = { transform: `translate(${drift}px, ${distance}px) rotate(${spin}deg)` }

  let frames = [start, { ...end, opacity: 0 }]
  if (type === 'stone') {
    frames = [
      { ...start, easing: 'cubic-bezier(0.5, 0, 1, 0.5)' },
      { ...end, opacity: 1, offset: 0.35 },
      { ...end, opacity: 1, offset: 0.8 },
      { ...end, opacity: 0 }
    ]
  }

  piece.animate(frames, { duration, easing: type === 'dust' ? 'ease-out' : 'linear' }).onfinish = () => piece.remove()
}

function squishBag() {
  if (!bagIsHeld) flash(bag, 'isSquished', 110)
}

function shakeDrill() {
  if (!drillIsHeld) flash(drill, 'isOn', 150)
}

function showKnock() {
  flash(home, 'isKnocking', 220)
  flash(upstairs, 'isKnocking', 220)
  flash(crack, 'isFlashing', 220)
}

function showNeighborDrill() {
  flash(upstairs, 'isDrilling', 150)
}

function showBell() {
  flash(bell, 'isRinging', 900)
  flash(door, 'isRinging', 600)
}

// Батарея
async function hitSection(section) {
  await ensureAudio()
  playRadiator(section.dataset.note)
  flash(section)
  annoy(4)
}

// Сковородки
async function hitPan(pan) {
  await ensureAudio()
  playPan(pan.dataset.note)
  annoy(6)
  flashPan(pan.dataset.note)
}

function drawPan(pan, amount) {
  pan.querySelector('.panBody').style.transform = `rotate(${amount * 280 - 140}deg)`
}

function getAngle(element, event) {
  const box = element.getBoundingClientRect()
  const x = event.clientX - box.left - box.width / 2
  const y = event.clientY - box.top - box.height / 2
  return (Math.atan2(x, -y) * 180) / Math.PI
}

function setupPan(pan) {
  const panBody = pan.querySelector('.panBody')
  let isPressed = false
  let lastAngle = 0
  let turnedBy = 0

  drawPan(pan, Number(pan.dataset.value))

  panBody.addEventListener('pointerdown', (event) => {
    ensureAudio()
    isPressed = true
    turnedBy = 0
    lastAngle = getAngle(panBody, event)
    panBody.setPointerCapture(event.pointerId)
  })

  panBody.addEventListener('pointermove', (event) => {
    if (!isPressed) return

    const angle = getAngle(panBody, event)
    let delta = angle - lastAngle
    if (delta > 180) delta -= 360
    if (delta < -180) delta += 360
    lastAngle = angle
    turnedBy += Math.abs(delta)

    const amount = Math.min(1, Math.max(0, Number(pan.dataset.value) + delta / 280))
    pan.dataset.value = amount
    drawPan(pan, amount)
    setPanParam(pan.dataset.param, amount)
  })

  panBody.addEventListener('pointerup', () => {
    if (isPressed && turnedBy < 4) hitPan(pan)
    isPressed = false
  })

  panBody.addEventListener('pointercancel', () => {
    isPressed = false
  })
}

// Пакет
async function pressBag() {
  if (bagIsHeld) return
  bagIsHeld = true
  bag.classList.add('isSquished')

  await ensureAudio()
  if (bagIsHeld) {
    hitBag()
    bagLoop.start()
  }
}

function releaseBag() {
  if (!bagIsHeld) return
  bagIsHeld = false
  bag.classList.remove('isSquished')
  if (audioIsReady) bagLoop.stop()
}

// Перфоратор
async function pressDrill() {
  if (drillIsHeld) return
  drillIsHeld = true
  drill.classList.add('isOn')

  await ensureAudio()
  if (drillIsHeld) startDrill()
}

function releaseDrill() {
  if (!drillIsHeld) return
  drillIsHeld = false
  drill.classList.remove('isOn')
  if (audioIsReady) stopDrill()
}

// Звонок
async function ringDoorbell() {
  await ensureAudio()
  const now = Tone.now()
  ringBell('E5', now)
  ringBell('C5', now + 0.45)
  showBell()
}

// Сосед
function setNeighbor(state, text) {
  upstairs.dataset.state = state
  bubble.textContent = text
  bubble.hidden = !text
  neighborDoor.classList.toggle('isOpen', state === 'gone')
}

function setAnger(value) {
  anger = Math.min(100, Math.max(0, value))
  crack.style.strokeDashoffset = 100 - anger
  crack.classList.toggle('isAngry', anger > 66)
}

function annoy(amount) {
  if (isPlaying || !soundIsOn) return
  setAnger(anger + amount)
  if (anger >= 100) neighborReplies()
}

function neighborReplies() {
  const beat = Tone.Time('4n').toSeconds()
  const firstKnock = Tone.getTransport().nextSubdivision('4n')
  const knocks = [firstKnock, firstKnock + beat]

  knocks.forEach((time) => {
    neighborKnock(time)
    show(showKnock, time)
  })

  setAnger(60)
  setNeighbor('stand', 'Тук-тук!')
  replyUntil = Date.now() + 1800
}

function neighborTick() {
  if (isPlaying) return

  if (bagIsHeld) annoy(3)
  if (drillIsHeld) annoy(2)
  if (!bagIsHeld && !drillIsHeld) setAnger(anger - 0.5)

  if (Date.now() < replyUntil) return

  let state = 'sleep'
  if (anger > 33) state = 'sit'
  if (anger > 66) state = 'stand'
  setNeighbor(state, freeTalk[state])
}

// Пьеса
function drawBar(barIndex) {
  setAnger(((barIndex + 1) / 16) * 100)
}

function setAct(actIndex) {
  setNeighbor(acts[actIndex].state, acts[actIndex].says)
}

function drawPlaying() {
  player.classList.toggle('isPlaying', isPlaying)
  if (isPlaying) return

  setAnger(0)
  neighborTick()
}

// Клавиатура
function handleKeyDown(event) {
  if (event.repeat) return

  if (event.code === 'Space') {
    event.preventDefault()
    pressBag()
    return
  }

  if (event.code === 'KeyZ') pressDrill()
  if (event.code === 'KeyB') ringDoorbell()

  const section = document.querySelector(`.section[data-key="${event.code}"]`)
  const pan = document.querySelector(`.Pan[data-key="${event.code}"]`)
  if (section) hitSection(section)
  if (pan) hitPan(pan)
}

function handleKeyUp(event) {
  if (event.code === 'Space') {
    event.preventDefault()
    releaseBag()
  }

  if (event.code === 'KeyZ') releaseDrill()
}

document.addEventListener('DOMContentLoaded', () => {
  home = document.getElementById('home')
  upstairs = document.getElementById('upstairs')
  bubble = document.getElementById('bubble')
  crack = document.getElementById('crack')
  debris = document.getElementById('debris')
  neighborDoor = document.getElementById('neighborDoor')
  door = document.getElementById('door')
  soundSwitch = document.getElementById('soundSwitch')
  player = document.getElementById('player')
  bag = document.getElementById('bag')
  drill = document.getElementById('drill')
  bell = document.getElementById('bell')

  soundSwitch.addEventListener('click', () => {
    if (soundIsOn) {
      soundOff()
    } else {
      soundOn()
    }
  })

  document.getElementById('playButton').addEventListener('click', playSong)
  document.getElementById('stopButton').addEventListener('click', stopSong)

  document.querySelectorAll('.WallBottom .section').forEach((section) => {
    section.addEventListener('pointerdown', () => hitSection(section))
  })

  document.querySelectorAll('.Pan').forEach(setupPan)

  bag.addEventListener('pointerdown', (event) => {
    bag.setPointerCapture(event.pointerId)
    pressBag()
  })
  bag.addEventListener('pointerup', releaseBag)
  bag.addEventListener('pointercancel', releaseBag)

  drill.addEventListener('pointerdown', (event) => {
    drill.setPointerCapture(event.pointerId)
    pressDrill()
  })
  drill.addEventListener('pointerup', releaseDrill)
  drill.addEventListener('pointercancel', releaseDrill)

  bell.addEventListener('click', ringDoorbell)

  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('keyup', handleKeyUp)

  setInterval(neighborTick, 250)
  setAnger(0)
})
