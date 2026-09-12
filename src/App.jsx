import { useState, useEffect, useCallback } from 'react'
import Sky from './components/Sky'
import Composer from './components/Composer'
import Judgment from './components/Judgment'
import WishView from './components/WishView'
import './App.css'

const STORAGE_KEY = 'pythia-wishes'
const COOLDOWN_KEY = 'pythia-cooldown'

export default function App() {
  const [wishes, setWishes] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  const [cooldownUntil, setCooldownUntil] = useState(() => {
    try {
      const saved = localStorage.getItem(COOLDOWN_KEY)
      return saved || null
    } catch {
      return null
    }
  })

  const [composerOpen, setComposerOpen] = useState(false)
  const [pendingJudgment, setPendingJudgment] = useState(null)
  const [openId, setOpenId] = useState(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(wishes))
  }, [wishes])

  useEffect(() => {
    if (cooldownUntil) {
      localStorage.setItem(COOLDOWN_KEY, cooldownUntil)
    } else {
      localStorage.removeItem(COOLDOWN_KEY)
    }
  }, [cooldownUntil])

  useEffect(() => {
    if (!cooldownUntil) return
    const t = new Date(cooldownUntil).getTime()
    const now = Date.now()
    if (t <= now) {
      setCooldownUntil(null)
    } else {
      const timeout = setTimeout(() => setCooldownUntil(null), t - now)
      return () => clearTimeout(timeout)
    }
  }, [cooldownUntil])

  const handleComposerSubmit = (wish, why, timing) => {
    setComposerOpen(false)
    setPendingJudgment({ wish, why, timing })
  }

  const handleJudgmentComplete = (result) => {
    const now = new Date()
    const baseWish = {
      id: `w_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      wish: pendingJudgment.wish,
      why: pendingJudgment.why,
      verdict: result.verdict,
      score: result.score,
      observation: result.observation,
      createdAt: now.toISOString(),
      hue: 28 + Math.random() * 22,
    }

    const fullWish =
      result.verdict === 'GRANTED' && result.dateInfo
        ? {
            ...baseWish,
            dateString: result.dateInfo.dateString,
            dateISO: result.dateInfo.dateISO,
            days: result.dateInfo.days,
            sign: result.sign,
            fulfilled: false,
          }
        : baseWish

    setWishes((prev) => [...prev, fullWish])

    if (
      (result.verdict === 'DENIED' || result.verdict === 'UNCERTAIN') &&
      result.cooldownDays > 0
    ) {
      const until = new Date()
      until.setDate(until.getDate() + result.cooldownDays)
      setCooldownUntil(until.toISOString())
    }

    setPendingJudgment(null)
  }

  const openWish = useCallback((id) => setOpenId(id), [])
  const closeWish = useCallback(() => setOpenId(null), [])

  const markFulfilled = (id) => {
    setWishes((prev) =>
      prev.map((w) => (w.id === id ? { ...w, fulfilled: true } : w))
    )
    setOpenId(null)
  }

  const granted = wishes.filter((w) => w.verdict === 'GRANTED')
  const fulfilled = wishes.filter((w) => w.fulfilled)
  const openWishData = wishes.find((w) => w.id === openId)

  const isOnCooldown =
    cooldownUntil && new Date(cooldownUntil).getTime() > Date.now()
  const cooldownDaysLeft = isOnCooldown
    ? Math.ceil(
        (new Date(cooldownUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )
    : 0

  const showHero = granted.length === 0 && !isOnCooldown

  return (
    <div className={`app ${mounted ? 'mounted' : ''}`}>
      {/* HUD frame corners */}
      <div className="hud-frame" aria-hidden="true">
        <span className="corner tl" />
        <span className="corner tr" />
        <span className="corner bl" />
        <span className="corner br" />
      </div>

      <div className="vignette" aria-hidden="true" />
      <div className="grain" aria-hidden="true" />

      <Sky
        wishes={wishes}
        onOpen={openWish}
        paused={composerOpen || !!pendingJudgment || !!openId}
      />

      <header className="hud hud-top">
        <div className="brand">
          <span className="brand-mark">✦</span>
          <span className="brand-name">Pythia</span>
        </div>
        <div className="status">
          <span className="status-dot" />
          <span className="status-text">the sky is listening</span>
        </div>
      </header>

      {showHero && (
        <div className="hero">
          <div className="hero-kicker">
            <span>· entrance ·</span>
          </div>
          <div className="hero-line-1">Make a wish.</div>
          <div className="hero-line-2">Pythia might grant it.</div>
        </div>
      )}

      <div className="hud hud-bottom">
        {isOnCooldown ? (
          <div className="cooldown">
            <div className="cooldown-line">Pythia has closed its ear.</div>
            <div className="cooldown-sub">
              Return in {cooldownDaysLeft}{' '}
              {cooldownDaysLeft === 1 ? 'day' : 'days'}.
            </div>
          </div>
        ) : (
          <button
            className="write-btn"
            onClick={() => setComposerOpen(true)}
          >
            <span className="btn-ring" />
            <span className="write-icon">✦</span>
            <span className="btn-label">Ask Pythia</span>
          </button>
        )}
        <p className="hint">
          {wishes.length > 0
            ? `${wishes.length} spoken · ${granted.length} granted · ${fulfilled.length} fulfilled`
            : 'speak plainly'}
        </p>
      </div>

      {composerOpen && (
        <Composer
          onClose={() => setComposerOpen(false)}
          onSubmit={handleComposerSubmit}
        />
      )}

      {pendingJudgment && (
        <Judgment
          wish={pendingJudgment.wish}
          why={pendingJudgment.why}
          timing={pendingJudgment.timing}
          history={wishes}
          onComplete={handleJudgmentComplete}
        />
      )}

      {openWishData && (
        <WishView
          wish={openWishData}
          onClose={closeWish}
          onMarkFulfilled={markFulfilled}
        />
      )}
    </div>
  )
}