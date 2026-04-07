import { useState, useRef } from 'react'
import Head from 'next/head'

const MODES = [
  { id: 'rewrite', label: 'Casual Greek' },
  { id: 'translate', label: 'Translate + Adapt' },
  { id: 'improve', label: 'Improve Greek' },
  { id: 'variations', label: 'Tone Variations' },
]

const TONES = [
  { id: 'natural', label: 'Natural' },
  { id: 'playful', label: 'Playful' },
  { id: 'premium', label: 'Premium' },
  { id: 'direct', label: 'Direct' },
  { id: 'hype', label: 'Hype' },
]

const BLOBS = [
  { x: 0.18, y: 0.12, r: 0.55, ox: 0,   oy: 0,   spd: 1.0,  amp: 0.28 },
  { x: 0.72, y: 0.82, r: 0.48, ox: 1.7, oy: 2.3, spd: 0.78, amp: 0.22 },
  { x: 0.50, y: 0.48, r: 0.36, ox: 3.1, oy: 1.1, spd: 1.25, amp: 0.18 },
  { x: 0.85, y: 0.22, r: 0.30, ox: 4.6, oy: 3.8, spd: 0.55, amp: 0.20 },
  { x: 0.12, y: 0.75, r: 0.32, ox: 5.9, oy: 0.7, spd: 0.90, amp: 0.16 },
]

function noise(ox, oy, t) {
  return (Math.sin(t*0.7+ox) + Math.sin(t*1.3+oy) + Math.sin(t*0.4+ox*0.5)) / 3
}

function AnimatedBg() {
  const canvasRef = useRef(null)
  const mouse = useRef({ x: -9999, y: -9999, active: false, targetR: 0, currentR: 0 })

  require('react').useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let W, H, rafId
    const m = mouse.current
    const SPEED = 0.0004

    const resize = () => {
      W = canvas.width  = window.innerWidth  * devicePixelRatio
      H = canvas.height = window.innerHeight * devicePixelRatio
    }
    resize()
    window.addEventListener('resize', resize)

    const onMove = e => { m.x = e.clientX*devicePixelRatio; m.y = e.clientY*devicePixelRatio; m.active=true; m.targetR=1 }
    const onLeave = () => { m.active=false; m.targetR=0 }
    const onTouch = e => { m.x=e.touches[0].clientX*devicePixelRatio; m.y=e.touches[0].clientY*devicePixelRatio; m.active=true; m.targetR=1 }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseleave', onLeave)
    window.addEventListener('touchmove', onTouch, { passive: false })
    window.addEventListener('touchend', onLeave)

    const draw = ts => {
      const t = ts * SPEED
      m.currentR += (m.targetR - m.currentR) * 0.06
      ctx.clearRect(0,0,W,H)
      ctx.fillStyle = '#0d0d0d'
      ctx.fillRect(0,0,W,H)

      for (const b of BLOBS) {
        const nx = b.x + noise(b.ox,b.oy,t*b.spd)*b.amp
        const ny = b.y + noise(b.oy+10,b.ox+5,t*b.spd*0.9)*b.amp*1.2
        const cx = nx*W, cy = ny*H
        const radius = b.r*Math.min(W,H)
        let prox = 0
        if (m.active) {
          const dist = Math.hypot(cx-m.x, cy-m.y)
          prox = Math.max(0, 1-dist/(Math.min(W,H)*0.6)) * m.currentR * 0.45
        }
        const bright = Math.min(0.55+noise(b.ox*2,b.oy,t*b.spd*0.6)*0.20+prox, 0.95)
        const mid    = Math.min(0.18+noise(b.oy*1.5,b.ox,t*b.spd*0.4)*0.08+prox*0.4, 0.5)
        const g = ctx.createRadialGradient(cx,cy,0,cx,cy,radius)
        g.addColorStop(0,    `rgba(80,230,30,${bright})`)
        g.addColorStop(0.25, `rgba(40,180,10,${mid})`)
        g.addColorStop(0.55, `rgba(20,100,5,${mid*0.3})`)
        g.addColorStop(1,    'rgba(0,0,0,0)')
        ctx.save(); ctx.globalCompositeOperation='screen'
        ctx.fillStyle=g; ctx.beginPath()
        ctx.ellipse(cx,cy,radius,radius*0.85,noise(b.ox,b.oy*2,t*0.3)*0.6,0,Math.PI*2)
        ctx.fill(); ctx.restore()
      }

      if (m.currentR > 0.01) {
        const spotR = Math.min(W,H)*0.22
        const spot = ctx.createRadialGradient(m.x,m.y,0,m.x,m.y,spotR)
        const si = m.currentR*0.32
        spot.addColorStop(0,    `rgba(116,250,78,${si})`)
        spot.addColorStop(0.3,  `rgba(80,200,40,${si*0.5})`)
        spot.addColorStop(0.65, `rgba(40,120,15,${si*0.12})`)
        spot.addColorStop(1,    'rgba(0,0,0,0)')
        ctx.save(); ctx.globalCompositeOperation='screen'
        ctx.fillStyle=spot; ctx.beginPath()
        ctx.arc(m.x,m.y,spotR,0,Math.PI*2); ctx.fill()
        ctx.strokeStyle=`rgba(116,250,78,${m.currentR*0.25})`
        ctx.lineWidth=1.5*devicePixelRatio; ctx.beginPath()
        ctx.arc(m.x,m.y,spotR*0.18,0,Math.PI*2); ctx.stroke()
        ctx.restore()
      }

      ctx.save(); ctx.globalCompositeOperation='multiply'
      const vgn = ctx.createRadialGradient(W*.5,H*.5,0,W*.5,H*.5,Math.max(W,H)*.7)
      vgn.addColorStop(0,'rgba(0,0,0,0)'); vgn.addColorStop(1,'rgba(0,0,0,0.55)')
      ctx.fillStyle=vgn; ctx.fillRect(0,0,W,H); ctx.restore()

      rafId = requestAnimationFrame(draw)
    }
    rafId = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseleave', onLeave)
      window.removeEventListener('touchmove', onTouch)
      window.removeEventListener('touchend', onLeave)
    }
  }, [])

  return <canvas ref={canvasRef} style={{ position:'fixed', inset:0, width:'100%', height:'100%', zIndex:0 }} />
}

