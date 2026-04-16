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
    
    // فحص 1: هل المفتاح موجود؟
    if (!apiKey) {
      return res.status(200).json({ answer: '❌ مفتاح OpenRouter غير موجود في Vercel Environment Variables' });
    }

    // فحص 2: هل المفتاح يبدأ بالشكل الصحيح؟
    if (!apiKey.startsWith('sk-or-v1-')) {
      return res.status(200).json({ answer: '⚠️ المفتاح موجود لكن صيغته غير صحيحة. يجب أن يبدأ بـ sk-or-v1-' });
    }

    // فحص 3: محاولة الاتصال بـ OpenRouter
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'nousresearch/hermes-3-llama-3.1-8b:free',
          messages: [{ role: 'user', content: question }],
          max_tokens: 500,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return res.status(200).json({ answer: `⚠️ خطأ من OpenRouter (${response.status}): ${errorText.substring(0, 200)}` });
      }

      const data = await response.json();
      const answer = data.choices?.[0]?.message?.content || 'لم يتلق رداً';
      return res.status(200).json({ answer: answer });

    } catch (fetchError) {
      return res.status(200).json({ answer: `❌ فشل الاتصال بـ OpenRouter: ${fetchError.message}` });
    }

  } catch (err) {
    return res.status(200).json({ answer: '❌ خطأ عام: ' + err.message });
  }
}
