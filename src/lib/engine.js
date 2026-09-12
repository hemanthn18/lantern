// ============================================================
// PYTHIA — the god's brain
// ============================================================

// ------------------------------------------------------------
// 1. ANALYZE — read how the user wrote, not just what
// ------------------------------------------------------------
export function analyzeWish(wish, why, timing, history) {
  const hour = new Date().getHours()
  const w = (wish || '').trim()
  const y = (why || '').trim()

  const pastWishes = (history || []).map((h) => (h.wish || '').toLowerCase())
  const wishLower = w.toLowerCase()
  let maxSim = 0
  let mostSimilar = null
  for (let i = 0; i < pastWishes.length; i++) {
    const s = similarity(wishLower, pastWishes[i])
    if (s > maxSim) {
      maxSim = s
      mostSimilar = history[i]
    }
  }

  return {
    wishLength: w.length,
    whyLength: y.length,
    isEmptyWhy: y.length === 0,
    isShortWhy: y.length > 0 && y.length < 25,

    totalTime: timing.totalTime || 0,
    longestPause: timing.longestPause || 0,
    pauseCount: timing.pauseCount || 0,
    backspaceCount: timing.backspaceCount || 0,

    hourOfDay: hour,
    isLateNight: hour >= 1 && hour <= 4,
    isEvening: hour >= 21 && hour <= 23,

    hasPlease: /\b(please|pray|beg|begging)\b/i.test(w + ' ' + y),
    hasFear: /\b(scared|afraid|terrified|fear|anxious|worried|desperate)\b/i.test(w + ' ' + y),
    hasUrgency: /\b(before|deadline|by (january|february|march|april|may|june|july|august|september|october|november|december|next month|next year|soon|asap|urgent))\b/i.test(w + ' ' + y),
    hasEveryday: /\b(every ?day|always|constantly|nonstop|all the time)\b/i.test(w + ' ' + y),
    hasPerson: /\b(her|him|them|she|he|they|mom|dad|mother|father|sister|brother|wife|husband|boyfriend|girlfriend)\b/i.test(w),
    hasLoss: /\b(lost|losing|miss|missing|gone|left me|passed away|died)\b/i.test(w + ' ' + y),

    similarityToPast: maxSim,
    mostSimilarPast: mostSimilar,

    wish: w,
    why: y,
    moonPhase: getMoonPhase(new Date()),
  }
}

// ------------------------------------------------------------
// 2. JUDGE — decide the verdict
// ------------------------------------------------------------
export function judge(signals) {
  let score = 0

  if (signals.whyLength > 300) score += 3
  else if (signals.whyLength > 200) score += 2
  else if (signals.whyLength > 100) score += 1
  else if (signals.whyLength < 25 && signals.whyLength > 0) score -= 2
  else if (signals.isEmptyWhy) score -= 4

  if (signals.hasFear) score += 2
  if (signals.hasLoss) score += 2
  if (signals.hasPlease) score += 1
  if (signals.hasEveryday) score += 1
  if (signals.hasPerson) score += 1

  if (signals.totalTime > 120) score += 2
  else if (signals.totalTime > 60) score += 1
  if (signals.longestPause > 10) score += 2
  else if (signals.longestPause > 5) score += 1
  if (signals.backspaceCount > 30) score -= 2
  else if (signals.backspaceCount > 15) score -= 1

  if (signals.isLateNight) score += 1
  if (signals.isEvening) score += 1

  if (signals.similarityToPast > 0.8) score -= 4
  else if (signals.similarityToPast > 0.6) score -= 2
  else if (signals.similarityToPast > 0.4) score -= 1

  if (signals.hasUrgency) score -= 1

  let verdict
  if (score >= 5) verdict = 'GRANTED'
  else if (score >= 0) verdict = 'UNCERTAIN'
  else verdict = 'DENIED'

  let cooldownDays = 0
  if (verdict === 'DENIED' && score <= -5) {
    cooldownDays = Math.min(30, Math.max(3, Math.abs(score) * 2))
  } else if (verdict === 'UNCERTAIN') {
    cooldownDays = 1
  }

  return { verdict, score, cooldownDays }
}

// ------------------------------------------------------------
// 3. PICK DATE — variable, from signals, never the same
// ------------------------------------------------------------
export function pickDate(signals) {
  let days = 90

  if (signals.hasUrgency) days -= 30
  if (signals.hasFear) days += 15
  if (signals.whyLength > 300) days -= 20
  else if (signals.whyLength > 150) days -= 10
  if (signals.isShortWhy) days += 40
  if (signals.hasEveryday) days -= 25
  if (signals.isLateNight) days -= 15
  if (signals.hasLoss) days -= 20
  if (signals.hasPlease) days -= 8

  days = Math.max(21, Math.min(180, days))

  const date = new Date()
  date.setDate(date.getDate() + days)

  return {
    days,
    date,
    dateString: formatDate(date),
    dateISO: date.toISOString().slice(0, 10),
  }
}

