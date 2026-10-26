// Пьеса «Суббота, 9:00»
const BPM = 100

// Один такт = 16 шагов. «.» — пауза, «x» — удар, «o» — тихий удар
const phrases = {
  // Батарея
  call: 'C5 . . . G4 . G4 . Bb4 . . . G4 . . .',
  call2: 'Eb5 . . . Bb4 . Bb4 . C5 . . . Bb4 . . .',
  fill: '. . F4 . G4 . Ab4 . G4 . . . F4 . G4 .',
  rise: '. . Ab4 . Bb4 . C5 . D5 . . . Eb5 . . .',
  march1: 'C5 . . . G4 . G4 . C5 . . . G4 . G4 .',
  march2: 'C5 . . . Ab4 . Ab4 . C5 . . . Ab4 . Ab4 .',
  march3: 'D5 . . . Bb4 . Bb4 . D5 . . . F5 . . .',
  arp: 'G4 . Bb4 . D5 . F5 . G5 . F5 . D5 . Bb4 .',
  frenzy: 'C5 G4 G4 Bb4 C5 G4 G4 Bb4 Eb5 Bb4 Bb4 C5 Eb5 Bb4 Bb4 C5',
  top: 'Ab5 . . . G5 . F5 . Eb5 . D5 . . . . .',

  // Сковородки
  gongC: 'C3 . . . . . . . . . . . . . . .',
  gongAb: 'Ab2 . . . . . . . . . . . . . . .',
  bassC: 'C3 . . . . . C3 . . . C3 . . . . .',
  bassAb: 'Ab2 . . . . . Ab2 . . . Ab2 . . . . .',
  bassBb: 'Bb2 . . . . . Bb2 . . . Bb2 . . . . .',
  bassG: 'G2 . . . . . G2 . . . G2 . . . . .',

  // Пакет
  rustle: '. . x . . . x . . . x . . . x .',
  shaker: 'o o x o o o x o o o x o o o x o',
  shakerEnd: 'o o x o o o x o o o x o . . . .',

  // Перфоратор
  drill1: 'x x x x . . . . . . . . . . . .',
  drill2: 'x x . . x x . . . . . . . . . .',
  riser: 'x x x x x x x x x x x x x x x x',
  drillEnd: 'x x x x x x x x x x x x . . . .',

  // Сосед
  answer: '. . . . o . . . o . . . . . . .',
  late: '. . . . . . . . . . . . x . x .',
  beat: 'x . . . . . . . x . . . . . . .',
  beat4: 'x . . . x . . . x . . . x . . .',
  rush: 'x . x . x . x . x x x x . . . .',
  hisDrill1: '. . . . . . . . x x x x . . . .',
  hisDrill2: '. . . . . . . . x x . . x x x x',
  hisDrill3: '. . x x . . x x . . x x . . x x',

  // Звонок
  dingDong: '. . . . E5 . . . C5 . . . . . . .'
}

// Части
const acts = [
  { name: 'Тихо', bar: 0, state: 'sleep', says: 'Хр-р-р…' },
  { name: 'Мусор', bar: 4, state: 'sit', says: 'Что за шорох?' },
  { name: 'Сковородки', bar: 8, state: 'stand', says: 'Ну всё.' },
  { name: 'Ремонт', bar: 12, state: 'drill', says: 'Я тоже так умею!' },
  { name: 'Звонок', bar: 16, state: 'gone', says: '' }
]

// Такты по порядку
const song = [
  // 1. Тихо
  { radiator: 'call' },
  { neighbor: 'answer' },
  { radiator: 'call2' },
  { neighbor: 'answer' },

  // 2. Мусор
  { radiator: 'call', bag: 'rustle', pans: 'gongC' },
  { radiator: 'fill', bag: 'rustle', neighbor: 'late' },
  { radiator: 'call2', bag: 'rustle', pans: 'gongAb' },
  { radiator: 'rise', bag: 'rustle', neighbor: 'late' },

  // 3. Сковородки
  { radiator: 'march1', pans: 'bassC', bag: 'shaker', neighbor: 'beat' },
  { radiator: 'march2', pans: 'bassAb', bag: 'shaker', neighbor: 'beat' },
  { radiator: 'march3', pans: 'bassBb', bag: 'shaker', neighbor: 'beat' },
  { radiator: 'arp', pans: 'bassG', bag: 'shaker', neighbor: 'beat4' },

  // 4. Ремонт
  { radiator: 'call', pans: 'bassC', bag: 'shaker', drill: 'drill1', neighbor: 'beat', neighborDrill: 'hisDrill1' },
  { radiator: 'call2', pans: 'bassAb', bag: 'shaker', drill: 'drill2', neighbor: 'beat4', neighborDrill: 'hisDrill2' },
  { radiator: 'frenzy', pans: 'bassBb', bag: 'shaker', drill: 'riser', riser: 'up', neighbor: 'beat4', neighborDrill: 'hisDrill3' },
  { radiator: 'top', pans: 'bassG', bag: 'shakerEnd', drill: 'drillEnd', riser: 'top', neighbor: 'rush' },

  // 5. Звонок
  { radiator: 'call', soft: true },
  { bell: 'dingDong' },
  { pans: 'gongC', soft: true },
  {}
]

// Фразы по шагам
const steps = {}
for (const name in phrases) {
  steps[name] = phrases[name].split(' ')
}
