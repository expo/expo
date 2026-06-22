import { useState, useMemo } from "react";

// ─── i18n ────────────────────────────────────────────────────────
const I18N = {
  ar: {
    dir:"rtl", appName:"ميزانيتي", appSub:"تتبع مصاريفك بذكاء",
    addBtn:"+ إضافة", monthlyBudget:"الميزانية الشهرية", remaining:"المتبقي",
    spent:"المصروف", ofBudget:"% من الميزانية", transactions:"📋 المعاملات",
    statistics:"📊 الإحصائيات", all:"الكل", noExpenses:"لا توجد مصاريف بعد",
    distribution:"توزيع المصاريف", noData:"لا توجد بيانات",
    totalExpenses:"إجمالي المصاريف", txCount:"عدد المعاملات",
    avgExpense:"متوسط المصروف", topCategory:"أعلى فئة",
    addExpense:"إضافة مصروف جديد", descLabel:"الوصف",
    descPlaceholder:"مثال: غداء مطعم...", amountLabel:"المبلغ",
    dateLabel:"التاريخ", categoryLabel:"الفئة", saveBtn:"حفظ المصروف",
    settings:"⚙️ الإعدادات", language:"اللغة", currency:"العملة", saveSettings:"حفظ",
    upgrade:"⭐ احصل على Pro", upgradeTitle:"ترقية إلى Pro",
    freeLimit:"وصلت للحد المجاني (10 مصاريف)", unlimitedExpenses:"مصاريف غير محدودة",
    allCategories:"جميع الفئات", noAds:"بدون إعلانات", advancedStats:"إحصائيات متقدمة",
    exportData:"تصدير البيانات", monthly:"شهري", yearly:"سنوي", perMonth:"/شهر",
    perYear:"/سنة", savePercent:"وفّر 44%", startTrial:"ابدأ تجربة 7 أيام مجانية",
    restore:"استعادة الاشتراك", freePlan:"الخطة المجانية", proPlan:"Pro ⭐",
    active:"فعّال", cancel:"إلغاء", close:"إغلاق",
    adTitle:"إعلان", adSkip:"تخطي بعد",
    limitReached:"تحتاج Pro لإضافة أكثر من 10 مصاريف",
    months:["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"],
    categories:[
      {id:"food",label:"🍽️ طعام وشراب",color:"#E8735A"},
      {id:"transport",label:"🚗 مواصلات",color:"#5A8EE8"},
      {id:"housing",label:"🏠 سكن وفواتير",color:"#7B5AE8"},
      {id:"shopping",label:"🛍️ تسوق",color:"#E8B75A"},
      {id:"health",label:"💊 صحة",color:"#5AE8A0"},
      {id:"entertainment",label:"🎬 ترفيه",color:"#E85A9E"},
      {id:"education",label:"📚 تعليم",color:"#5AC8E8"},
      {id:"other",label:"📦 أخرى",color:"#A0A0A0"},
    ],
  },
  en: {
    dir:"ltr", appName:"MyBudget", appSub:"Track your spending smartly",
    addBtn:"+ Add", monthlyBudget:"Monthly Budget", remaining:"Remaining",
    spent:"Spent", ofBudget:"% of budget", transactions:"📋 Transactions",
    statistics:"📊 Statistics", all:"All", noExpenses:"No expenses yet",
    distribution:"Expenses by Category", noData:"No data",
    totalExpenses:"Total Expenses", txCount:"Transactions",
    avgExpense:"Avg. Expense", topCategory:"Top Category",
    addExpense:"Add New Expense", descLabel:"Description",
    descPlaceholder:"e.g. Restaurant lunch...", amountLabel:"Amount",
    dateLabel:"Date", categoryLabel:"Category", saveBtn:"Save Expense",
    settings:"⚙️ Settings", language:"Language", currency:"Currency", saveSettings:"Save",
    upgrade:"⭐ Get Pro", upgradeTitle:"Upgrade to Pro",
    freeLimit:"You reached the free limit (10 expenses)", unlimitedExpenses:"Unlimited expenses",
    allCategories:"All categories", noAds:"No ads", advancedStats:"Advanced statistics",
    exportData:"Export data", monthly:"Monthly", yearly:"Yearly", perMonth:"/mo",
    perYear:"/yr", savePercent:"Save 44%", startTrial:"Start 7-day free trial",
    restore:"Restore purchase", freePlan:"Free Plan", proPlan:"Pro ⭐",
    active:"Active", cancel:"Cancel", close:"Close",
    adTitle:"Advertisement", adSkip:"Skip in",
    limitReached:"Upgrade to Pro to add more than 10 expenses",
    months:["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
    categories:[
      {id:"food",label:"🍽️ Food & Drink",color:"#E8735A"},
      {id:"transport",label:"🚗 Transport",color:"#5A8EE8"},
      {id:"housing",label:"🏠 Housing & Bills",color:"#7B5AE8"},
      {id:"shopping",label:"🛍️ Shopping",color:"#E8B75A"},
      {id:"health",label:"💊 Health",color:"#5AE8A0"},
      {id:"entertainment",label:"🎬 Entertainment",color:"#E85A9E"},
      {id:"education",label:"📚 Education",color:"#5AC8E8"},
      {id:"other",label:"📦 Other",color:"#A0A0A0"},
    ],
  },
};

const CURRENCIES = [
  {code:"SAR",symbol:"ر.س"},{code:"AED",symbol:"د.إ"},{code:"USD",symbol:"$"},
  {code:"EUR",symbol:"€"},{code:"GBP",symbol:"£"},{code:"EGP",symbol:"ج.م"},
  {code:"KWD",symbol:"د.ك"},{code:"TRY",symbol:"₺"},{code:"MAD",symbol:"د.م"},
];
const LANG_OPTIONS = [{code:"ar",label:"🇸🇦 العربية"},{code:"en",label:"🇺🇸 English"}];
const FREE_LIMIT = 10;

const INITIAL = [
  {id:1,desc:"lunch",amount:85,category:"food",date:"2026-06-20"},
  {id:2,desc:"fuel",amount:200,category:"transport",date:"2026-06-19"},
  {id:3,desc:"electric",amount:320,category:"housing",date:"2026-06-18"},
  {id:4,desc:"clothes",amount:450,category:"shopping",date:"2026-06-17"},
  {id:5,desc:"pharmacy",amount:65,category:"health",date:"2026-06-15"},
];
const DESCS = {
  ar:{lunch:"غداء مع الزملاء",fuel:"تعبئة وقود",electric:"فاتورة الكهرباء",clothes:"ملابس صيفية",pharmacy:"صيدلية"},
  en:{lunch:"Lunch with colleagues",fuel:"Fuel refill",electric:"Electricity bill",clothes:"Summer clothes",pharmacy:"Pharmacy"},
};

// ─── Fake Ad Component ────────────────────────────────────────────
function BannerAd({ t }) {
  const ads = [
    {icon:"🏦", title: t.dir==="rtl"?"بنك الراجحي – فتح حساب مجاناً":"Rajhi Bank – Open account free", color:"#1a3a5c"},
    {icon:"🛒", title: t.dir==="rtl"?"نون – خصم 20% على أول طلب":"Noon – 20% off first order", color:"#3a1a5c"},
    {icon:"📱", title: t.dir==="rtl"?"STC – اشتراكات الإنترنت":"STC – Internet Plans", color:"#1a5c3a"},
  ];
  const ad = ads[Math.floor(Math.random()*ads.length)];
  return (
    <div style={{
      background:`linear-gradient(135deg, ${ad.color}, ${ad.color}cc)`,
      borderRadius:12, padding:"10px 14px", marginBottom:14,
      display:"flex", alignItems:"center", gap:10,
      border:"1px solid rgba(255,255,255,0.12)",
    }}>
      <div style={{fontSize:22}}>{ad.icon}</div>
      <div style={{flex:1}}>
        <div style={{fontSize:10,color:"rgba(255,255,255,0.5)",marginBottom:2}}>{t.adTitle}</div>
        <div style={{fontSize:13,fontWeight:600,color:"#fff"}}>{ad.title}</div>
      </div>
      <div style={{
        background:"rgba(255,255,255,0.15)", borderRadius:8,
        padding:"4px 10px", fontSize:11, color:"#fff", cursor:"pointer",
      }}>›</div>
    </div>
  );
}

// ─── Interstitial Ad ─────────────────────────────────────────────
function InterstitialAd({ t, onClose }) {
  const [seconds, setSeconds] = useState(5);
  useState(() => {
    const timer = setInterval(() => {
      setSeconds(s => {
        if (s <= 1) { clearInterval(timer); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  });
  return (
    <div style={{
      position:"fixed",inset:0,background:"rgba(0,0,0,0.95)",
      display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
      zIndex:500,
    }}>
      <div style={{position:"absolute",top:16,[t.dir==="rtl"?"left":"right"]:16}}>
        {seconds === 0
          ? <button onClick={onClose} style={{background:"rgba(255,255,255,0.15)",border:"none",borderRadius:999,padding:"6px 14px",color:"#fff",fontSize:13,cursor:"pointer"}}>{t.close} ✕</button>
          : <div style={{background:"rgba(255,255,255,0.1)",borderRadius:999,padding:"6px 14px",color:"#aaa",fontSize:13}}>{t.adSkip} {seconds}s</div>
        }
      </div>
      <div style={{textAlign:"center",padding:24}}>
        <div style={{fontSize:10,color:"#666",marginBottom:16,letterSpacing:2}}>{t.adTitle.toUpperCase()}</div>
        <div style={{fontSize:60,marginBottom:16}}>🛍️</div>
        <div style={{fontSize:20,fontWeight:700,color:"#fff",marginBottom:8}}>
          {t.dir==="rtl" ? "تسوق الآن على نون" : "Shop Now on Noon"}
        </div>
        <div style={{fontSize:14,color:"#aaa",marginBottom:24}}>
          {t.dir==="rtl" ? "خصم 30% على جميع المنتجات" : "30% off all products today"}
        </div>
        <button style={{
          background:"linear-gradient(135deg,#f77f00,#d62828)",
          color:"#fff",border:"none",borderRadius:14,padding:"12px 32px",
          fontSize:15,fontWeight:700,cursor:"pointer",
        }}>
          {t.dir==="rtl" ? "تسوق الآن" : "Shop Now"}
        </button>
      </div>
    </div>
  );
}

// ─── Upgrade Modal ────────────────────────────────────────────────
function UpgradeModal({ t, sym, onClose, onSubscribe }) {
  const [plan, setPlan] = useState("yearly");
  const features = [t.unlimitedExpenses, t.allCategories, t.noAds, t.advancedStats, t.exportData];
  return (
    <div style={{
      position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",backdropFilter:"blur(10px)",
      display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:300,
    }} onClick={e => e.target===e.currentTarget && onClose()}>
      <div dir={t.dir} style={{
        background:"linear-gradient(180deg,#1f1f3a,#12122a)",
        borderRadius:"26px 26px 0 0",padding:"28px 22px 40px",
        width:"100%",maxWidth:560,
        border:"1px solid rgba(255,255,255,0.12)",borderBottom:"none",
      }}>
        {/* Header */}
        <div style={{textAlign:"center",marginBottom:22}}>
          <div style={{fontSize:36,marginBottom:8}}>⭐</div>
          <div style={{fontSize:20,fontWeight:800,color:"#fff"}}>{t.upgradeTitle}</div>
          <div style={{fontSize:13,color:"#888",marginTop:4}}>{t.freeLimit}</div>
        </div>

        {/* Features */}
        <div style={{marginBottom:20,display:"flex",flexDirection:"column",gap:9}}>
          {features.map(f => (
            <div key={f} style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:20,height:20,borderRadius:999,background:"rgba(90,232,160,0.2)",
                display:"flex",alignItems:"center",justifyContent:"center",
                color:"#5AE8A0",fontSize:12,flexShrink:0}}>✓</div>
              <span style={{fontSize:14,color:"#ccc"}}>{f}</span>
            </div>
          ))}
        </div>

        {/* Plan Toggle */}
        <div style={{display:"flex",gap:10,marginBottom:18}}>
          {[["monthly","2.99",""],["yearly","19.99",t.savePercent]].map(([p,price,badge]) => (
            <div key={p} onClick={() => setPlan(p)} style={{
              flex:1,padding:"14px 12px",borderRadius:16,
              border:`2px solid ${plan===p?"#667eea":"rgba(255,255,255,0.1)"}`,
              background:plan===p?"rgba(102,126,234,0.15)":"rgba(255,255,255,0.04)",
              cursor:"pointer",textAlign:"center",position:"relative",
            }}>
              {badge && <div style={{
                position:"absolute",top:-10,[t.dir==="rtl"?"left":"right"]:8,
                background:"linear-gradient(135deg,#f77f00,#d62828)",
                color:"#fff",fontSize:9,fontWeight:700,padding:"2px 8px",borderRadius:999,
              }}>{badge}</div>}
              <div style={{fontSize:11,color:"#888",marginBottom:4}}>
                {p==="monthly"?t.monthly:t.yearly}
              </div>
              <div style={{fontSize:20,fontWeight:800,color:plan===p?"#a78bfa":"#fff"}}>
                {sym}{price}
              </div>
              <div style={{fontSize:10,color:"#666"}}>
                {p==="monthly"?t.perMonth:t.perYear}
              </div>
            </div>
          ))}
        </div>

        <button onClick={() => onSubscribe(plan)} style={{
          width:"100%",background:"linear-gradient(135deg,#667eea,#764ba2)",
          color:"#fff",border:"none",borderRadius:14,padding:"15px",
          fontSize:16,fontWeight:700,cursor:"pointer",marginBottom:12,
          boxShadow:"0 6px 24px rgba(102,126,234,0.5)",fontFamily:"inherit",
        }}>{t.startTrial} 🚀</button>

        <button onClick={onClose} style={{
          width:"100%",background:"transparent",color:"#666",border:"none",
          fontSize:13,cursor:"pointer",padding:8,fontFamily:"inherit",
        }}>{t.close}</button>
      </div>
    </div>
  );
}

// ─── Settings Modal ───────────────────────────────────────────────
function SettingsModal({ t, lang, currency, isPro, sym, onSave, onClose, onManage }) {
  const [tLang, setTLang] = useState(lang);
  const [tCur, setTCur] = useState(currency);
  return (
    <div style={{
      position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",backdropFilter:"blur(10px)",
      display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,padding:16,
    }} onClick={e => e.target===e.currentTarget && onClose()}>
      <div dir={t.dir} style={{
        background:"#1A1A2E",borderRadius:22,padding:"24px 20px",
        width:"100%",maxWidth:420,border:"1px solid rgba(255,255,255,0.12)",
      }}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <div style={{fontSize:16,fontWeight:700}}>⚙️ {t.settings.replace("⚙️ ","")}</div>
          <button onClick={onClose} style={{background:"rgba(255,255,255,0.08)",border:"none",borderRadius:999,width:30,height:30,cursor:"pointer",color:"#888"}}>✕</button>
        </div>

        {/* Plan Status */}
        <div style={{
          background:isPro?"rgba(90,232,160,0.1)":"rgba(255,255,255,0.05)",
          border:`1px solid ${isPro?"rgba(90,232,160,0.3)":"rgba(255,255,255,0.1)"}`,
          borderRadius:14,padding:"14px 16px",marginBottom:18,
          display:"flex",alignItems:"center",justifyContent:"space-between",
        }}>
          <div>
            <div style={{fontSize:12,color:"#888",marginBottom:2}}>{isPro?t.proPlan:t.freePlan}</div>
            <div style={{fontSize:14,fontWeight:700,color:isPro?"#5AE8A0":"#fff"}}>
              {isPro?"✓ "+t.active : `${t.dir==="rtl"?"مستخدم":"Used"} ${FREE_LIMIT} ${t.dir==="rtl"?"مجانية":"free"}`}
            </div>
          </div>
          {!isPro && <button onClick={onManage} style={{
            background:"linear-gradient(135deg,#667eea,#764ba2)",color:"#fff",
            border:"none",borderRadius:10,padding:"8px 14px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",
          }}>{t.upgrade}</button>}
        </div>

        {/* Language */}
        <div style={{marginBottom:16}}>
          <div style={{fontSize:11,color:"#888",marginBottom:8}}>{t.language}</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {LANG_OPTIONS.map(l => (
              <button key={l.code} onClick={() => setTLang(l.code)} style={{
                padding:"9px",borderRadius:11,border:`1.5px solid ${tLang===l.code?"#667eea":"rgba(255,255,255,0.12)"}`,
                background:tLang===l.code?"rgba(102,126,234,0.2)":"rgba(255,255,255,0.04)",
                color:tLang===l.code?"#a78bfa":"#888",fontSize:13,cursor:"pointer",fontFamily:"inherit",fontWeight:tLang===l.code?700:400,
              }}>{l.label}</button>
            ))}
          </div>
        </div>

        {/* Currency */}
        <div style={{marginBottom:20}}>
          <div style={{fontSize:11,color:"#888",marginBottom:8}}>{t.currency}</div>
          <div style={{position:"relative"}}>
            <select value={tCur} onChange={e => setTCur(e.target.value)} style={{
              width:"100%",background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.15)",
              borderRadius:12,padding:"11px 14px",color:"#E8E8F0",fontSize:14,outline:"none",
              cursor:"pointer",appearance:"none",WebkitAppearance:"none",fontFamily:"inherit",
            }}>
              {CURRENCIES.map(c => <option key={c.code} value={c.code} style={{background:"#1A1A2E"}}>{c.symbol} — {c.code}</option>)}
            </select>
            <div style={{position:"absolute",top:"50%",[t.dir==="rtl"?"left":"right"]:12,transform:"translateY(-50%)",color:"#888",pointerEvents:"none"}}>▼</div>
          </div>
        </div>

        <button onClick={() => onSave(tLang,tCur)} style={{
          width:"100%",background:"linear-gradient(135deg,#667eea,#764ba2)",color:"#fff",
          border:"none",borderRadius:13,padding:"13px",fontSize:15,fontWeight:700,
          cursor:"pointer",fontFamily:"inherit",
        }}>{t.saveSettings} ✓</button>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────
export default function App() {
  const [lang, setLang] = useState("ar");
  const [currency, setCurrency] = useState("SAR");
  const [isPro, setIsPro] = useState(false);
  const [expenses, setExpenses] = useState(INITIAL);
  const [form, setForm] = useState({desc:"",amount:"",category:"food",date:new Date().toISOString().split("T")[0]});
  const [showForm, setShowForm] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAd, setShowAd] = useState(false);
  const [filterCat, setFilterCat] = useState("all");
  const [view, setView] = useState("list");
  const [budget, setBudget] = useState(2000);
  const [editBudget, setEditBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState("2000");
  const [adCount, setAdCount] = useState(0);

  const t = I18N[lang] || I18N.ar;
  const sym = CURRENCIES.find(c => c.code === currency)?.symbol || "$";

  function getDesc(e) {
    return (DESCS[lang]||DESCS.en)[e.desc] || e.desc;
  }
  function formatDate(s) {
    const d = new Date(s);
    return `${d.getDate()} ${t.months[d.getMonth()]} ${d.getFullYear()}`;
  }
  function getCat(id) { return t.categories.find(c=>c.id===id)||t.categories[7]; }

  const filtered = useMemo(() =>
    filterCat==="all" ? expenses : expenses.filter(e=>e.category===filterCat),
    [expenses,filterCat]
  );
  const total = useMemo(()=>expenses.reduce((s,e)=>s+e.amount,0),[expenses]);
  const remaining = budget - total;
  const progress = Math.min((total/budget)*100,100);
  const barColor = progress>90?"#E8735A":progress>70?"#E8B75A":"#5AE8A0";
  const catTotals = useMemo(()=>{
    const m={};
    expenses.forEach(e=>{m[e.category]=(m[e.category]||0)+e.amount;});
    return Object.entries(m).sort((a,b)=>b[1]-a[1]);
  },[expenses]);

  function tryAddExpense() {
    if (!form.desc||!form.amount||isNaN(+form.amount)||+form.amount<=0) return;
    if (!isPro && expenses.length >= FREE_LIMIT) {
      setShowForm(false); setShowUpgrade(true); return;
    }
    setExpenses(p=>[{id:Date.now(),...form,amount:+form.amount},...p]);
    setForm({desc:"",amount:"",category:"food",date:new Date().toISOString().split("T")[0]});
    setShowForm(false);
    // show interstitial every 3 additions
    const next = adCount + 1;
    setAdCount(next);
    if (!isPro && next % 3 === 0) setShowAd(true);
  }

  function handleOpenForm() {
    if (!isPro && expenses.length >= FREE_LIMIT) { setShowUpgrade(true); return; }
    setShowForm(true);
  }

  function handleSubscribe(plan) {
    // In real app: integrate Stripe / Play Billing here
    setIsPro(true);
    setShowUpgrade(false);
  }

  const inputStyle = {
    width:"100%",background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.12)",
    borderRadius:12,padding:"11px 13px",color:"#E8E8F0",fontSize:14,outline:"none",
    boxSizing:"border-box",fontFamily:"inherit",direction:t.dir,
  };

  return (
    <div dir={t.dir} style={{
      minHeight:"100vh",
      background:"linear-gradient(135deg,#0F0F1A 0%,#1A1A2E 50%,#16213E 100%)",
      fontFamily:"'Segoe UI','Tahoma',sans-serif",color:"#E8E8F0",
    }}>

      {/* HEADER */}
      <div style={{
        background:"rgba(255,255,255,0.04)",backdropFilter:"blur(20px)",
        borderBottom:"1px solid rgba(255,255,255,0.08)",padding:"14px 18px",
        display:"flex",alignItems:"center",justifyContent:"space-between",
        position:"sticky",top:0,zIndex:10,
      }}>
        <div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:19,fontWeight:700}}>💰 {t.appName}</span>
            {isPro && <span style={{background:"linear-gradient(
