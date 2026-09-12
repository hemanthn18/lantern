// ============================================================
// PYTHIA — sky engine
// ============================================================

export const rand = (min, max) => min + Math.random() * (max - min)

// ------------------------------------------------------------
// Moon phase
// ------------------------------------------------------------
function getMoonPhase(date) {
  const newMoon = new Date('2000-01-06T18:14:00Z')
  const days = (date - newMoon) / (1000 * 60 * 60 * 24)
  const synodic = 29.530588853
  return (((days % synodic) + synodic) % synodic) / synodic
}

// ------------------------------------------------------------
// Lantern
// ------------------------------------------------------------
export class Lantern {
  constructor(wish, w, h) {
    this.wish = wish
    this.hue = wish.hue || 32
    this.x = rand(w * 0.15, w * 0.85)
    this.y = rand(h * 0.2, h * 0.85)
    this.vx = rand(-6, 6)
    this.vy = rand(-10, -4)
    this.baseW = 42
    this.w = this.baseW
    this.h = this.baseW * 1.35
    this.phase = rand(0, Math.PI * 2)
    this.fleeRadius = 38
    this.spawnedAt = performance.now()
    this.alpha = 0
    this.heartbeat = rand(0.9, 1.4)
    this.heartbeatPhase = rand(0, Math.PI * 2)
    this.trail = []
  }

  update(dt, w, h, pointer, now) {
    const t = now * 0.001
    const age = (now - this.spawnedAt) / 1000
    this.alpha = Math.min(1, age * 0.9)

    if (pointer.active) {
      const dx = this.x - pointer.x
      const dy = this.y - pointer.y
      const d2 = dx * dx + dy * dy
      const r = this.fleeRadius
      if (d2 < r * r) {
        const d = Math.max(Math.sqrt(d2), 0.001)
        const force = ((r - d) / r) * 150
        this.vx += (dx / d) * force * dt
        this.vy += (dy / d) * force * dt
      }
    }

    this.vx += Math.sin(t * 0.6 + this.phase) * 6 * dt
    if (this.vy > -14) this.vy -= 4 * dt
    if (this.y < h * 0.18) this.vy += 8 * dt
    if (this.y > h * 0.9) this.vy -= 12 * dt

    this.vx *= 1 - 1.6 * dt
    this.vy *= 1 - 1.6 * dt

    this.x += this.vx * dt * 6
    this.y += this.vy * dt * 6

    const pad = this.w * 0.6
    if (this.x < pad) { this.x = pad; this.vx = Math.abs(this.vx) * 0.5 + 4 }
    if (this.x > w - pad) { this.x = w - pad; this.vx = -Math.abs(this.vx) * 0.5 - 4 }
    if (this.y < h * 0.12) { this.y = h * 0.12; this.vy = Math.abs(this.vy) * 0.4 }
    if (this.y > h - pad) { this.y = h - pad; this.vy = -Math.abs(this.vy) * 0.5 - 4 }

    this.heartbeatPhase += dt * this.heartbeat
    const hb = 1 + Math.sin(this.heartbeatPhase) * 0.03
    this.w = this.baseW * hb
    this.h = this.baseW * 1.35 * hb

    if (Math.random() < 0.25) {
      this.trail.push({ x: this.x, y: this.y + this.h * 0.2, life: 1 })
    }
    for (let i = this.trail.length - 1; i >= 0; i--) {
      this.trail[i].life -= dt * 0.9
      this.trail[i].y -= 8 * dt
      if (this.trail[i].life <= 0) this.trail.splice(i, 1)
    }
  }

  contains(px, py) {
    const dx = (px - this.x) / (this.w * 1.5)
    const dy = (py - this.y) / (this.h * 1.7)
    return dx * dx + dy * dy <= 1
  }

  draw(ctx) {
    const a = this.alpha
    if (a <= 0) return
    const cx = this.x
    const cy = this.y
    const hue = this.hue

    const glowR = this.w * 5
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowR)
    g.addColorStop(0, `hsla(${hue}, 90%, 72%, ${0.55 * a})`)
    g.addColorStop(0.3, `hsla(${hue}, 85%, 58%, ${0.16 * a})`)
    g.addColorStop(1, `hsla(${hue}, 80%, 45%, 0)`)
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(cx, cy, glowR, 0, Math.PI * 2)
    ctx.fill()

    for (const t of this.trail) {
      const tr = t.life * 2.5
      ctx.fillStyle = `hsla(${hue}, 90%, 65%, ${t.life * 0.25 * a})`
      ctx.beginPath()
      ctx.arc(t.x, t.y, tr, 0, Math.PI * 2)
      ctx.fill()
    }

