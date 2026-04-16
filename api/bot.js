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
      return res.status(200).json({ answer: '❌ مفتاح OpenRouter غير موجود. أضفه في Vercel' });
    }

    // قائمة نماذج مجانية في OpenRouter
    const models = [
      'nousresearch/hermes-3-llama-3.1-8b:free',
      'microsoft/phi-3-mini-128k:free',
      'google/gemma-2-9b-it:free'
    ];
    
    let lastError = null;
    
    for (const model of models) {
      try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: model,
            messages: [{ role: 'user', content: question }],
            max_tokens: 1000,
            temperature: 0.8,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const answer = data.choices?.[0]?.message?.content;
          if (answer) {
            return res.status(200).json({ answer: answer });
          }
        } else {
          const errorText = await response.text();
          lastError = `${model}: ${response.status}`;
        }
      } catch (e) {
        lastError = `${model}: ${e.message}`;
      }
    }
    
    return res.status(200).json({ 
      answer: `⚠️ جميع النماذج فشلت. آخر خطأ: ${lastError}\n\n💡 تأكد من:\n1. مفتاح OpenRouter صحيح\n2. المفتاح مفعل في Vercel\n3. سويت Redeploy` 
    });

  } catch (err) {
    return res.status(200).json({ answer: '❌ خطأ: ' + err.message });
  }
}
