import { useState, useRef, useEffect, useCallback } from 'react'

export default function Composer({ onClose, onSubmit }) {
  const [wish, setWish] = useState('')
  const [why, setWhy] = useState('')
  const [closing, setClosing] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const timingRef = useRef({
    firstKeystrokeAt: null,
    lastKeystrokeAt: null,
    longestPause: 0,
    pauseCount: 0,
    backspaceCount: 0,
    totalTime: 0,
  })

  const submittingRef = useRef(false)
  const wishRef = useRef(null)

  useEffect(() => {
    wishRef.current?.focus()
  }, [])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') handleClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const trackKeystroke = useCallback((isBackspace) => {
    const t = timingRef.current
    const now = performance.now()

    if (t.firstKeystrokeAt === null) t.firstKeystrokeAt = now

    if (t.lastKeystrokeAt !== null) {
      const pause = (now - t.lastKeystrokeAt) / 1000
      if (pause > t.longestPause) t.longestPause = pause
      if (pause > 2) t.pauseCount++
    }

    t.lastKeystrokeAt = now
    if (isBackspace) t.backspaceCount++

    if (t.firstKeystrokeAt) {
      t.totalTime = (now - t.firstKeystrokeAt) / 1000
    }
  }, [])

  const handleChange = (setter) => (e) => {
    const inputType = e.nativeEvent?.inputType || ''
    const isBackspace =
      inputType === 'deleteContentBackward' ||
      inputType === 'deleteContentForward'
    trackKeystroke(isBackspace)
    setter(e.target.value)
  }

  const handleClose = () => {
    if (submittingRef.current) return
    setClosing(true)
    setTimeout(onClose, 280)
  }

  const handleSubmit = () => {
    if (!wish.trim() || submittingRef.current) return
    submittingRef.current = true
    setSubmitting(true)

    const timing = { ...timingRef.current }

    setTimeout(() => {
      onSubmit(wish.trim(), why.trim(), timing)
    }, 700)
  }

  const canSubmit = wish.trim().length > 0 && !submitting

  return (
    <div
      className={`composer-overlay ${closing ? 'closing' : ''}`}
      onClick={handleClose}
    >
      <div className="composer" onClick={(e) => e.stopPropagation()}>
        <button
          className="composer-close"
          onClick={handleClose}
          aria-label="Close"
          disabled={submitting}
        >
          ✕
        </button>

        <div className="composer-eyebrow">Pythia</div>
        <h2 className="composer-title">Speak. Be judged.</h2>

        <label className="composer-label">What do you want?</label>
        <textarea
          ref={wishRef}
          className="composer-textarea wish"
          placeholder="Say it plainly."
          value={wish}
          onChange={handleChange(setWish)}
          disabled={submitting}
          rows={2}
        />

        <label className="composer-label">Why do you need it?</label>
        <textarea
          className="composer-textarea why"
          placeholder="Tell the truth. Pythia is not fooled."
          value={why}
          onChange={handleChange(setWhy)}
          disabled={submitting}
          rows={5}
        />

        <div className="composer-actions">
          <button
            className="composer-btn ghost"
            onClick={handleClose}
            disabled={submitting}
          >
            Not yet
          </button>
          <button
            className={`composer-btn ask ${canSubmit ? 'ready' : ''}`}
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            {submitting ? 'Pythia is reading…' : 'Ask Pythia'}
          </button>
        </div>
      </div>
    </div>
  )
}