    const w = this.w
    const h = this.h

    ctx.save()
    ctx.globalAlpha = a
    ctx.shadowColor = `hsla(${hue}, 95%, 65%, 0.9)`
    ctx.shadowBlur = 28

    const topW = w * 0.62
    const botW = w * 0.78
    const topY = cy - h * 0.45
    const botY = cy + h * 0.5

    const bodyGrad = ctx.createLinearGradient(cx - w, cy, cx + w, cy)
    bodyGrad.addColorStop(0, `hsla(${hue}, 80%, 58%, 0.95)`)
    bodyGrad.addColorStop(0.45, `hsla(${hue + 8}, 95%, 78%, 1)`)
    bodyGrad.addColorStop(1, `hsla(${hue}, 80%, 55%, 0.95)`)

    ctx.beginPath()
    ctx.moveTo(cx - topW / 2, topY)
    ctx.lineTo(cx + topW / 2, topY)
    ctx.quadraticCurveTo(cx + botW / 2 + 4, cy, cx + botW / 2, botY)
    ctx.lineTo(cx - botW / 2, botY)
    ctx.quadraticCurveTo(cx - botW / 2 - 4, cy, cx - topW / 2, topY)
    ctx.closePath()
    ctx.fillStyle = bodyGrad
    ctx.fill()

    ctx.shadowBlur = 0
    const innerG = ctx.createRadialGradient(cx, cy + h * 0.15, 0, cx, cy + h * 0.15, w * 0.55)
    innerG.addColorStop(0, `hsla(48, 100%, 92%, ${0.9 * a})`)
    innerG.addColorStop(0.5, `hsla(${hue + 15}, 100%, 75%, ${0.5 * a})`)
    innerG.addColorStop(1, `hsla(${hue}, 90%, 60%, 0)`)
    ctx.fillStyle = innerG
    ctx.beginPath()
    ctx.arc(cx, cy + h * 0.15, w * 0.55, 0, Math.PI * 2)
    ctx.fill()

    ctx.strokeStyle = `hsla(${hue}, 60%, 35%, ${0.35 * a})`
    ctx.lineWidth = 1
    for (let i = -1; i <= 1; i++) {
      const rx = cx + i * (w * 0.18)
      ctx.beginPath()
      ctx.moveTo(rx, topY + 2)
      ctx.lineTo(cx + i * (w * 0.24), botY - 2)
      ctx.stroke()
    }

    ctx.fillStyle = `hsla(${hue}, 50%, 25%, ${0.85 * a})`
    ctx.fillRect(cx - topW / 2 - 2, topY - 3, topW + 4, 3)
    ctx.fillRect(cx - botW / 2 - 1, botY, botW + 2, 3)

    ctx.strokeStyle = `hsla(${hue}, 40%, 30%, ${0.5 * a})`
    ctx.beginPath()
    ctx.moveTo(cx, botY + 3)
    ctx.lineTo(cx, botY + 8)
    ctx.stroke()

    ctx.restore()
  }
}

// ------------------------------------------------------------
// Embers
// ------------------------------------------------------------
export class Ember {
  constructor(x, y, hue) {
    this.x = x
    this.y = y
    const angle = rand(-Math.PI * 0.85, -Math.PI * 0.15)
    const speed = rand(60, 240)
    this.vx = Math.cos(angle) * speed
    this.vy = Math.sin(angle) * speed
    this.hue = hue + rand(-14, 14)
    this.life = 1
    this.decay = rand(0.35, 0.75)
    this.size = rand(1.5, 3.8)
    this.gravity = rand(40, 90)
  }
  update(dt) {
    this.life -= dt * this.decay
    this.vy += this.gravity * dt
    this.vx *= 1 - 0.9 * dt
    this.x += this.vx * dt
    this.y += this.vy * dt
  }
  draw(ctx) {
    if (this.life <= 0) return
    const a = Math.max(0, this.life)
    const g = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size * 6)
    g.addColorStop(0, `hsla(${this.hue}, 100%, 80%, ${a})`)
    g.addColorStop(0.4, `hsla(${this.hue}, 95%, 60%, ${a * 0.5})`)
    g.addColorStop(1, `hsla(${this.hue}, 90%, 50%, 0)`)
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.size * 6, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = `hsla(${this.hue}, 100%, 92%, ${a})`
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
    ctx.fill()
  }
}

// ============================================================
// SKY STATE (module-level for persistent shooting stars, dust, aurora)
// ============================================================
let shootingStars = []
let lastShootingSpawn = 0
let dustMotes = []
let auroraTime = 0

