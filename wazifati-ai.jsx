import { useState, useEffect, useRef } from "react";

// ─── Anthropic API call ───────────────────────────────────────────────────────
async function callClaude(systemPrompt, userPrompt) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });
  const data = await res.json();
  return data.content?.map((b) => b.text || "").join("") || "";
}

// ─── Templates ────────────────────────────────────────────────────────────────
const TEMPLATES = [
  { id: "classic",  label: "كلاسيكي", accent: "#0f4c81", bg: "#f8f9fc" },
  { id: "modern",   label: "عصري",    accent: "#1a1a2e",  bg: "#eef2ff" },
  { id: "elegant",  label: "أنيق",    accent: "#2d6a4f",  bg: "#f0faf4" },
];

// ─── Styles ───────────────────────────────────────────────────────────────────
const G = {
  navy:    "#0d1b2a",
  gold:    "#c9a84c",
  goldL:   "#f0d080",
  teal:    "#1a9e8f",
  tealL:   "#22c5b3",
  cream:   "#fdf8f0",
  white:   "#ffffff",
  gray:    "#6b7280",
  grayL:   "#f3f4f6",
  border:  "#e5e7eb",
  success: "#10b981",
  error:   "#ef4444",
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;900&family=Tajawal:wght@300;400;500;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --navy: ${G.navy}; --gold: ${G.gold}; --goldL: ${G.goldL};
    --teal: ${G.teal}; --tealL: ${G.tealL}; --cream: ${G.cream};
    --white: ${G.white}; --gray: ${G.gray}; --grayL: ${G.grayL};
    --border: ${G.border}; --success: ${G.success}; --error: ${G.error};
  }

  body {
    font-family: 'Cairo', 'Tajawal', sans-serif;
    direction: rtl; text-align: right;
    background: var(--cream); color: var(--navy);
    min-height: 100vh; overflow-x: hidden;
  }

  /* ── Scroll bar ── */
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: var(--grayL); }
  ::-webkit-scrollbar-thumb { background: var(--gold); border-radius: 99px; }

  /* ── Animations ── */
  @keyframes fadeUp   { from { opacity:0; transform:translateY(24px);} to {opacity:1;transform:translateY(0);} }
  @keyframes fadeIn   { from { opacity:0; } to { opacity:1; } }
  @keyframes shimmer  { 0%,100% {opacity:.6;} 50% {opacity:1;} }
  @keyframes spin     { to { transform: rotate(360deg); } }
  @keyframes pulse    { 0%,100%{transform:scale(1);} 50%{transform:scale(1.05);} }
  @keyframes slideIn  { from{transform:translateX(40px);opacity:0;} to{transform:translateX(0);opacity:1;} }
  @keyframes glow     { 0%,100%{box-shadow:0 0 0 0 rgba(201,168,76,.4);} 50%{box-shadow:0 0 0 12px rgba(201,168,76,0);} }
  @keyframes dotBlink { 0%,80%,100%{opacity:0;} 40%{opacity:1;} }

  .fade-up   { animation: fadeUp   .5s ease both; }
  .fade-in   { animation: fadeIn   .4s ease both; }
  .slide-in  { animation: slideIn  .4s ease both; }

  /* ── Layout ── */
  .app-shell {
    display: flex; flex-direction: column;
    min-height: 100vh;
  }

  /* ── Hero ── */
  .hero {
    background: linear-gradient(135deg, var(--navy) 0%, #1a2f45 60%, #0a3d3a 100%);
    padding: 80px 24px 100px;
    text-align: center;
    position: relative; overflow: hidden;
  }
  .hero::before {
    content:'';
    position:absolute; inset:0;
    background: radial-gradient(ellipse at 70% 50%, rgba(201,168,76,.12) 0%, transparent 65%),
                radial-gradient(ellipse at 20% 80%, rgba(26,158,143,.1) 0%, transparent 55%);
    pointer-events:none;
  }
  .hero-badge {
    display:inline-flex; align-items:center; gap:8px;
    background: rgba(201,168,76,.15); border:1px solid rgba(201,168,76,.35);
    color: var(--gold); border-radius:99px;
    padding:6px 20px; font-size:13px; font-weight:600;
    margin-bottom:28px; backdrop-filter:blur(8px);
    animation: fadeUp .5s ease both;
  }
  .hero-badge span { width:8px;height:8px;border-radius:50%;background:var(--gold); animation:pulse 1.8s infinite; display:block; }
  .hero h1 {
    font-size: clamp(2rem, 6vw, 3.8rem);
    font-weight: 900; color: var(--white); line-height: 1.15;
    margin-bottom: 20px;
    animation: fadeUp .5s .1s ease both;
  }
  .hero h1 em { color: var(--gold); font-style:normal; }
  .hero p {
    font-size: clamp(1rem, 2.5vw, 1.2rem);
    color: rgba(255,255,255,.7); max-width: 560px; margin: 0 auto 40px;
    line-height: 1.75;
    animation: fadeUp .5s .2s ease both;
  }
  .hero-stats {
    display:flex; justify-content:center; gap:40px; flex-wrap:wrap;
    animation: fadeUp .5s .3s ease both;
  }
  .hero-stat { text-align:center; }
  .hero-stat .num { font-size:2rem;font-weight:900;color:var(--gold); }
  .hero-stat .lbl { font-size:12px;color:rgba(255,255,255,.55);margin-top:2px; }

  /* ── Nav ── */
  .nav {
    background: rgba(13,27,42,.96); backdrop-filter:blur(16px);
    border-bottom:1px solid rgba(201,168,76,.15);
    padding: 0 24px;
    display:flex; align-items:center; justify-content:space-between;
    position:sticky; top:0; z-index:100; height:64px;
  }
  .nav-logo { display:flex;align-items:center;gap:10px; }
  .nav-logo-icon {
    width:36px;height:36px;border-radius:10px;
    background: linear-gradient(135deg, var(--gold), var(--teal));
    display:flex;align-items:center;justify-content:center;
    font-size:18px; font-weight:900; color:var(--navy);
  }
  .nav-logo-text { font-size:18px;font-weight:700;color:var(--white); }
  .nav-logo-text span { color:var(--gold); }
  .nav-tabs {
    display:flex;gap:4px;
    background:rgba(255,255,255,.06);
    border-radius:12px; padding:4px;
  }
  .nav-tab {
    padding:7px 18px; border-radius:8px; font-size:13px;font-weight:600;
    cursor:pointer; border:none; background:transparent; color:rgba(255,255,255,.6);
    font-family:'Cairo',sans-serif; transition:all .2s;
  }
  .nav-tab.active { background:var(--gold); color:var(--navy); }
  .nav-tab:hover:not(.active) { color:var(--white); background:rgba(255,255,255,.1); }

  /* ── Main content ── */
  .main { flex:1; max-width:1100px; margin:0 auto; width:100%; padding:40px 24px 80px; }

  /* ── Card ── */
  .card {
    background:var(--white); border-radius:20px;
    border:1px solid var(--border);
    box-shadow:0 4px 24px rgba(13,27,42,.06);
    overflow:hidden;
  }
  .card-header {
    padding:24px 28px; border-bottom:1px solid var(--border);
    display:flex;align-items:center;justify-content:space-between;
  }
  .card-title {
    font-size:18px;font-weight:700;color:var(--navy);
    display:flex;align-items:center;gap:10px;
  }
  .card-title-icon {
    width:36px;height:36px;border-radius:10px;
    background:linear-gradient(135deg,var(--gold),var(--goldL));
    display:flex;align-items:center;justify-content:center;font-size:16px;
  }
  .card-body { padding:28px; }

  /* ── Form ── */
  .form-grid { display:grid;grid-template-columns:1fr 1fr;gap:20px; }
  @media(max-width:640px){ .form-grid { grid-template-columns:1fr; } }
  .form-group { display:flex;flex-direction:column;gap:8px; }
  .form-group.full { grid-column:1/-1; }
  label { font-size:13px;font-weight:600;color:var(--navy); }
  .required { color:var(--gold); margin-right:2px; }
  input, textarea, select {
    width:100%; padding:12px 16px;
    border:1.5px solid var(--border); border-radius:12px;
    font-family:'Cairo',sans-serif; font-size:14px;
    color:var(--navy); background:var(--grayL);
    transition:all .2s; outline:none; direction:rtl;
  }
  input:focus, textarea:focus, select:focus {
    border-color:var(--gold); background:var(--white);
    box-shadow:0 0 0 4px rgba(201,168,76,.12);
  }
  textarea { resize:vertical; min-height:100px; }
  .input-hint { font-size:11px;color:var(--gray);margin-top:2px; }

  /* ── Tags ── */
  .tags-input-wrap { display:flex;flex-wrap:wrap;gap:8px;align-items:center; }
  .tag {
    display:inline-flex;align-items:center;gap:6px;
    background:rgba(201,168,76,.12); border:1px solid rgba(201,168,76,.3);
    color:var(--navy); border-radius:99px; padding:4px 12px;
    font-size:13px; font-weight:500;
  }
  .tag-remove {
    cursor:pointer; color:var(--gray); font-size:16px; line-height:1;
    transition:color .15s;
  }
  .tag-remove:hover { color:var(--error); }
  .tags-add {
    padding:5px 14px; border-radius:99px; border:1.5px dashed var(--border);
    background:transparent; color:var(--gray); font-family:'Cairo',sans-serif;
    font-size:13px; cursor:pointer; width:auto;
    transition:all .2s;
  }
  .tags-add:focus { border-color:var(--gold); background:var(--white); box-shadow:0 0 0 3px rgba(201,168,76,.1); }

  /* ── Buttons ── */
  .btn {
    display:inline-flex;align-items:center;gap:8px;
    padding:12px 28px; border-radius:12px; border:none;
    font-family:'Cairo',sans-serif; font-size:15px;font-weight:700;
    cursor:pointer; transition:all .2s; text-decoration:none;
  }
  .btn-primary {
    background:linear-gradient(135deg,var(--gold),#b8922e);
    color:var(--navy); box-shadow:0 4px 16px rgba(201,168,76,.35);
  }
  .btn-primary:hover { transform:translateY(-2px); box-shadow:0 8px 24px rgba(201,168,76,.45); animation:glow 1.5s infinite; }
  .btn-primary:active { transform:translateY(0); }
  .btn-primary:disabled { opacity:.5; cursor:not-allowed; transform:none; box-shadow:none; animation:none; }
  .btn-secondary {
    background:var(--grayL); color:var(--navy); border:1.5px solid var(--border);
  }
  .btn-secondary:hover { background:var(--border); }
  .btn-teal {
    background:linear-gradient(135deg,var(--teal),var(--tealL));
    color:var(--white); box-shadow:0 4px 16px rgba(26,158,143,.3);
  }
  .btn-teal:hover { transform:translateY(-2px); box-shadow:0 8px 24px rgba(26,158,143,.4); }
  .btn-outline {
    background:transparent; color:var(--navy); border:1.5px solid var(--border);
  }
  .btn-outline:hover { border-color:var(--gold); color:var(--gold); }
  .btn-sm { padding:8px 18px; font-size:13px; }
  .btn-full { width:100%;justify-content:center; }

  /* ── Progress steps ── */
  .steps {
    display:flex; align-items:center; justify-content:center;
    gap:0; margin-bottom:36px;
  }
  .step-item { display:flex;flex-direction:column;align-items:center;gap:6px;position:relative; }
  .step-item:not(:last-child)::after {
    content:''; position:absolute; top:20px; left:0;
    width:calc(100% + 40px); height:2px;
    background:var(--border); z-index:0;
  }
  .step-item:not(:last-child).done::after { background:var(--gold); }
  .step-num {
    width:40px;height:40px;border-radius:50%;
    display:flex;align-items:center;justify-content:center;
    font-size:14px;font-weight:700;
    border:2px solid var(--border); background:var(--white);
    color:var(--gray); z-index:1; transition:all .3s;
  }
  .step-item.active .step-num {
    border-color:var(--gold); background:var(--gold);
    color:var(--navy); box-shadow:0 0 0 6px rgba(201,168,76,.2);
  }
  .step-item.done .step-num {
    border-color:var(--teal); background:var(--teal);
    color:var(--white);
  }
  .step-lbl { font-size:11px;font-weight:600;color:var(--gray);white-space:nowrap; }
  .step-item.active .step-lbl { color:var(--gold); }
  .step-item.done  .step-lbl { color:var(--teal); }

  /* ── Result sections ── */
  .result-grid { display:grid;grid-template-columns:1fr 1fr;gap:20px; }
  @media(max-width:768px){ .result-grid { grid-template-columns:1fr; } }
  .result-card {
    background:var(--grayL); border-radius:16px;
    border:1px solid var(--border); overflow:hidden;
  }
  .result-card-header {
    padding:14px 20px; background:var(--white);
    border-bottom:1px solid var(--border);
    display:flex;align-items:center;justify-content:space-between;
    font-size:14px;font-weight:700;color:var(--navy);
  }
  .result-card-icon { font-size:18px; }
  .result-card-body { padding:20px;font-size:13.5px;line-height:1.8;color:#374151;white-space:pre-wrap; }

  /* ── Loading dots ── */
  .dots span {
    display:inline-block;width:8px;height:8px;border-radius:50%;
    background:var(--navy); margin:0 3px;
    animation:dotBlink 1.4s infinite both;
  }
  .dots span:nth-child(2) { animation-delay:.2s; }
  .dots span:nth-child(3) { animation-delay:.4s; }

  /* ── Spinner ── */
  .spinner {
    width:22px;height:22px;border-radius:50%;
    border:2px solid rgba(13,27,42,.2);
    border-top-color:var(--navy);
    animation:spin .7s linear infinite;
  }

  /* ── Template picker ── */
  .tpl-grid { display:flex;gap:12px;flex-wrap:wrap; }
  .tpl-card {
    flex:1;min-width:100px;
    border-radius:12px; border:2px solid var(--border);
    padding:16px; cursor:pointer; transition:all .2s;
    text-align:center;font-size:13px;font-weight:600;
    background:var(--white);
  }
  .tpl-card:hover { border-color:var(--gold); }
  .tpl-card.selected { border-color:var(--gold); background:rgba(201,168,76,.08); }
  .tpl-swatch {
    height:50px;border-radius:8px;margin-bottom:10px;
    display:flex;align-items:center;justify-content:center;
    font-size:22px;
  }

  /* ── CV Preview ── */
  .cv-preview {
    background:var(--white); border-radius:16px;
    border:1px solid var(--border);
    box-shadow:0 8px 40px rgba(13,27,42,.1);
    overflow:hidden; position:relative;
  }
  .cv-preview-bar {
    padding:14px 20px; background:var(--navy);
    display:flex;align-items:center;gap:8px;
  }
  .cv-preview-dot { width:12px;height:12px;border-radius:50%; }
  .cv-preview-content { padding:32px; }
  .cv-name { font-size:26px;font-weight:900; }
  .cv-meta { font-size:13px;color:var(--gray);display:flex;flex-wrap:wrap;gap:12px;margin-top:8px; }
  .cv-section { margin-top:24px; }
  .cv-section-title {
    font-size:12px;font-weight:700;letter-spacing:1.5px;
    text-transform:uppercase;color:var(--gold);
    padding-bottom:8px;border-bottom:2px solid var(--gold);
    margin-bottom:12px;
  }

  /* ── Toast ── */
  .toast {
    position:fixed;bottom:28px;left:28px;
    background:var(--navy);color:var(--white);
    padding:14px 20px;border-radius:12px;
    font-size:14px;font-weight:600;
    box-shadow:0 8px 32px rgba(13,27,42,.25);
    display:flex;align-items:center;gap:10px;
    animation:slideIn .3s ease;
    z-index:9999; border-right:4px solid var(--gold);
    max-width:320px;
  }

  /* ── Section divider ── */
  .divider {
    height:1px;background:var(--border);margin:24px 0;
  }

  /* ── Chips ── */
  .chip {
    display:inline-flex;align-items:center;gap:4px;
    padding:4px 12px;border-radius:99px;font-size:12px;font-weight:600;
  }
  .chip-gold { background:rgba(201,168,76,.15);color:#8a6a1e; border:1px solid rgba(201,168,76,.3); }
  .chip-teal { background:rgba(26,158,143,.12);color:#0d6b5e; border:1px solid rgba(26,158,143,.25); }

  /* ── Question cards ── */
  .q-card {
    background:var(--white); border:1px solid var(--border);
    border-radius:14px; padding:18px 20px;
    display:flex; gap:14px; align-items:flex-start;
  }
  .q-num {
    width:32px;height:32px;border-radius:50%;flex-shrink:0;
    background:var(--navy);color:var(--gold);
    display:flex;align-items:center;justify-content:center;
    font-size:13px;font-weight:700;
  }
  .q-text { font-size:14px;line-height:1.7;color:var(--navy); }

  /* ── Section header ── */
  .section-hd {
    display:flex;align-items:center;justify-content:space-between;
    margin-bottom:20px;
  }
  .section-title {
    font-size:22px;font-weight:900;color:var(--navy);
    display:flex;align-items:center;gap:10px;
  }
  .section-subtitle { font-size:13px;color:var(--gray);margin-top:4px; }

  /* ── Footer ── */
  .footer {
    background:var(--navy); color:rgba(255,255,255,.5);
    text-align:center; padding:24px;font-size:13px;
    border-top:1px solid rgba(201,168,76,.15);
  }
  .footer span { color:var(--gold); }

  /* ── Responsive nav ── */
  @media(max-width:600px) {
    .nav-tabs { display:none; }
    .hero { padding:50px 16px 70px; }
    .hero-stats { gap:24px; }
    .main { padding:24px 16px 60px; }
    .card-body { padding:16px; }
  }
`;

// ─── TagsInput ────────────────────────────────────────────────────────────────
function TagsInput({ tags, onChange, placeholder }) {
  const [val, setVal] = useState("");
  const addTag = () => {
    const t = val.trim();
    if (t && !tags.includes(t)) onChange([...tags, t]);
    setVal("");
  };
  return (
    <div className="tags-input-wrap">
      {tags.map((t) => (
        <span key={t} className="tag">
          {t}
          <span className="tag-remove" onClick={() => onChange(tags.filter((x) => x !== t))}>×</span>
        </span>
      ))}
      <input
        className="tags-add"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(); } }}
        placeholder={placeholder}
        style={{ width: val ? `${val.length * 14 + 60}px` : "140px" }}
      />
    </div>
  );
}

// ─── Loading overlay ──────────────────────────────────────────────────────────
function LoadingOverlay({ msg }) {
  return (
    <div style={{
      position:"fixed",inset:0,background:"rgba(13,27,42,.65)",
      backdropFilter:"blur(6px)",display:"flex",flexDirection:"column",
      alignItems:"center",justifyContent:"center",zIndex:999,gap:20,
    }}>
      <div style={{
        background:G.white,borderRadius:20,padding:"36px 48px",
        textAlign:"center",boxShadow:"0 24px 80px rgba(0,0,0,.25)",
      }}>
        <div className="spinner" style={{margin:"0 auto 20px",width:40,height:40,borderWidth:3}} />
        <div style={{fontSize:16,fontWeight:700,color:G.navy,marginBottom:8}}>{msg}</div>
        <div className="dots" style={{display:"flex",justifyContent:"center",gap:4}}>
          <span/><span/><span/>
        </div>
      </div>
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ msg, icon = "✅" }) {
  return <div className="toast"><span>{icon}</span>{msg}</div>;
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab]   = useState("form");
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: "", specialization: "", phone: "", email: "", city: "",
    linkedin: "", objective: "", skills: [], langs: [],
    experiences: "", trainings: "", certs: "",
  });
  const [template, setTemplate] = useState("classic");
  const [loading, setLoading]   = useState(false);
  const [loadMsg, setLoadMsg]   = useState("");
  const [toast, setToast]       = useState(null);
  const [results, setResults]   = useState(null);
  const cvRef = useRef();

  const showToast = (msg, icon) => {
    setToast({ msg, icon });
    setTimeout(() => setToast(null), 3000);
  };

  const setF = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  // ── Build prompt ──
  const buildData = () => `
الاسم: ${form.name}
التخصص: ${form.specialization}
الهاتف: ${form.phone}
البريد الإلكتروني: ${form.email}
المدينة: ${form.city}
لينكدإن: ${form.linkedin}
الهدف الوظيفي: ${form.objective}
المهارات: ${form.skills.join(", ")}
اللغات: ${form.langs.join(", ")}
الخبرات العملية: ${form.experiences}
التدريب التعاوني: ${form.trainings}
الشهادات والدورات: ${form.certs}
  `.trim();

  // ── Generate all ──
  const generate = async () => {
    setLoading(true);
    const data = buildData();
    try {
      setLoadMsg("جاري إنشاء ملخص السيرة الذاتية...");
      const cvAr = await callClaude(
        "أنت خبير موارد بشرية. اكتب سيرة ذاتية احترافية باللغة العربية بتنسيق واضح وجذاب مع أقسام منظمة. الرد يجب أن يكون جيد التنسيق وعملياً.",
        `انشئ سيرة ذاتية احترافية لهذا الشخص:\n${data}`
      );

      setLoadMsg("جاري ترجمة السيرة للإنجليزية...");
      const cvEn = await callClaude(
        "You are a professional HR expert. Write a professional CV in English based on the provided Arabic data. Use proper English CV format with clear sections.",
        `Create a professional English CV based on this data:\n${data}`
      );

      setLoadMsg("جاري صياغة الوصف الوظيفي...");
      const desc = await callClaude(
        "أنت خبير توظيف. اكتب وصفاً وظيفياً احترافياً ومختصراً يُبرز نقاط القوة.",
        `اكتب وصفاً وظيفياً مميزاً لهذا المرشح في 3-4 جمل قوية:\n${data}`
      );

      setLoadMsg("جاري تحليل نقاط التحسين...");
      const tips = await callClaude(
        "أنت مستشار مهني خبير. قدم نصائح عملية ومحددة لتحسين السيرة الذاتية.",
        `بناءً على هذه البيانات، اعطني 5 نصائح محددة لتحسين السيرة الذاتية وزيادة فرص القبول:\n${data}`
      );

      setLoadMsg("جاري إعداد أسئلة المقابلة...");
      const questions = await callClaude(
        "أنت مُقابل توظيف خبير. اطرح أسئلة مقابلة ذكية وموجهة للتخصص.",
        `اكتب 8 أسئلة مقابلة وظيفية متوقعة ومفصلة لشخص تخصصه: ${form.specialization}. اجعلها متنوعة بين التقنية والسلوكية.`
      );

      setResults({ cvAr, cvEn, desc, tips, questions });
      setTab("result");
      showToast("تم إنشاء سيرتك الذاتية بنجاح 🎉", "✨");
    } catch (e) {
      showToast("حدث خطأ، يرجى المحاولة مجدداً", "❌");
    } finally {
      setLoading(false);
    }
  };

  // ── Print CV ──
  const printCV = () => {
    const tpl = TEMPLATES.find((t) => t.id === template);
    const w = window.open("", "_blank");
    w.document.write(`<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="utf-8"/>
<title>سيرة ذاتية - ${form.name}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap');
  body{font-family:'Cairo',sans-serif;direction:rtl;background:${tpl.bg};color:#1a1a1a;margin:0;padding:40px;}
  .cv-wrap{max-width:750px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 40px rgba(0,0,0,.1);}
  .cv-head{background:${tpl.accent};color:#fff;padding:40px;text-align:right;}
  .cv-head h1{font-size:32px;font-weight:900;margin:0 0 8px;}
  .cv-head p{opacity:.8;font-size:14px;}
  .cv-body{padding:40px;}
  .cv-sec{margin-bottom:28px;}
  .cv-sec h2{font-size:13px;letter-spacing:2px;text-transform:uppercase;color:${tpl.accent};border-bottom:2px solid ${tpl.accent};padding-bottom:8px;margin-bottom:14px;}
  .cv-sec p{font-size:14px;line-height:1.8;color:#374151;white-space:pre-wrap;}
  @media print{body{padding:0;}@page{margin:1cm;}}
</style>
</head>
<body>
<div class="cv-wrap">
  <div class="cv-head">
    <h1>${form.name}</h1>
    <p>${form.specialization} • ${form.city} • ${form.email} • ${form.phone}</p>
  </div>
  <div class="cv-body">
    <div class="cv-sec"><h2>السيرة الذاتية</h2><p>${results?.cvAr?.replace(/</g, "&lt;") || ""}</p></div>
  </div>
</div>
<script>window.onload=()=>{window.print();}<\/script>
</body></html>`);
    w.document.close();
  };

  const STEPS = ["بيانات شخصية", "الخبرات", "المهارات", "مراجعة"];

  // ─── Form Steps ──────────────────────────────────────────────────
  const renderStep = () => {
    if (step === 1) return (
      <div className="form-grid fade-up">
        {[
          ["name", "الاسم الكامل", "text", true, "محمد علي الأحمدي"],
          ["specialization", "التخصص / المسمى الوظيفي", "text", true, "مهندس برمجيات"],
          ["phone", "رقم الجوال", "tel", false, "05XXXXXXXX"],
          ["email", "البريد الإلكتروني", "email", false, "example@email.com"],
          ["city", "المدينة", "text", false, "الرياض"],
          ["linkedin", "LinkedIn", "text", false, "linkedin.com/in/username"],
        ].map(([k, lbl, type, req, ph]) => (
          <div className="form-group" key={k}>
            <label>{req && <span className="required">*</span>}{lbl}</label>
            <input type={type} placeholder={ph}
              value={form[k]} onChange={(e) => setF(k, e.target.value)} />
          </div>
        ))}
        <div className="form-group full">
          <label>الهدف الوظيفي</label>
          <textarea placeholder="أهدف إلى الانضمام لفريق محترف للمساهمة في..."
            value={form.objective} onChange={(e) => setF("objective", e.target.value)} />
        </div>
      </div>
    );

    if (step === 2) return (
      <div className="fade-up" style={{ display:"flex",flexDirection:"column",gap:24 }}>
        <div className="form-group">
          <label>الخبرات العملية</label>
          <textarea rows={5}
            placeholder="مثال: مطور واجهات أمامية في شركة XYZ (2022-2024)&#10;- طورت تطبيقات ويب باستخدام React&#10;- قادة فريق من 3 مطورين"
            value={form.experiences} onChange={(e) => setF("experiences", e.target.value)} />
        </div>
        <div className="form-group">
          <label>التدريب التعاوني / الميداني</label>
          <textarea rows={4}
            placeholder="مثال: تدريب في أرامكو السعودية - قسم تقنية المعلومات (صيف 2023)"
            value={form.trainings} onChange={(e) => setF("trainings", e.target.value)} />
        </div>
        <div className="form-group">
          <label>الشهادات والدورات</label>
          <textarea rows={3}
            placeholder="مثال: AWS Certified Solutions Architect, Google Data Analytics Certificate"
            value={form.certs} onChange={(e) => setF("certs", e.target.value)} />
        </div>
      </div>
    );

    if (step === 3) return (
      <div className="fade-up" style={{ display:"flex",flexDirection:"column",gap:24 }}>
        <div className="form-group">
          <label>المهارات التقنية والشخصية</label>
          <TagsInput tags={form.skills}
            onChange={(v) => setF("skills", v)}
            placeholder="أضف مهارة واضغط Enter" />
          <div className="input-hint">مثال: Python، React، إدارة المشاريع، التواصل الفعّال</div>
        </div>
        <div className="form-group">
          <label>اللغات</label>
          <TagsInput tags={form.langs}
            onChange={(v) => setF("langs", v)}
            placeholder="أضف لغة واضغط Enter" />
          <div className="input-hint">مثال: العربية (اللغة الأم)، الإنجليزية (متقدم)</div>
        </div>
        <div className="divider" />
        <div>
          <div className="form-group" style={{marginBottom:12}}>
            <label>اختر قالب السيرة الذاتية</label>
          </div>
          <div className="tpl-grid">
            {TEMPLATES.map((t) => (
              <div key={t.id}
                className={`tpl-card ${template === t.id ? "selected" : ""}`}
                onClick={() => setTemplate(t.id)}>
                <div className="tpl-swatch" style={{ background: t.accent }}>
                  {template === t.id ? "✓" : ""}
                </div>
                {t.label}
              </div>
            ))}
          </div>
        </div>
      </div>
    );

    if (step === 4) return (
      <div className="fade-up" style={{ display:"flex",flexDirection:"column",gap:20 }}>
        <div style={{background:"rgba(201,168,76,.08)",border:"1px solid rgba(201,168,76,.25)",borderRadius:14,padding:20}}>
          <div style={{fontSize:14,fontWeight:700,color:G.navy,marginBottom:14}}>📋 ملخص البيانات المدخلة</div>
          {[
            ["الاسم", form.name],["التخصص", form.specialization],
            ["الهاتف", form.phone],["البريد", form.email],
            ["المدينة", form.city],
          ].map(([lbl, val]) => val ? (
            <div key={lbl} style={{display:"flex",gap:8,marginBottom:8,fontSize:13}}>
              <span style={{color:G.gray,minWidth:70}}>{lbl}:</span>
              <span style={{color:G.navy,fontWeight:600}}>{val}</span>
            </div>
          ) : null)}
          {form.skills.length > 0 && (
            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:10}}>
              {form.skills.map((s) => <span key={s} className="chip chip-gold">{s}</span>)}
            </div>
          )}
        </div>
        <div style={{
          background:"linear-gradient(135deg,rgba(26,158,143,.08),rgba(26,158,143,.03))",
          border:"1px solid rgba(26,158,143,.2)",borderRadius:14,padding:18,
          display:"flex",gap:14,alignItems:"flex-start",
        }}>
          <div style={{fontSize:28}}>🤖</div>
          <div>
            <div style={{fontSize:14,fontWeight:700,color:G.navy,marginBottom:6}}>الذكاء الاصطناعي سيقوم بـ:</div>
            {["إنشاء سيرة ذاتية احترافية بالعربي والإنجليزي","صياغة وصف وظيفي مميز","تحليل نقاط القوة وتقديم 5 نصائح تحسين","إعداد 8 أسئلة مقابلة متوقعة لتخصصك"].map((i) => (
              <div key={i} style={{fontSize:13,color:G.gray,marginBottom:4,display:"flex",gap:8}}>
                <span style={{color:G.teal}}>✓</span>{i}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // ─── Result View ──────────────────────────────────────────────────
  const renderResult = () => {
    if (!results) return null;
    const questions = results.questions
      .split(/\n+/)
      .filter((l) => l.trim().match(/^[\d\-•]/))
      .slice(0, 8);

    return (
      <div style={{ display:"flex",flexDirection:"column",gap:24 }}>
        {/* Action bar */}
        <div style={{display:"flex",gap:12,flexWrap:"wrap",alignItems:"center"}}>
          <button className="btn btn-primary" onClick={printCV}>
            🖨️ تحميل PDF
          </button>
          <button className="btn btn-teal" onClick={() => setTab("form")}>
            ✏️ تعديل البيانات
          </button>
          <button className="btn btn-outline" onClick={() => setStep(1)||setResults(null)||setTab("form")}>
            🔄 سيرة ذاتية جديدة
          </button>
        </div>

        {/* CV Arabic + English */}
        <div className="result-grid">
          <div className="result-card slide-in">
            <div className="result-card-header">
              <span>📄 السيرة الذاتية - عربي</span>
              <span className="chip chip-gold">AR</span>
            </div>
            <div className="result-card-body">{results.cvAr}</div>
          </div>
          <div className="result-card slide-in" style={{animationDelay:".1s"}}>
            <div className="result-card-header">
              <span>📄 CV - English</span>
              <span className="chip chip-teal">EN</span>
            </div>
            <div className="result-card-body" style={{direction:"ltr",textAlign:"left"}}>{results.cvEn}</div>
          </div>
        </div>

        {/* Desc + Tips */}
        <div className="result-grid">
          <div className="result-card slide-in" style={{animationDelay:".15s"}}>
            <div className="result-card-header">
              <span>💼 الوصف الوظيفي</span>
            </div>
            <div className="result-card-body">{results.desc}</div>
          </div>
          <div className="result-card slide-in" style={{animationDelay:".2s"}}>
            <div className="result-card-header">
              <span>💡 نصائح التحسين</span>
            </div>
            <div className="result-card-body">{results.tips}</div>
          </div>
        </div>

        {/* Questions */}
        <div className="card slide-in" style={{animationDelay:".25s"}}>
          <div className="card-header">
            <div className="card-title">
              <div className="card-title-icon">🎯</div>
              أسئلة المقابلة المتوقعة
            </div>
            <span className="chip chip-teal">{form.specialization}</span>
          </div>
          <div className="card-body" style={{display:"flex",flexDirection:"column",gap:12}}>
            {questions.map((q, i) => (
              <div className="q-card" key={i}>
                <div className="q-num">{i + 1}</div>
                <div className="q-text">{q.replace(/^[\d\.\-•]+\s*/, "")}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // ─── Render ───────────────────────────────────────────────────────
  return (
    <>
      <style>{css}</style>
      {loading && <LoadingOverlay msg={loadMsg} />}
      {toast && <Toast msg={toast.msg} icon={toast.icon} />}

      <div className="app-shell">
        {/* Nav */}
        <nav className="nav">
          <div className="nav-logo">
            <div className="nav-logo-icon">و</div>
            <div className="nav-logo-text">وظيفتي <span>AI</span></div>
          </div>
          <div className="nav-tabs">
            {[["form","📝 إنشاء السيرة"],["result","📊 النتائج"]].map(([id, lbl]) => (
              <button key={id}
                className={`nav-tab ${tab === id ? "active" : ""}`}
                onClick={() => tab === "result" || id === "form" ? setTab(id) : null}>
                {lbl}
              </button>
            ))}
          </div>
        </nav>

        {/* Hero */}
        {tab === "form" && (
          <div className="hero">
            <div className="hero-badge"><span/>مدعوم بالذكاء الاصطناعي</div>
            <h1>سيرتك الذاتية <em>المثالية</em><br/>في ثوانٍ معدودة</h1>
            <p>أدخل بياناتك مرة واحدة، وسيقوم الذكاء الاصطناعي بصياغة سيرة ذاتية احترافية بالعربية والإنجليزية مع نصائح مخصصة وأسئلة مقابلة متوقعة.</p>
            <div className="hero-stats">
              {[["5K+","سيرة ذاتية"],["98%","رضا المستخدمين"],["3X","فرص القبول"]].map(([n, l]) => (
                <div className="hero-stat" key={l}>
                  <div className="num">{n}</div>
                  <div className="lbl">{l}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main */}
        <main className="main">
          {tab === "form" ? (
            <div className="card fade-up">
              {/* Steps */}
              <div style={{padding:"28px 28px 0"}}>
                <div className="steps" style={{gap:32}}>
                  {STEPS.map((lbl, i) => (
                    <div key={i}
                      className={`step-item ${step > i+1 ? "done" : ""} ${step === i+1 ? "active" : ""}`}>
                      <div className="step-num">{step > i+1 ? "✓" : i+1}</div>
                      <div className="step-lbl">{lbl}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card-body">
                <div className="section-hd">
                  <div>
                    <div className="section-title">
                      {["👤","💼","🛠️","✅"][step-1]} {STEPS[step-1]}
                    </div>
                    <div className="section-subtitle">
                      {["أدخل بياناتك الشخصية ومعلومات التواصل",
                        "أضف خبراتك العملية والتدريبات والشهادات",
                        "حدد مهاراتك ولغاتك واختر قالب السيرة",
                        "راجع بياناتك قبل إرسالها للذكاء الاصطناعي"][step-1]}
                    </div>
                  </div>
                  <div style={{color:G.gray,fontSize:13}}>{step} / {STEPS.length}</div>
                </div>

                {renderStep()}

                <div className="divider" />
                <div style={{display:"flex",justifyContent:"space-between",gap:12}}>
                  <button className="btn btn-secondary"
                    disabled={step === 1}
                    onClick={() => setStep((s) => s - 1)}>
                    ← السابق
                  </button>
                  {step < STEPS.length ? (
                    <button className="btn btn-primary"
                      disabled={step === 1 && (!form.name || !form.specialization)}
                      onClick={() => setStep((s) => s + 1)}>
                      التالي →
                    </button>
                  ) : (
                    <button className="btn btn-primary" onClick={generate}
                      disabled={!form.name || !form.specialization}>
                      🚀 إنشاء السيرة بالذكاء الاصطناعي
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="fade-up">
              <div className="section-hd" style={{marginBottom:24}}>
                <div>
                  <div className="section-title">✨ نتائج الذكاء الاصطناعي</div>
                  <div className="section-subtitle">سيرتك الذاتية جاهزة – راجع وحمّل</div>
                </div>
              </div>
              {renderResult()}
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="footer">
          صُنع بـ <span>❤️</span> لدعم الباحثين عن عمل في الوطن العربي — <span>وظيفتي AI</span> © 2025
        </footer>
      </div>
    </>
  );
}
