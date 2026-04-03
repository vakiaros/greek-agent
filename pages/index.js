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
    setLoading(true)
    setError('')
    setOutput('')

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
        const lines = buf.split('\n')
        buf = lines.pop()
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
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <>
      <Head>
        <title>Greek Copywriter — VAKMEDIA</title>
        <link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800;900&family=Barlow:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </Head>

      <div className="page">

        {/* NAV */}
        <nav className="nav">
          <svg viewBox="0 0 339 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="logo">
            <path d="M304.156 100H338.15L300.756 0H264.779L226.535 100H260.53L271.719 63.7394L282.626 28.4703L293.249 63.7394L304.156 100Z" fill="white"/>
            <path d="M220.728 100H189L227.952 0H259.68L220.728 100Z" fill="white"/>
            <path d="M154.816 100H188.81L151.416 0H115.439L77.1953 100H111.19L122.379 63.7394L133.286 28.4703L143.909 63.7394L154.816 100Z" fill="white"/>
            <path d="M110.198 0L71.3881 100H38.3853L0 0H32.2946L55.0992 61.3314L77.762 0H110.198Z" fill="white"/>
          </svg>
          <span className="nav-tag">AI Tool</span>
        </nav>

        {/* HERO */}
        <div className="hero">
          <div className="hero-label">✦ Social Media Agent</div>
          <h1>Greek<br /><span>Copywriter</span></h1>
          <p className="hero-sub">Μετάφραση & προσαρμογή κειμένου για social media — Gen Z tone, authentic voice.</p>
        </div>

        {/* MODES */}
        <div className="mode-row">
          {MODES.map(m => (
            <button key={m.id} className={`mode-btn ${mode === m.id ? 'active' : ''}`} onClick={() => setMode(m.id)}>
              {m.label}
            </button>
          ))}
        </div>

        {/* PANEL */}
        <div className="panel">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Βάλε το κείμενό σου εδώ…"
            onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) generate() }}
          />
          <div className="tone-bar">
            <span className="tone-lbl">Tone</span>
            {TONES.map(t => (
              <button key={t.id} className={`chip ${tone === t.id ? 'active' : ''}`} onClick={() => setTone(t.id)}>
                {t.label}
              </button>
            ))}
          </div>
          <div className="footer-bar">
            <span className="char-c">{input.length} chars</span>
            <button className="btn-generate" onClick={generate} disabled={loading || !input.trim()}>
              {loading ? <span className="spinner" /> : 'Generate ↗'}
            </button>
          </div>
        </div>

        {error && <div className="err-box">{error}</div>}

        {output && (
          <div className="output-section">
            <div className="out-header">
              <div className="out-label">Output</div>
              <button className={`btn-copy ${copied ? 'copied' : ''}`} onClick={copy}>
                {copied ? 'Copied ✓' : 'Copy'}
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
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          background: #0d0d0d;
          color: #ffffff;
          font-family: 'Barlow', sans-serif;
          min-height: 100vh;
          overflow-x: hidden;
        }
        body::before {
          content: '';
          position: fixed; inset: 0;
          background: radial-gradient(ellipse at 50% -10%, rgba(116,250,78,0.14) 0%, transparent 65%);
          pointer-events: none; z-index: 0;
        }
      `}</style>

      <style jsx>{`
        .page { position: relative; z-index: 1; max-width: 760px; margin: 0 auto; padding: 48px 16px 80px; }
        .nav { display: flex; align-items: center; justify-content: space-between; margin-bottom: 56px; }
        .logo { width: 80px; height: auto; }
        .nav-tag { border: 1px solid #74fa4e; border-radius: 999px; color: #74fa4e; font-size: 11px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; padding: 4px 14px; }
        .hero { margin-bottom: 40px; }
        .hero-label { display: inline-block; border: 1px solid #74fa4e; border-radius: 999px; color: #74fa4e; font-size: 11px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; padding: 4px 14px; margin-bottom: 20px; }
        h1 { font-family: 'Barlow Condensed', sans-serif; font-weight: 900; font-size: clamp(38px,7vw,64px); line-height: 0.95; letter-spacing: -0.01em; text-transform: uppercase; margin-bottom: 16px; }
        h1 span { color: #74fa4e; }
        .hero-sub { font-size: 14px; font-weight: 400; color: rgba(255,255,255,0.45); line-height: 1.6; max-width: 480px; }
        .mode-row { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 20px; }
        .mode-btn { padding: 7px 18px; border-radius: 999px; border: 1.5px solid rgba(255,255,255,0.14); background: transparent; color: rgba(255,255,255,0.45); font-family: 'Barlow', sans-serif; font-size: 11px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; cursor: pointer; transition: all .15s; }
        .mode-btn:hover { border-color: #74fa4e; color: #74fa4e; }
        .mode-btn.active { background: #74fa4e; border-color: #74fa4e; color: #000; }
        .panel { background: #1a1a1a; border: 0.5px solid rgba(255,255,255,0.14); border-radius: 16px; overflow: hidden; }
        textarea { width: 100%; min-height: 120px; background: transparent; border: none; border-bottom: 0.5px solid rgba(255,255,255,0.08); outline: none; color: #fff; font-family: 'Barlow', sans-serif; font-size: 14px; line-height: 1.6; padding: 18px 20px; resize: none; }
        textarea::placeholder { color: rgba(255,255,255,0.22); }
        .tone-bar { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; padding: 12px 16px; border-bottom: 0.5px solid rgba(255,255,255,0.08); }
        .tone-lbl { font-size: 10px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: rgba(255,255,255,0.22); margin-right: 4px; }
        .chip { padding: 4px 12px; border-radius: 999px; border: 1px solid rgba(255,255,255,0.14); background: transparent; color: rgba(255,255,255,0.45); font-family: 'Barlow', sans-serif; font-size: 11px; font-weight: 500; cursor: pointer; transition: all .15s; }
        .chip:hover { border-color: #74fa4e; color: #74fa4e; }
        .chip.active { background: rgba(116,250,78,0.10); border-color: #74fa4e; color: #74fa4e; }
        .footer-bar { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; }
        .char-c { font-size: 11px; font-weight: 500; color: rgba(255,255,255,0.22); }
        .btn-generate { display: flex; align-items: center; gap: 8px; padding: 10px 24px; background: #74fa4e; border: none; border-radius: 999px; color: #000; font-family: 'Barlow Condensed', sans-serif; font-size: 14px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; cursor: pointer; transition: all .15s; }
        .btn-generate:hover { background: #5de838; transform: translateY(-1px); }
        .btn-generate:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
        .spinner { width: 14px; height: 14px; border: 2px solid rgba(0,0,0,0.2); border-top-color: #000; border-radius: 50%; animation: spin .6s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .err-box { margin-top: 14px; background: rgba(204,61,34,0.08); border: 0.5px solid rgba(204,61,34,0.3); border-radius: 8px; padding: 12px 16px; color: #f87171; font-size: 13px; }
        .output-section { margin-top: 24px; }
        .out-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; padding: 0 4px; }
        .out-label { font-size: 10px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: #74fa4e; display: flex; align-items: center; gap: 6px; }
        .out-label::before { content: ''; width: 6px; height: 6px; background: #74fa4e; border-radius: 50%; animation: pulse 2s infinite; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        .btn-copy { padding: 4px 12px; border-radius: 999px; border: 1px solid rgba(255,255,255,0.14); background: transparent; color: rgba(255,255,255,0.45); font-family: 'Barlow', sans-serif; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; cursor: pointer; transition: all .15s; }
        .btn-copy:hover, .btn-copy.copied { border-color: #74fa4e; color: #74fa4e; }
        .out-box { background: #1a1a1a; border: 0.5px solid rgba(116,250,78,0.2); border-radius: 16px; padding: 20px; font-size: 15px; line-height: 1.7; white-space: pre-wrap; word-break: break-word; }
        .cursor { display: inline-block; width: 2px; height: 1.1em; background: #74fa4e; margin-left: 2px; vertical-align: middle; animation: blink .8s infinite; }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
      `}</style>
    </>
  )
}