// ------------------------------------------------------------
// Shooting stars
// ------------------------------------------------------------
function spawnShootingStar(w, h) {
  const fromLeft = Math.random() < 0.5
  const startX = fromLeft ? rand(-100, w * 0.2) : rand(w * 0.8, w + 100)
  const startY = rand(h * 0.05, h * 0.4)
  const angle = fromLeft ? rand(0.15, 0.35) : Math.PI - rand(0.15, 0.35)
  const speed = rand(900, 1500)
  shootingStars.push({
    x: startX,
    y: startY,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed * 0.55,
    life: 1,
    decay: rand(0.9, 1.4),
    width: rand(1.2, 2.2),
    length: rand(140, 240),
  })
}

function updateShootingStars(ctx, w, h, dt, now) {
  if (now - lastShootingSpawn > rand(14000, 32000)) {
    lastShootingSpawn = now
    spawnShootingStar(w, h)
  }

  for (let i = shootingStars.length - 1; i >= 0; i--) {
    const s = shootingStars[i]
    s.life -= dt * s.decay
    s.x += s.vx * dt
    s.y += s.vy * dt

    if (s.life <= 0) {
      shootingStars.splice(i, 1)
      continue
    }

    const a = s.life
    const mag = Math.hypot(s.vx, s.vy)
    const dx = -s.vx / mag
    const dy = -s.vy / mag
    const tailX = s.x + dx * s.length
    const tailY = s.y + dy * s.length

    const grad = ctx.createLinearGradient(s.x, s.y, tailX, tailY)
    grad.addColorStop(0, `rgba(255, 250, 235, ${a})`)
    grad.addColorStop(0.3, `rgba(240, 220, 180, ${a * 0.5})`)
    grad.addColorStop(1, 'rgba(240, 220, 180, 0)')

    ctx.strokeStyle = grad
    ctx.lineWidth = s.width
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(s.x, s.y)
    ctx.lineTo(tailX, tailY)
    ctx.stroke()

    const headG = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, 8)
    headG.addColorStop(0, `rgba(255, 250, 235, ${a})`)
    headG.addColorStop(0.4, `rgba(255, 240, 210, ${a * 0.45})`)
    headG.addColorStop(1, 'rgba(255, 240, 210, 0)')
    ctx.fillStyle = headG
    ctx.beginPath()
    ctx.arc(s.x, s.y, 8, 0, Math.PI * 2)
    ctx.fill()
  }
}

// ------------------------------------------------------------
// Aurora borealis — soft ribbons across the upper sky
// ------------------------------------------------------------
function drawAurora(ctx, w, h, now) {
  const t = now * 0.001
  const ribbons = [
    { hue: 160, yBase: h * 0.08, amp: 30, phase: 0, alpha: 0.14, speed: 0.15 },
    { hue: 200, yBase: h * 0.15, amp: 45, phase: 1.3, alpha: 0.12, speed: 0.12 },
    { hue: 280, yBase: h * 0.22, amp: 25, phase: 2.7, alpha: 0.10, speed: 0.18 },
    { hue: 180, yBase: h * 0.30, amp: 55, phase: 4.1, alpha: 0.07, speed: 0.1 },
  ]

  ctx.save()
  ctx.globalCompositeOperation = 'screen'

  for (const r of ribbons) {
    const yOff = Math.sin(t * r.speed + r.phase) * r.amp

    // vertical gradient from glow to nothing
    const grad = ctx.createLinearGradient(0, 0, 0, h * 0.55)
    grad.addColorStop(0, `hsla(${r.hue}, 80%, 60%, 0)`)
    grad.addColorStop(0.25, `hsla(${r.hue}, 80%, 60%, ${r.alpha})`)
    grad.addColorStop(0.6, `hsla(${r.hue}, 80%, 60%, ${r.alpha * 0.4})`)
    grad.addColorStop(1, `hsla(${r.hue}, 80%, 60%, 0)`)

    ctx.fillStyle = grad

    // wavy ribbon shape
    ctx.beginPath()
    ctx.moveTo(0, 0)
    const segments = 20
    for (let i = 0; i <= segments; i++) {
      const x = (w / segments) * i
      const wave =
        Math.sin(t * r.speed * 2 + i * 0.4 + r.phase) * 22 +
        Math.sin(t * r.speed * 3 + i * 0.7) * 12
      const y = r.yBase + wave + yOff
      ctx.lineTo(x, y)
    }
    ctx.lineTo(w, 0)
    ctx.closePath()
    ctx.fill()
  }

  ctx.restore()
}

