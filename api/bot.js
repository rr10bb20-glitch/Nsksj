export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { question } = req.body;
    if (!question || !question.trim()) {
      return res.status(200).json({ answer: '✍️ اكتب سؤالك.' });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return res.status(200).json({ answer: '❌ مفتاح OpenRouter غير موجود.' });
    }

    // ✅ Dolphin 3.0 R1 Mistral 24B (بدون رقابة)
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'cognitivecomputations/dolphin-3.0-r1-mistral-24b:free',
        messages: [{ role: 'user', content: question }],
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return res.status(200).json({ answer: `⚠️ خطأ ${response.status}: ${error.substring(0, 150)}` });
    }

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content || 'لم يتلق رداً';
    return res.status(200).json({ answer: answer });

  } catch (err) {
    return res.status(200).json({ answer: '❌ خطأ: ' + err.message });
  }
}
