export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { text, mode, tone } = req.body;
  if (!text) return res.status(400).json({ error: 'No text provided' });

  const tones = {
    natural: 'φυσικό casual, σαν πραγματικός άνθρωπος στα social media',
    playful: 'παιχνιδιάρικο και ζωηρό, ποτέ cringe',
    premium: 'premium αίσθηση, clean, aspirational',
    direct: 'κατευθείαν, χωρίς γεμιστικά, bold',
    hype: 'με ενέργεια και motivational vibes',
  };
  const modes = {
    rewrite: 'Ξαναγράψε σε casual modern ελληνικά για social media.',
    translate: 'Μετάφρασε και προσάρμοσε πολιτισμικά για ελληνικό κοινό.',
    improve: 'Βελτίωσε το υπάρχον ελληνικό κείμενο για social media.',
    variations: 'Δώσε 3 εκδοχές με labels **Playful:**, **Premium:**, **Direct:**',
  };

  const systemPrompt = `Είσαι expert Greek social media copywriter. Γράφεις μόνο σε casual σύγχρονα ελληνικά.
ΚΑΝΟΝΕΣ: Natural flow, μικρές προτάσεις, everyday Greek, κανένα Greeklish, διατήρηση intent.
TONE: ${tones[tone] || tones.natural}
TASK: ${modes[mode] || modes.rewrite}
Απάντα ΜΟΝΟ με το τελικό κείμενο, χωρίς εισαγωγή.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-5',
        max_tokens: 1024,
        stream: true,
        system: systemPrompt,
        messages: [{ role: 'user', content: text }],
      }),
    });

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(decoder.decode(value, { stream: true }));
    }
    res.end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