// ------------------------------------------------------------
// Floating dust motes
// ------------------------------------------------------------
function ensureDust(w, h) {
  const target = Math.round((w * h) / 40000)
  if (dustMotes.length === 0) {
    for (let i = 0; i < target; i++) {
      dustMotes.push(makeDust(w, h, true))
    }
  } else if (dustMotes.length < target) {
    for (let i = dustMotes.length; i < target; i++) {
      dustMotes.push(makeDust(w, h, false))
    }
  }
}

function makeDust(w, h, anywhere) {
  return {
    x: Math.random() * w,
    y: anywhere ? Math.random() * h : h + 10,
    r: rand(0.4, 1.3),
    vy: rand(-8, -22),
    vx: rand(-4, 4),
    drift: rand(0.2, 0.9),
    phase: rand(0, Math.PI * 2),
    life: 1,
    maxLife: rand(6, 16),
    age: 0,
  }
}

function updateAndDrawDust(ctx, w, h, dt, now) {
  ensureDust(w, h)

  for (let i = dustMotes.length - 1; i >= 0; i--) {
    const d = dustMotes[i]
    d.age += dt
    d.y += d.vy * dt
    d.x += (d.vx + Math.sin(now * 0.0006 + d.phase) * d.drift) * dt

    // fade in first, then out
    let a
    if (d.age < 2) a = d.age / 2
    else if (d.age > d.maxLife - 3) a = Math.max(0, (d.maxLife - d.age) / 3)
    else a = 1

    if (d.age > d.maxLife || d.y < -10) {
      dustMotes[i] = makeDust(w, h, false)
      continue
    }

    const alpha = a * 0.5
    const g = ctx.createRadialGradient(d.x, d.y, 0, d.x, d.y, d.r * 4)
    g.addColorStop(0, `rgba(230, 215, 180, ${alpha})`)
    g.addColorStop(1, 'rgba(230, 215, 180, 0)')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(d.x, d.y, d.r * 4, 0, Math.PI * 2)
    ctx.fill()
  }
}

// ------------------------------------------------------------
// Stars — with parallax depth
// ------------------------------------------------------------
export function makeStars(w, h, count) {
  const stars = []
  for (let i = 0; i < count; i++) {
    const r = Math.random()
    let type = 'faint'
    if (r < 0.02) type = 'flare'
    else if (r < 0.16) type = 'bright'
    else if (r < 0.5) type = 'medium'

    let radius
    if (type === 'flare') radius = rand(1.1, 1.9)
    else if (type === 'bright') radius = rand(0.8, 1.3)
    else if (type === 'medium') radius = rand(0.45, 0.85)
    else radius = rand(0.2, 0.45)

    stars.push({
      x: Math.random() * w,
      y: Math.random() * h,
      r: radius,
      baseA: type === 'faint' ? rand(0.12, 0.4) : rand(0.4, 0.95),
      twinkle: rand(0.3, 1.8),
      phase: rand(0, Math.PI * 2),
      // farther = bigger parallax (fake depth, more premium)
      depth: type === 'faint' ? rand(0.6, 1.4) : rand(0.2, 0.9),
      type,
    })
  }
  return stars
}

// ------------------------------------------------------------
// Draw sky
// ------------------------------------------------------------
let smoothMouse = { x: 0.5, y: 0.5 }

