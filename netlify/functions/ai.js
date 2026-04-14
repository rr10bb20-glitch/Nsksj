// إضافة fetch (مهم جداً لعمل Netlify Functions)
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

// netlify/functions/ai.js
// يستخدم Groq API (مجاني وسريع جداً)

exports.handler = async (event) => {
  // السماح بـ CORS
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ answer: 'Method Not Allowed' }) };
  }

  try {
    const { question } = JSON.parse(event.body || '{}');

    if (!question || question.trim().length === 0) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ answer: 'يرجى كتابة سؤالك أولاً.' })
      };
    }

    const apiKey = process.env.GROQ_API_KEY;

    // طباعة بداية المفتاح في السجلات
    if (apiKey) {
      console.log("🔑 بداية المفتاح المقروء في السيرفر هي:", apiKey.substring(0, 4));
    } else {
      console.log("🚨 الخادم يقول أن المفتاح فارغ تماماً!");
    }

    if (!apiKey) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ answer: 'المفتاح غير موجود. تأكد من إضافة GROQ_API_KEY في Netlify Environment Variables.' })
      };
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        max_tokens: 500,
        temperature: 0.7,
        messages: [
          {
            role: 'system',
            content: 'أنت مساعد ذكي لموقع "مخطوطات الجن" — موقع قصص رعب عربي. أجب دائماً بالعربية الفصيحة وبشكل مختصر ومفيد. إذا سألوك عن قصص رعب أو جن أو غموض فساعدهم بحماس. وإلا أجب بشكل عام ومهذب.'
          },
          {
            role: 'user',
            content: question.trim()
          }
        ]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Groq API error:', response.status, errText);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ answer: 'خطأ من الخادم (' + response.status + '). تأكد من صحة المفتاح في Netlify.' })
      };
    }

    const data = await response.json();
    const answer = data?.choices?.[0]?.message?.content || 'لم أتمكن من الإجابة، حاول مرة أخرى.';

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ answer: answer.trim() })
    };

  } catch (err) {
    console.error('Function error:', err.message);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ answer: 'فشل الاتصال بالخادم: ' + err.message })
    };
  }
};
