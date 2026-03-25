import { useState, useRef } from 'react';
import Head from 'next/head';

const MODES = [
  { id: 'rewrite', label: 'Casual Greek' },
  { id: 'translate', label: 'Translate + Adapt' },
  { id: 'improve', label: 'Improve Greek' },
  { id: 'variations', label: 'Tone Variations' },
];

const TONES = [
  { id: 'natural', label: 'Natural' },
  { id: 'playful', label: 'Playful' },
  { id: 'premium', label: 'Premium' },
  { id: 'direct', label: 'Direct' },
  { id: 'hype', label: 'Hype' },
];

export default function Home() {
  const [mode, setMode] = useState('rewrite');
  const [tone, setTone] = useState('natural');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  async function generate() {
    if (!input.trim() || loading) return;
    setLoading(true);
    setError('');
    setOutput('');

    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: input, mode, tone }),
      });

      if (!res.ok) throw new Error('API error ' + res.status);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop();
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const d = line.slice(6).trim();
          if (d === '[DONE]') continue;
          try {
            const p = JSON.parse(d);
            if (p.type === 'content_block_delta' && p.delta?.text) {
              setOutput(prev => prev + p.delta.text);
            }
          } catch {}
        }
      }
    } catch (e) {
      setError('Κάτι πήγε στραβά: ' + e.message);
    } finally {
      setLoading(false);
    }
  }

  function copy() {
    navigator.clipboard.writeText(output).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <>
      <Head>
        <title>Greek Social Media Agent</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />
      </Head>

      <div className="page">
        <div className="container">
          <div className="header">
            <div className="badge">AI Agent</div>
            <h1>Greek Social Media<br />Copywriter</h1>
            <p className="sub">Μετάφραση & προσαρμογή για social media</p>
          </div>

          <div className="mode-row">
            {MODES.map(m => (
              <button key={m.id} className={`mode-btn ${mode === m.id ? 'active' : ''}`} onClick={() => setMode(m.id)}>
                {m.label}
              </button>
            ))}
          </div>

          <div className="panel">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Βάλε το κείμενό σου εδώ…"
              onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) generate(); }}
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
              <button className="btn-gen" onClick={generate} disabled={loading || !input.trim()}>
                {loading ? <span className="spinner" /> : 'Generate ↗'}
              </button>
            </div>
          </div>

          {error && <div className="error-box">{error}</div>}

          {output && (
            <div className="output-section">
              <div className="out-header">
                <div className="out-lbl">Output</div>
                <button className={`btn-copy ${copied ? 'copied' : ''}`} onClick={copy}>
                  {copied ? 'Copied ✓' : 'Copy'}
                </button>
              </div>
              <div className="out-box">{output}{loading && <span className="cursor" />}</div>
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          background: #0d0d10;
          color: #e8e8f0;
          font-family: 'DM Sans', sans-serif;
          min-height: 100vh;
        }
        body::before {
          content: '';
          position: fixed; inset: 0;
          background-image: linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 40px 40px;
          pointer-events: none; z-index: 0;
        }
      `}</style>

      <style jsx>{`
        .page { position: relative; z-index: 1; padding: 48px 20px 80px; display: flex; justify-content: center; }
        .container { width: 100%; max-width: 720px; }
        .header { text-align: center; margin-bottom: 40px; }
        .badge {
          display: inline-block; padding: 4px 14px;
          background: rgba(79,142,247,0.1); border: 1px solid rgba(79,142,247,0.3);
          color: #4f8ef7; font-size: 11px; font-weight: 600; letter-spacing: .12em;
          text-transform: uppercase; border-radius: 100px; margin-bottom: 16px;
        }
        h1 {
          font-family: 'Syne', sans-serif; font-size: clamp(28px,5vw,44px);
          font-weight: 800; line-height: 1.1; letter-spacing: -.02em;
          background: linear-gradient(135deg, #fff 30%, #a78bfa);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text; margin-bottom: 10px;
        }
        .sub { color: #6b6b80; font-size: 14px; font-weight: 300; }
        .mode-row { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 20px; }
        .mode-btn {
          padding: 7px 16px; border-radius: 100px;
          border: 1px solid #2a2a38; background: #16161c;
          color: #6b6b80; font-family: 'DM Sans', sans-serif;
          font-size: 13px; font-weight: 500; cursor: pointer; transition: all .15s;
        }
        .mode-btn:hover { border-color: #4f8ef7; color: #e8e8f0; }
        .mode-btn.active { background: rgba(79,142,247,.12); border-color: #4f8ef7; color: #4f8ef7; }
        .panel { background: #16161c; border: 1px solid #2a2a38; border-radius: 16px; overflow: hidden; }
        textarea {
          width: 100%; min-height: 120px; background: #1e1e27;
          border: none; border-bottom: 1px solid #2a2a38; outline: none;
          color: #e8e8f0; font-family: 'DM Sans', sans-serif;
          font-size: 15px; font-weight: 300; line-height: 1.6;
          padding: 16px; resize: none;
        }
        textarea::placeholder { color: #6b6b80; }
        .tone-bar { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; padding: 12px 16px; border-bottom: 1px solid #2a2a38; }
        .tone-lbl { font-size: 11px; font-weight: 600; letter-spacing: .1em; text-transform: uppercase; color: #6b6b80; margin-right: 4px; }
        .chip {
          padding: 4px 12px; border-radius: 100px;
          border: 1px solid #2a2a38; background: transparent;
          color: #6b6b80; font-family: 'DM Sans', sans-serif;
          font-size: 12px; cursor: pointer; transition: all .15s;
        }
        .chip:hover { border-color: #a78bfa; color: #a78bfa; }
        .chip.active { background: rgba(167,139,250,.12); border-color: #a78bfa; color: #a78bfa; }
        .footer-bar { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; }
        .char-c { font-size: 11px; color: #6b6b80; }
        .btn-gen {
          display: flex; align-items: center; gap: 8px;
          padding: 9px 22px; border-radius: 10px;
          background: #4f8ef7; border: none;
          color: #fff; font-family: 'DM Sans', sans-serif;
          font-size: 14px; font-weight: 500; cursor: pointer; transition: opacity .15s;
        }
        .btn-gen:hover { opacity: .85; }
        .btn-gen:disabled { opacity: .4; cursor: not-allowed; }
        .spinner {
          width: 14px; height: 14px;
          border: 2px solid rgba(255,255,255,.3); border-top-color: #fff;
          border-radius: 50%; animation: spin .6s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .error-box {
          margin-top: 14px; padding: 12px 16px;
          background: rgba(248,113,113,.08); border: 1px solid rgba(248,113,113,.3);
          border-radius: 10px; color: #f87171; font-size: 13px;
        }
        .output-section { margin-top: 20px; }
        .out-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
        .out-lbl { font-size: 11px; font-weight: 600; letter-spacing: .1em; text-transform: uppercase; color: #34d399; display: flex; align-items: center; gap: 6px; }
        .out-lbl::before { content: ''; width: 5px; height: 5px; background: #34d399; border-radius: 50%; }
        .btn-copy {
          padding: 4px 12px; border-radius: 6px;
          border: 1px solid #2a2a38; background: transparent;
          color: #6b6b80; font-family: 'DM Sans', sans-serif;
          font-size: 12px; cursor: pointer; transition: all .15s;
        }
        .btn-copy:hover, .btn-copy.copied { border-color: #34d399; color: #34d399; }
        .out-box {
          background: #16161c; border: 1px solid #2a2a38;
          border-radius: 12px; padding: 18px;
          font-size: 16px; line-height: 1.7; font-weight: 300;
          white-space: pre-wrap; word-break: break-word;
        }
        .cursor {
          display: inline-block; width: 2px; height: 1.1em;
          background: #4f8ef7; margin-left: 2px; vertical-align: middle;
          animation: blink .8s infinite;
        }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
      `}</style>
    </>
  );
}