export function drawStars(ctx, stars, w, h, now, mouse) {
  const t = now * 0.001
  const dt = 0.016

  // smooth the mouse for parallax
  if (mouse) {
    smoothMouse.x += (mouse.x - smoothMouse.x) * 0.03
    smoothMouse.y += (mouse.y - smoothMouse.y) * 0.03
  }
  const parX = (smoothMouse.x - 0.5) * 2 // -1..1
  const parY = (smoothMouse.y - 0.5) * 2

  // base gradient
  const g = ctx.createLinearGradient(0, 0, 0, h)
  g.addColorStop(0, '#04030c')
  g.addColorStop(0.5, '#080618')
  g.addColorStop(1, '#0c0814')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)

  // nebulas (drifting)
  const driftX = Math.sin(t * 0.05) * 40
  const driftY = Math.cos(t * 0.04) * 30
  const neb = ctx.createRadialGradient(
    w * 0.72 + driftX,
    h * 0.22 + driftY,
    0,
    w * 0.72 + driftX,
    h * 0.22 + driftY,
    Math.max(w, h) * 0.8
  )
  neb.addColorStop(0, 'rgba(120, 80, 200, 0.09)')
  neb.addColorStop(0.4, 'rgba(200, 130, 90, 0.05)')
  neb.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = neb
  ctx.fillRect(0, 0, w, h)

  const neb2 = ctx.createRadialGradient(
    w * 0.15 - driftX,
    h * 0.75 - driftY,
    0,
    w * 0.15 - driftX,
    h * 0.75 - driftY,
    Math.max(w, h) * 0.6
  )
  neb2.addColorStop(0, 'rgba(80, 40, 140, 0.06)')
  neb2.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = neb2
  ctx.fillRect(0, 0, w, h)

  // aurora
  drawAurora(ctx, w, h, now)

  // moon
  drawMoon(ctx, w, h)

  // stars with parallax
  for (const s of stars) {
    const a = s.baseA * (0.5 + 0.5 * Math.sin(t * s.twinkle + s.phase))
    const px = s.x + parX * s.depth * -22
    const py = s.y + parY * s.depth * -22

    if (s.type === 'flare') {
      const len = s.r * 8
      const grad = ctx.createRadialGradient(px, py, 0, px, py, len)
      grad.addColorStop(0, `rgba(255, 250, 235, ${a * 0.9})`)
      grad.addColorStop(0.3, `rgba(240, 220, 180, ${a * 0.25})`)
      grad.addColorStop(1, 'rgba(240, 220, 180, 0)')
      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.arc(px, py, len, 0, Math.PI * 2)
      ctx.fill()

      ctx.strokeStyle = `rgba(255, 245, 220, ${a * 0.7})`
      ctx.lineWidth = 0.7
      ctx.beginPath()
      ctx.moveTo(px - len, py)
      ctx.lineTo(px + len, py)
      ctx.moveTo(px, py - len)
      ctx.lineTo(px, py + len)
      ctx.stroke()
    } else if (s.type === 'bright') {
      const grad = ctx.createRadialGradient(px, py, 0, px, py, s.r * 4)
      grad.addColorStop(0, `rgba(255, 250, 235, ${a})`)
      grad.addColorStop(0.5, `rgba(240, 220, 180, ${a * 0.25})`)
      grad.addColorStop(1, 'rgba(240, 220, 180, 0)')
      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.arc(px, py, s.r * 4, 0, Math.PI * 2)
      ctx.fill()
    } else {
      ctx.fillStyle = `rgba(240, 235, 220, ${a})`
      ctx.beginPath()
      ctx.arc(px, py, s.r, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  // dust on top of stars, below shooting stars
  updateAndDrawDust(ctx, w, h, dt, now)

  // shooting stars
  updateShootingStars(ctx, w, h, dt, now)
}

// ------------------------------------------------------------
// Moon
// ------------------------------------------------------------
function drawMoon(ctx, w, h) {
  const phase = getMoonPhase(new Date())
  const cx = w * 0.87
  const cy = h * 0.17
  const r = Math.min(w, h) * 0.03
  if (r < 14) return

  // outer halo
  const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 8)
  halo.addColorStop(0, 'rgba(240, 225, 190, 0.16)')
  halo.addColorStop(0.35, 'rgba(240, 225, 190, 0.05)')
  halo.addColorStop(1, 'rgba(240, 225, 190, 0)')
  ctx.fillStyle = halo
  ctx.beginPath()
  ctx.arc(cx, cy, r * 8, 0, Math.PI * 2)
  ctx.fill()

  // dim full disk
  ctx.fillStyle = 'rgba(240, 232, 210, 0.06)'
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.fill()

  // clip to the moon disk
  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.clip()

  // lit disk
  ctx.fillStyle = 'rgba(248, 242, 225, 0.96)'
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.fill()

  // craters (very subtle)
  ctx.fillStyle = 'rgba(200, 190, 170, 0.35)'
  ctx.beginPath()
  ctx.arc(cx - r * 0.3, cy - r * 0.2, r * 0.18, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(cx + r * 0.25, cy + r * 0.35, r * 0.12, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(cx + r * 0.1, cy - r * 0.5, r * 0.09, 0, Math.PI * 2)
  ctx.fill()

  // shadow
  const phaseAngle = phase * Math.PI * 2
  const shadowOffset = Math.cos(phaseAngle) * r * 2
  const isWaxing = phase < 0.5
  const xOffset = isWaxing ? -shadowOffset : shadowOffset

  ctx.fillStyle = 'rgba(5, 4, 16, 0.96)'
  ctx.beginPath()
  ctx.arc(cx + xOffset, cy, r * 1.02, 0, Math.PI * 2)
  ctx.fill()

  ctx.restore()

  // rim light
  ctx.strokeStyle = 'rgba(248, 242, 225, 0.3)'
  ctx.lineWidth = 0.6
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.stroke()
}