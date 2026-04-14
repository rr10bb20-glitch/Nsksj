// netlify/functions/ai.js

exports.handler = async (event) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ answer: "Method Not Allowed" }),
    };
  }

  try {
    const { question } = JSON.parse(event.body || "{}");

    if (!question || question.trim().length === 0) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ answer: "يرجى كتابة سؤالك أولاً." }),
      };
    }

    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          answer: "المفتاح غير موجود في Netlify.",
        }),
      };
    }

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "llama3-8b-instant",
          max_tokens: 500,
          temperature: 0.7,
          messages: [
            {
              role: "system",
              content:
                "أنت مساعد ذكي لموقع مخطوطات الجن. إذا قال المستخدم كلامًا لطيفًا مثل أحبك أو اشتقت لك فقم بالرد بلطف واحترام. وإذا سأل سؤالًا فاجبه بوضوح وبالعربية الفصيحة.",
            },
            {
              role: "user",
              content: question.trim(),
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("Groq API error:", response.status, errText);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          answer: "خطأ من الخادم (" + response.status + ").",
        }),
      };
    }

    const data = await response.json();

    const answer =
      data?.choices?.[0]?.message?.content ||
      data?.choices?.[0]?.delta?.content ||
      "لم أتمكن من الإجابة، حاول مرة أخرى.";

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ answer: answer.trim() }),
    };
  } catch (err) {
    console.error("Function error:", err.message);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        answer: "فشل الاتصال بالخادم: " + err.message,
      }),
    };
  }
};
