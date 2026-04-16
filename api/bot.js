export default async function handler(req, res) {
  // إعدادات CORS الأساسية
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // الرد على طلب "ما قبل الإرسال" (Preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // التأكد من أن الطريقة هي POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { question } = req.body;

    // 1. التحقق من وجود سؤال
    if (!question || !question.trim()) {
      return res.status(200).json({ answer: '✍️ يرجى كتابة سؤالك أولاً.' });
    }

    // 2. قراءة المفتاح من بيئة Vercel
    const apiKey = process.env.OPENROUTER_API_KEY;

    // 3. التحقق من وجود المفتاح
    if (!apiKey) {
      return res.status(200).json({ 
        answer: '❌ مفتاح OpenRouter API غير موجود في بيئة Vercel. يرجى إضافته كـ OPENROUTER_API_KEY ثم إعادة نشر الموقع (Redeploy).' 
      });
    }

    // 4. التحقق من صحة بادئة المفتاح (اختياري، لكنه مفيد للتشخيص)
    if (!apiKey.startsWith('sk-or-v1-')) {
      return res.status(200).json({ 
        answer: '⚠️ المفتاح الموجود لا يبدأ بـ "sk-or-v1-". يرجى التأكد من صحة المفتاح الذي نسخته من OpenRouter.' 
      });
    }

    // 5. محاولة الاتصال بـ OpenRouter
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

    // 6. تحليل الرد من OpenRouter
    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter Error:', response.status, errorText);
      return res.status(200).json({ 
        answer: `⚠️ خطأ من خادم OpenRouter (الرمز: ${response.status}). يرجى المحاولة لاحقاً. التفاصيل: ${errorText.substring(0, 150)}` 
      });
    }

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content;

    if (!answer) {
      return res.status(200).json({ answer: '⚠️ تلقيت رداً فارغاً من الذكاء الاصطناعي. حاول مرة أخرى.' });
    }

    // 7. إرسال الرد الناجح
    return res.status(200).json({ answer: answer });

  } catch (error) {
    console.error('Server Error:', error.message);
    return res.status(200).json({ 
      answer: `❌ خطأ داخلي في الخادم: ${error.message}. يرجى مراجعة السجلات (Logs) على Vercel.` 
    });
  }
}
