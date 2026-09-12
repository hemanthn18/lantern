import { useState, useEffect, useMemo, useRef } from 'react'
import {
  analyzeWish,
  judge,
  pickDate,
  pickSign,
  pickObservation,
  moonPhaseName,
} from '../lib/engine'

function TypeLine({ text, speed = 40, className = '', onDone }) {
  const [displayed, setDisplayed] = useState('')
  const onDoneRef = useRef(onDone)
  onDoneRef.current = onDone

  useEffect(() => {
    if (!text) {
      // nothing to type — immediately signal done
      if (onDoneRef.current) onDoneRef.current()
      return
    }
    setDisplayed('')
    let i = 0
    const interval = setInterval(() => {
      i++
      setDisplayed(text.slice(0, i))
      if (i >= text.length) {
        clearInterval(interval)
        if (onDoneRef.current) onDoneRef.current()
      }
    }, speed)
    return () => clearInterval(interval)
  }, [text, speed])

  if (!text) return null

  return (
    <span className={className}>
      {displayed}
      <span className="type-cursor">▍</span>
    </span>
  )
}

export default function Judgment({ wish, why, timing, history, onComplete }) {
  const result = useMemo(() => {
    const signals = analyzeWish(wish, why, timing, history)
    const { verdict, score, cooldownDays } = judge(signals)
    const observation = pickObservation(signals)
    const dateInfo = verdict === 'GRANTED' ? pickDate(signals) : null
    const sign = verdict === 'GRANTED' ? pickSign(signals) : null
    const moon = moonPhaseName(signals.moonPhase)
    return { signals, verdict, score, cooldownDays, observation, dateInfo, sign, moon }
  }, [wish, why, timing, history])

  const [phase, setPhase] = useState('reading')

  // Reading → observation (or verdict if no observation)
  useEffect(() => {
    const t = setTimeout(() => {
      if (result.observation) {
        setPhase('observation')
      } else {
        setPhase('verdict')
      }
    }, 1800)
    return () => clearTimeout(t)
  }, [result.observation])

  // Safety net: if anything hangs, force verdict after 6s
  useEffect(() => {
    if (phase === 'reading' || phase === 'observation') {
      const t = setTimeout(() => {
        setPhase((p) => (p === 'details' ? p : 'verdict'))
      }, 8000)
      return () => clearTimeout(t)
    }
  }, [phase])

  const handleObservationDone = () => {
    setTimeout(() => setPhase('verdict'), 500)
  }

  const handleVerdictDone = () => {
    setTimeout(() => setPhase('details'), 700)
  }

  return (
    <div className="judgment-overlay">
      <div className="judgment-inner">
        {phase === 'reading' && (
          <div className="judgment-reading">
            <div className="reading-orb" />
            <div className="reading-text">Pythia is reading</div>
          </div>
        )}

        {phase !== 'reading' && (
          <div className="judgment-stage">
            {phase === 'observation' && result.observation && (
              <div className="judgment-observation">
                <TypeLine
                  text={result.observation}
                  speed={42}
                  onDone={handleObservationDone}
                />
              </div>
            )}

            {(phase === 'verdict' || phase === 'details') && (
              <div
                className={`judgment-verdict verdict-${result.verdict.toLowerCase()}`}
              >
                <TypeLine
                  text={result.verdict}
                  speed={130}
                  onDone={handleVerdictDone}
                />
              </div>
            )}

            {phase === 'details' && (
              <div className="judgment-details">
                {result.verdict === 'GRANTED' && result.dateInfo && (
                  <>
                    <div className="jd-date">{result.dateInfo.dateString}</div>
                    <div className="jd-sign">
                      <span className="jd-label">Watch for this:</span>
                      {result.sign}
                    </div>
                    <div className="jd-moon">
                      The moon tonight is {result.moon}.
                    </div>
                  </>
                )}

                {result.verdict === 'DENIED' && (
                  <>
                    {result.cooldownDays > 0 ? (
                      <div className="jd-date">
                        Pythia has closed its ear for {result.cooldownDays} days.
                      </div>
                    ) : (
                      <div className="jd-date">Rewrite. Ask again.</div>
                    )}
                    <div className="jd-moon">
                      The moon tonight is {result.moon}.
                    </div>
                  </>
                )}

                {result.verdict === 'UNCERTAIN' && (
                  <>
                    <div className="jd-date">
                      Ask again on the next full moon.
                    </div>
                    <div className="jd-moon">
                      The moon tonight is {result.moon}.
                    </div>
                  </>
                )}

                <button
                  className="jd-close"
                  onClick={() => onComplete(result)}
                >
                  Close
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}