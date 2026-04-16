// ============================================
// بوت بدون رقابة - عبر OpenRouter
// ============================================

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    let { question } = req.body;
    if (!question || !question.trim()) {
      return res.status(200).json({ answer: '✍️ اكتب سؤالك.' });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return res.status(200).json({ answer: '❌ مفتاح OpenRouter غير موجود. أضفه في Vercel Environment Variables' });
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://gg-zmtn.vercel.app',
        'X-Title': 'مخطوطات الجن'
      },
      body: JSON.stringify({
        model: 'nousresearch/hermes-3-llama-3.1-8b:free',
        messages: [{ role: 'user', content: question }],
        max_tokens: 2000,
        temperature: 0.9,
      }),
    });

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content || 'لم أتمكن من الإجابة.';
    return res.status(200).json({ answer: answer });

  } catch (err) {
    console.error('Error:', err.message);
    return res.status(200).json({ answer: 'خطأ: ' + err.message });
  }
}
