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

    const q = question.toLowerCase();
    let answer = '';

    // ردود ذكية محلية
    if (q.includes('برمجة') || q.includes('كود') || q.includes('html') || q.includes('css')) {
      answer = '💻 أكتب كود HTML: ```html\n<div>مثال</div>\n```\nأخبرني بالتفصيل أكثر لأكتب لك الكود المناسب.';
    }
    else if (q.includes('رعب') || q.includes('قصة') || q.includes('جن')) {
      answer = '👻 كانت ليلة مظلمة، والرياح تعوي... أكتب لي موضوع القصة وأكتب لك قصة مرعبة.';
    }
    else if (q.includes('اختراق') || q.includes('هكر') || q.includes('ثغرة')) {
      answer = '🔒 أهلاً! لا يمكنني تقديم أكواد اختراق، لكن يمكنني مساعدتك في تعلم البرمجة والأمان السيبراني بشكل قانوني. أخبرني ماذا تريد أن تتعلم؟';
    }
    else if (q.includes('مرحب') || q.includes('السلام') || q.includes('هلا')) {
      answer = '👋 وعليكم السلام! كيف أقدر أساعدك اليوم؟';
    }
    else if (q.includes('شكر')) {
      answer = '❤️ العفو! أنا هنا لمساعدتك دائماً.';
    }
    else {
      answer = '🔮 أنا بوت مخطوطات الجن. اسألني عن البرمجة، قصص الرعب، أو أي شيء تحتاج مساعدة فيه. كيف أقدر أساعدك اليوم؟';
    }

    return res.status(200).json({ answer: answer });

  } catch (err) {
    return res.status(200).json({ answer: 'خطأ: ' + err.message });
  }
}