function formatDate(d) {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ]
  return `${months[d.getMonth()]} ${d.getDate()}`
}

// ------------------------------------------------------------
// 4. PICK SIGN
// ------------------------------------------------------------
const SIGNS = [
  'A message will arrive before 10am on a Tuesday. Not from her.',
  'You will see the number 23 three times in one day.',
  'Someone will mention a place you have been thinking of. You will not say anything.',
  'One morning you will wake without thinking of it. That is the sign.',
  'There will be a phone call. You will hesitate before answering. Answer.',
  'A stranger will say one word that is meant for you. Do not dismiss it.',
  'You will find something you lost. Small. Insignificant. Take it as the sign.',
  'The rain will come when you are not expecting it. Stand in it for ten seconds.',
  'Someone will ask you a question you have asked yourself. Answer them honestly.',
  'You will see the same color twice in one hour. Notice it.',
  'A door will open that you did not knock on. Walk through.',
  'You will remember something you had forgotten. It will matter.',
]

export function pickSign(signals) {
  const seed = hashString(signals.wish + signals.why)
  return SIGNS[seed % SIGNS.length]
}

// ------------------------------------------------------------
// 5. PICK OBSERVATION
// ------------------------------------------------------------
export function pickObservation(signals) {
  const obs = []

  if (signals.isEmptyWhy) {
    obs.push('You did not write a why. This is a confession, not a request.')
  }
  if (signals.longestPause > 8) {
    obs.push('You paused before writing the name you did not want to write.')
  } else if (signals.longestPause > 4) {
    obs.push('You paused. Pythia noticed where.')
  }
  if (signals.backspaceCount > 25) {
    obs.push('You deleted much. What you kept is what you meant.')
  }
  if (signals.similarityToPast > 0.6 && signals.mostSimilarPast) {
    const month = new Date(signals.mostSimilarPast.createdAt || Date.now())
      .toLocaleString('en-US', { month: 'long' })
    obs.push(
      `You have asked this before. In ${month}. You did nothing. This is not a wish. It is a habit.`
    )
  }
  if (signals.isLateNight) {
    obs.push(
      `It is ${signals.hourOfDay} in the morning. Pythia hears wishes differently at this hour.`
    )
  }
  if (signals.hasFear) {
    obs.push('You wrote that you are afraid. Fear is heard differently than want.')
  }
  if (signals.hasPlease) {
    obs.push('You said please. Pythia does not require it. But it was noted.')
  }
  if (signals.hasUrgency) {
    obs.push('You gave a deadline. Pythia is not impressed by urgency.')
  }
  if (signals.wishLength < 15) {
    obs.push('Few words. Are you sure this is what you want?')
  }
  if (signals.whyLength > 300) {
    obs.push('You wrote a long why. You have been carrying this for a while.')
  }
  if (signals.totalTime > 120) {
    obs.push('You spent minutes on this. Pythia watched you write.')
  }
  if (signals.hasLoss) {
    obs.push('You wrote about loss. Pythia knows this weight.')
  }

  if (obs.length === 0) return null
  const seed = hashString(signals.wish + signals.why + Date.now())
  return obs[seed % obs.length]
}

// ------------------------------------------------------------
// 6. MOON PHASE
// ------------------------------------------------------------
export function getMoonPhase(date) {
  const newMoon = new Date('2000-01-06T18:14:00Z')
  const days = (date - newMoon) / (1000 * 60 * 60 * 24)
  const synodic = 29.530588853
  const phase = ((days % synodic) + synodic) % synodic / synodic
  return phase
}

export function moonPhaseName(phase) {
  if (phase < 0.03 || phase > 0.97) return 'new moon'
  if (phase < 0.22) return 'waxing crescent'
  if (phase < 0.28) return 'first quarter'
  if (phase < 0.47) return 'waxing gibbous'
  if (phase < 0.53) return 'full moon'
  if (phase < 0.72) return 'waning gibbous'
  if (phase < 0.78) return 'last quarter'
  return 'waning crescent'
}

// ------------------------------------------------------------
// 7. SIMILARITY
// ------------------------------------------------------------
export function similarity(a, b) {
  if (!a || !b) return 0
  const stopWords = new Set([
    'i', 'a', 'an', 'the', 'to', 'of', 'and', 'or', 'but', 'is', 'am', 'are',
    'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does',
    'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can',
    'my', 'me', 'you', 'your', 'it', 'its', 'for', 'on', 'in', 'at', 'by',
    'with', 'from', 'this', 'that', 'these', 'those', 'so', 'if', 'as',
  ])
  const tokens = (s) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w && !stopWords.has(w))
  const A = new Set(tokens(a))
  const B = new Set(tokens(b))
  if (A.size === 0 || B.size === 0) return 0
  let inter = 0
  for (const w of A) if (B.has(w)) inter++
  const union = A.size + B.size - inter
  return inter / union
}

// ------------------------------------------------------------
// 8. HASH
// ------------------------------------------------------------
function hashString(s) {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h)
}