export default function Home() {
  const [mode, setMode] = useState('rewrite')
  const [tone, setTone] = useState('natural')
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  async function generate() {
    if (!input.trim() || loading) return
    setLoading(true); setError(''); setOutput('')
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: input, mode, tone }),
      })
      if (!res.ok) throw new Error('API error ' + res.status)
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buf = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buf += decoder.decode(value, { stream: true })
        const lines = buf.split('\n'); buf = lines.pop()
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const d = line.slice(6).trim()
          if (d === '[DONE]') continue
          try {
            const p = JSON.parse(d)
            if (p.type === 'content_block_delta' && p.delta?.text) {
              setOutput(prev => prev + p.delta.text)
            }
          } catch {}
        }
      }
    } catch (e) {
      setError('Κάτι πήγε στραβά: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  function copy() {
    navigator.clipboard.writeText(output).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <>
      <Head>
        <title>Greek Copywriter — VAKMEDIA</title>
      </Head>

      <AnimatedBg />

      <div className="page">
        <nav className="nav">
          <svg viewBox="0 0 339 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="logo">
            <path d="M304.156 100H338.15L300.756 0H264.779L226.535 100H260.53L271.719 63.7394L282.626 28.4703L293.249 63.7394L304.156 100Z" fill="white"/>
            <path d="M220.728 100H189L227.952 0H259.68L220.728 100Z" fill="white"/>
            <path d="M154.816 100H188.81L151.416 0H115.439L77.1953 100H111.19L122.379 63.7394L133.286 28.4703L143.909 63.7394L154.816 100Z" fill="white"/>
            <path d="M110.198 0L71.3881 100H38.3853L0 0H32.2946L55.0992 61.3314L77.762 0H110.198Z" fill="white"/>
          </svg>
          <span className="nav-tag">AI Tool</span>
        </nav>

        <div className="hero">
          <div className="hero-label">✦ Social Media Agent</div>
          <h1>GREEK<br /><span>COPYWRITER</span></h1>
          <p className="hero-sub">Μετάφραση & προσαρμογή κειμένου για social media — Gen Z tone, authentic voice.</p>
        </div>

        <div className="mode-row">
          {MODES.map(m => (
            <button key={m.id} className={`mode-btn ${mode===m.id?'active':''}`} onClick={() => setMode(m.id)}>
              {m.label}
            </button>
          ))}
        </div>

        <div className="panel">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Βάλε το κείμενό σου εδώ…"
            onKeyDown={e => { if (e.key==='Enter' && e.metaKey) generate() }}
          />
          <div className="tone-bar">
            <span className="tone-lbl">Tone</span>
            {TONES.map(t => (
              <button key={t.id} className={`chip ${tone===t.id?'active':''}`} onClick={() => setTone(t.id)}>
                {t.label}
              </button>
            ))}
          </div>
          <div className="footer-bar">
            <span className="char-c">{input.length} chars</span>
            <button className="btn-generate" onClick={generate} disabled={loading || !input.trim()}>
              {loading ? <span className="spinner" /> : 'GENERATE ↗'}
            </button>
          </div>
        </div>

        {error && <div className="err-box">{error}</div>}

        {output && (
          <div className="output-section">
            <div className="out-header">
              <div className="out-label">Output</div>
              <button className={`btn-copy ${copied?'copied':''}`} onClick={copy}>
                {copied ? 'COPIED ✓' : 'COPY'}
              </button>
            </div>
            <div className="out-box">
              {output}
              {loading && <span className="cursor" />}
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        @font-face {
          font-family: 'AkzidenzGrotesk';
          src: url('/fonts/AkzidenzGroteskPro-Regular.otf') format('opentype');
          font-weight: 400;
          font-style: normal;
        }
        @font-face {
          font-family: 'AkzidenzGrotesk';
          src: url('/fonts/AkzidenzGroteskPro-Bold.otf') format('opentype');
          font-weight: 700;
          font-style: normal;
        }
        @font-face {
          font-family: 'AkzidenzGrotesk';
          src: url('/fonts/AkzidenzGroteskPro-Super.otf') format('opentype');
          font-weight: 900;
          font-style: normal;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          background: #0d0d0d;
          color: #ffffff;
          font-family: 'AkzidenzGrotesk', sans-serif;
          min-height: 100vh;
        }
      `}</style>

      <style jsx>{`
        .page { position: relative; z-index: 1; max-width: 760px; margin: 0 auto; padding: 48px 16px 80px; }
        .nav { display: flex; align-items: center; justify-content: space-between; margin-bottom: 56px; }
        .logo { width: 80px; height: auto; }
        .nav-tag { border: 1px solid #74fa4e; border-radius: 999px; color: #74fa4e; font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; padding: 4px 14px; font-family: 'AkzidenzGrotesk', sans-serif; }
        .hero { margin-bottom: 40px; }
        .hero-label { display: inline-block; border: 1px solid #74fa4e; border-radius: 999px; color: #74fa4e; font-size: 11px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; padding: 4px 14px; margin-bottom: 20px; font-family: 'AkzidenzGrotesk', sans-serif; }
        h1 { font-family: 'AkzidenzGrotesk', sans-serif; font-weight: 900; font-size: clamp(52px, 9vw, 88px); line-height: 0.90; letter-spacing: -0.02em; text-transform: uppercase; color: #fff; margin-bottom: 16px; }
        h1 span { color: #74fa4e; }
        .hero-sub { font-size: 14px; font-weight: 400; color: rgba(255,255,255,0.45); line-height: 1.6; max-width: 480px; font-family: 'AkzidenzGrotesk', sans-serif; }
        .mode-row { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 20px; }
        .mode-btn { padding: 7px 18px; border-radius: 999px; border: 1.5px solid rgba(255,255,255,0.14); background: transparent; color: rgba(255,255,255,0.45); font-family: 'AkzidenzGrotesk', sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; cursor: pointer; transition: all .15s; }
        .mode-btn:hover { border-color: #74fa4e; color: #74fa4e; }
        .mode-btn.active { background: #74fa4e; border-color: #74fa4e; color: #000; }
        .panel { background: rgba(255,255,255,0.03); border: 0.5px solid rgba(255,255,255,0.14); border-radius: 16px; overflow: hidden; backdrop-filter: blur(12px); }
        textarea { width: 100%; min-height: 120px; background: transparent; border: none; border-bottom: 0.5px solid rgba(255,255,255,0.08); outline: none; color: #fff; font-family: 'AkzidenzGrotesk', sans-serif; font-size: 14px; font-weight: 400; line-height: 1.6; padding: 18px 20px; resize: none; }
        textarea::placeholder { color: rgba(255,255,255,0.2); }
        .tone-bar { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; padding: 12px 16px; border-bottom: 0.5px solid rgba(255,255,255,0.08); }
        .tone-lbl { font-size: 10px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: rgba(255,255,255,0.22); margin-right: 4px; font-family: 'AkzidenzGrotesk', sans-serif; }
        .chip { padding: 4px 12px; border-radius: 999px; border: 1px solid rgba(255,255,255,0.14); background: transparent; color: rgba(255,255,255,0.45); font-family: 'AkzidenzGrotesk', sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; cursor: pointer; transition: all .15s; }
        .chip:hover { border-color: #74fa4e; color: #74fa4e; }
        .chip.active { background: rgba(116,250,78,0.10); border-color: #74fa4e; color: #74fa4e; }
        .footer-bar { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; }
        .char-c { font-size: 11px; font-weight: 400; color: rgba(255,255,255,0.22); font-family: 'AkzidenzGrotesk', sans-serif; }
        .btn-generate { display: flex; align-items: center; gap: 8px; padding: 10px 26px; background: #74fa4e; border: none; border-radius: 999px; color: #000; font-family: 'AkzidenzGrotesk', sans-serif; font-size: 13px; font-weight: 900; letter-spacing: 0.1em; text-transform: uppercase; cursor: pointer; transition: background .15s, transform .1s; }
        .btn-generate:hover { background: #5de838; transform: translateY(-1px); }
        .btn-generate:active { transform: translateY(0); }
        .btn-generate:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
        .spinner { width: 14px; height: 14px; border: 2px solid rgba(0,0,0,0.2); border-top-color: #000; border-radius: 50%; animation: spin .6s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .err-box { margin-top: 14px; background: rgba(204,61,34,0.08); border: 0.5px solid rgba(204,61,34,0.3); border-radius: 8px; padding: 12px 16px; color: #f87171; font-size: 13px; font-family: 'AkzidenzGrotesk', sans-serif; }
        .output-section { margin-top: 24px; }
        .out-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; padding: 0 4px; }
        .out-label { font-size: 10px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #74fa4e; display: flex; align-items: center; gap: 6px; font-family: 'AkzidenzGrotesk', sans-serif; }
        .out-label::before { content: ''; width: 6px; height: 6px; background: #74fa4e; border-radius: 50%; animation: pulse 2s infinite; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        .btn-copy { padding: 4px 12px; border-radius: 999px; border: 1px solid rgba(255,255,255,0.14); background: transparent; color: rgba(255,255,255,0.45); font-family: 'AkzidenzGrotesk', sans-serif; font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; cursor: pointer; transition: all .15s; }
        .btn-copy:hover, .btn-copy.copied { border-color: #74fa4e; color: #74fa4e; }
        .out-box { background: rgba(255,255,255,0.03); border: 0.5px solid rgba(116,250,78,0.2); border-radius: 16px; padding: 20px; font-size: 15px; line-height: 1.7; white-space: pre-wrap; word-break: break-word; color: #fff; font-family: 'AkzidenzGrotesk', sans-serif; backdrop-filter: blur(12px); }
        .cursor { display: inline-block; width: 2px; height: 1.1em; background: #74fa4e; margin-left: 2px; vertical-align: middle; animation: blink .8s infinite; }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
      `}</style>
    </>
  )
}
