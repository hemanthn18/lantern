import { useState, useRef, useEffect } from 'react'

const MAX = 240

export default function Composer({ onClose, onSubmit }) {
  const [body, setBody] = useState('')
  const [author, setAuthor] = useState('')
  const [closing, setClosing] = useState(false)
  const textareaRef = useRef(null)

  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const close = () => {
    setClosing(true)
    setTimeout(onClose, 280)
  }

  const submit = () => {
    const trimmed = body.trim()
    if (!trimmed) return
    setClosing(true)
    setTimeout(() => {
      onSubmit(trimmed, author.trim())
    }, 220)
  }

  const remaining = MAX - body.length
  const ready = body.trim().length > 0

  return (
    <div
      className={`composer-overlay ${closing ? 'closing' : ''}`}
      onClick={close}
    >
      <div className="composer" onClick={(e) => e.stopPropagation()}>
        <button className="composer-close" onClick={close} aria-label="Close">
          ✕
        </button>

        <div className="composer-eyebrow">a wish to the sky</div>

        <textarea
          ref={textareaRef}
          className="composer-textarea"
          placeholder="Write it here. No one has to know."
          value={body}
          maxLength={MAX}
          onChange={(e) => setBody(e.target.value)}
        />

        <div className="composer-meta">
          <input
            className="composer-author"
            type="text"
            placeholder="sign it (or leave it nameless)"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            maxLength={40}
          />
          <span className={`composer-count ${remaining < 40 ? 'low' : ''}`}>
            {remaining}
          </span>
        </div>

        <div className="composer-actions">
          <button className="composer-btn ghost" onClick={close}>
            Not yet
          </button>
          <button
            className={`composer-btn release ${ready ? 'ready' : ''}`}
            onClick={submit}
            disabled={!ready}
          >
            <span className="release-icon">✦</span>
            Release into the sky
          </button>
        </div>
      </div>
    </div>
  )
}