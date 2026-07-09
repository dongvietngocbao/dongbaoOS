import { useState, useEffect, useRef } from "react";

// ============ DESIGN TOKENS ============
const T = {
  bg: "#F4F3F0",
  card: "#FFFFFF",
  dark: "#1A1A1A",
  darkCard: "#222222",
  text: "#1A1A1A",
  sub: "#8E8E93",
  muted: "#C7C7CC",
  border: "#E8E7E3",
  accent: "#CAFF4E",
  accentDark: "#3D5A00",
  green: "#34C759",
  red: "#FF3B30",
  shadow: "0 2px 16px rgba(0,0,0,0.06)",
  shadowLg: "0 8px 32px rgba(0,0,0,0.10)",
  radius: 18,
  radiusSm: 12,
};

// ============ DATA ============
const DAYS = ["CN","T2","T3","T4","T5","T6","T7"];
const MONTHS = ["Tháng 1","Tháng 2","Tháng 3","Tháng 4","Tháng 5","Tháng 6","Tháng 7","Tháng 8","Tháng 9","Tháng 10","Tháng 11","Tháng 12"];

const TRAINING = {
  1: { label: "Strength A", desc: "Squat · Push-up · Row", type: "strength", time: "45–60p" },
  2: { label: "Đi bộ Zone 2", desc: "Nhẹ nhàng · nói chuyện được", type: "cardio", time: "30–45p" },
  3: { label: "Strength B", desc: "Hinge · Pull-up · Lunge", type: "strength", time: "45–60p" },
  4: { label: "Đi bộ + Mobility", desc: "Đi bộ 30p · Giãn cơ 10p", type: "cardio", time: "30–45p" },
  5: { label: "Strength C", desc: "Full body hoặc nghỉ", type: "strength", time: "45–60p" },
  6: { label: "Tự do", desc: "Bơi · Leo núi · Thể thao", type: "free", time: "Tự do" },
  0: { label: "Phục hồi", desc: "Nghỉ ngơi · Meal prep", type: "rest", time: "—" },
};

const buildTasks = (dow) => ({
  training: [
    { id: "t_main", label: TRAINING[dow].label, sub: TRAINING[dow].desc },
    ...(dow >= 1 && dow <= 5 && dow % 2 === 1 ? [{ id: "t_collagen", label: "Collagen + VitC", sub: "60 phút trước tập" }] : []),
    { id: "t_walk", label: "Đi bộ 8.000+ bước", sub: "Trong ngày" },
  ],
  nutrition: [
    { id: "n_protein", label: "Đủ protein mỗi bữa", sub: "~35-40g × 3 bữa" },
    { id: "n_veg", label: "Rau ≥ 3 phần", sub: "Ăn rau trước, cơm sau" },
    { id: "n_water", label: "Uống 2–3 lít nước", sub: "" },
    { id: "n_stop", label: "Ngừng ăn 3h trước ngủ", sub: "" },
  ],
  mind: [
    { id: "m_read", label: "Đọc 10 trang sách", sub: "" },
    { id: "m_note", label: "Viết 1 ghi chú", sub: "Suy nghĩ · Bài học · Ý tưởng" },
    { id: "m_breath", label: "Thở 4-7-8", sub: "Hít 4s · Giữ 7s · Thở 8s × 3" },
  ],
  sleep: [
    { id: "s_time", label: "Ngủ đúng giờ", sub: "Cố định, kể cả cuối tuần" },
    { id: "s_screen", label: "Không màn hình 1h", sub: "Trước khi ngủ" },
  ],
});

const SECTIONS = [
  { key: "training", label: "Luyện Tập", icon: "●" },
  { key: "nutrition", label: "Dinh Dưỡng", icon: "◐" },
  { key: "mind", label: "Tư Duy", icon: "◆" },
  { key: "sleep", label: "Giấc Ngủ", icon: "◑" },
];

const WEEK = [
  { day: "T2", label: "Strength A", type: "s" },
  { day: "T3", label: "Walk", type: "c" },
  { day: "T4", label: "Strength B", type: "s" },
  { day: "T5", label: "Walk+", type: "c" },
  { day: "T6", label: "Strength C", type: "s" },
  { day: "T7", label: "Free", type: "f" },
  { day: "CN", label: "Rest", type: "r" },
];

const BIOMARKERS = [
  { name: "ApoB", target: "< 60", unit: "mg/dL", desc: "Xơ vữa động mạch" },
  { name: "Fasting Insulin", target: "2–5", unit: "µIU/mL", desc: "Kháng insulin" },
  { name: "HbA1c", target: "4.8–5.3", unit: "%", desc: "Đường huyết TB" },
  { name: "hs-CRP", target: "< 0.5", unit: "mg/L", desc: "Viêm âm ỉ" },
  { name: "VO2 Max", target: "Top 25%", unit: "", desc: "Sức bền tim phổi" },
  { name: "Grip", target: "> 50", unit: "kg", desc: "Sức mạnh tổng thể" },
];

const LAYERS = [
  { id: 1, name: "Nền Móng", period: "6 tháng đầu", focus: ["Tập 3-4x/tuần", "Ngủ 7-8h", "Protein + Rau", "Đi bộ mỗi ngày"] },
  { id: 2, name: "Mở Rộng", period: "Tháng 7–18", focus: ["VO2 Max 4×4", "Sauna 2-3x", "XN Biomarker", "Bổ sung theo data"] },
  { id: 3, name: "Tối Ưu", period: "Sau 18 tháng", focus: ["Cold Plunge", "NSDR", "Dual-tasking", "Geroprotectors"] },
];

const FOODS = [
  { n: "Trứng", p: "Protein+Choline", e: "🥚" },
  { n: "Cá Nục", p: "Omega-3", e: "🐟" },
  { n: "Đậu Phụ", p: "Protein TV", e: "🫘" },
  { n: "Rau Ngót", p: "Vi chất VN", e: "🥬" },
  { n: "Khoai Lang", p: "Carb chậm", e: "🍠" },
  { n: "Nghệ Đỏ", p: "Kháng viêm", e: "🟡" },
  { n: "Ổi", p: "VitC ×4 cam", e: "🍈" },
  { n: "Cua Đồng", p: "Canxi ×40", e: "🦀" },
  { n: "Tỏi+Gừng", p: "Miễn dịch", e: "🧄" },
  { n: "Sữa chua", p: "Probiotics", e: "🥛" },
];

const KEY = "dongbao_os_v4";

export default function App() {
  const [tab, setTab] = useState("today");
  const [checks, setChecks] = useState({});
  const [weekDone, setWeekDone] = useState({});
  const [feeling, setFeeling] = useState(0);
  const [noteText, setNoteText] = useState("");
  const [layer, setLayer] = useState(1);
  const [openSec, setOpenSec] = useState({ training: true, nutrition: true, mind: true, sleep: true });
  const [expandDay, setExpandDay] = useState(null);

  useEffect(() => {
    try { const s = localStorage.getItem(KEY); if (s) { const d = JSON.parse(s); if(d.checks) setChecks(d.checks); if(d.weekDone) setWeekDone(d.weekDone); if(d.feeling) setFeeling(d.feeling); if(d.noteText) setNoteText(d.noteText); if(d.layer) setLayer(d.layer); } } catch(e){}
  }, []);
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify({ checks, weekDone, feeling, noteText, layer })); } catch(e){}
  }, [checks, weekDone, feeling, noteText, layer]);

  const now = new Date();
  const dow = now.getDay();
  const tasks = buildTasks(dow);
  const allIds = [...tasks.training, ...tasks.nutrition, ...tasks.mind, ...tasks.sleep].map(t => t.id);
  const doneCount = allIds.filter(id => checks[id]).length;
  const totalCount = allIds.length;
  const pct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  const greetH = now.getHours();
  const greet = greetH < 12 ? "Chào buổi sáng" : greetH < 18 ? "Chào buổi chiều" : "Chào buổi tối";
  const training = TRAINING[dow];

  const toggle = id => setChecks(p => ({ ...p, [id]: !p[id] }));
  const toggleSec = k => setOpenSec(p => ({ ...p, [k]: !p[k] }));

  // ============ COMMON COMPONENTS ============

  const Card = ({ children, dark, style, onClick }) => (
    <div onClick={onClick} style={{
      background: dark ? T.dark : T.card,
      borderRadius: T.radius, padding: 18,
      boxShadow: dark ? T.shadowLg : T.shadow,
      ...(onClick ? { cursor: "pointer" } : {}),
      ...style,
    }}>{children}</div>
  );

  const CheckItem = ({ checked, label, sub, onToggle }) => (
    <button onClick={onToggle} style={{
      display: "flex", alignItems: "center", gap: 14, padding: "13px 0",
      background: "none", border: "none", width: "100%", textAlign: "left",
      cursor: "pointer", borderBottom: `1px solid ${T.border}`,
    }}>
      <div style={{
        width: 22, height: 22, borderRadius: 22, flexShrink: 0,
        border: `2px solid ${checked ? T.green : T.muted}`,
        background: checked ? T.green : "transparent",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all .25s cubic-bezier(.4,0,.2,1)",
      }}>
        {checked && <svg width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4.5L4 7.5L10 1" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{
          fontSize: 15, fontWeight: 500, letterSpacing: -0.3,
          color: checked ? T.sub : T.text,
          textDecoration: checked ? "line-through" : "none",
          transition: "all .25s",
        }}>{label}</div>
        {sub && <div style={{ fontSize: 12, color: T.sub, marginTop: 2 }}>{sub}</div>}
      </div>
      {checked && <span style={{ fontSize: 11, color: T.green, fontWeight: 600 }}>Done</span>}
    </button>
  );

  const SectionHead = ({ icon, label, done, total, sKey }) => (
    <button onClick={() => toggleSec(sKey)} style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      width: "100%", padding: "16px 0 6px", background: "none", border: "none", cursor: "pointer",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 10, color: T.sub }}>{icon}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: T.sub, textTransform: "uppercase", letterSpacing: 1.5 }}>{label}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {done === total && total > 0 && <span style={{ fontSize: 9, padding: "2px 7px", background: T.accent, color: T.accentDark, borderRadius: 6, fontWeight: 700 }}>DONE</span>}
        <span style={{ fontSize: 12, fontWeight: 600, color: done === total && total > 0 ? T.green : T.muted }}>{done}/{total}</span>
        <svg width="12" height="12" viewBox="0 0 12 12" style={{ transform: openSec[sKey] ? "rotate(0)" : "rotate(-90deg)", transition: "transform .2s" }}><path d="M3 4.5L6 7.5L9 4.5" stroke={T.muted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>
      </div>
    </button>
  );

  const ProgressRing = ({ size, stroke, pct: p, children }) => {
    const r = (size - stroke) / 2;
    const c = 2 * Math.PI * r;
    return (
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={T.border} strokeWidth={stroke} />
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={p >= 100 ? T.green : T.dark}
            strokeWidth={stroke} strokeDasharray={c} strokeDashoffset={c - (p/100)*c}
            strokeLinecap="round" style={{ transition: "stroke-dashoffset .8s cubic-bezier(.4,0,.2,1)" }} />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>{children}</div>
      </div>
    );
  };

  // ============ TODAY ============

  const TodayView = () => {
    const secCounts = SECTIONS.map(s => {
      const items = tasks[s.key];
      return { ...s, done: items.filter(t => checks[t.id]).length, total: items.length };
    });

    return (
      <div style={{ animation: "slideUp .5s cubic-bezier(.4,0,.2,1)" }}>
        {/* Greeting */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 15, color: T.sub, fontWeight: 400 }}>{greet}</div>
            <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: -1, color: T.text, marginTop: 2 }}>dongbao</div>
          </div>
          <ProgressRing size={54} stroke={3.5} pct={pct}>
            <span style={{ fontSize: 16, fontWeight: 800, color: T.text }}>{doneCount}</span>
          </ProgressRing>
        </div>

        {/* Hero training card */}
        <Card dark style={{ marginBottom: 16, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -20, right: -20, width: 100, height: 100, borderRadius: "50%", background: T.accent, opacity: 0.08 }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 6 }}>Hôm nay · {DAYS[dow]}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", letterSpacing: -0.5 }}>{training.label}</div>
              <div style={{ fontSize: 13, color: "#888", marginTop: 4 }}>{training.desc}</div>
            </div>
            <div style={{
              padding: "6px 14px", borderRadius: 10,
              background: training.type === "strength" ? T.accent : training.type === "cardio" ? "#fff" : "#444",
              color: training.type === "strength" ? T.accentDark : training.type === "cardio" ? T.dark : "#fff",
              fontSize: 12, fontWeight: 700,
            }}>{training.time}</div>
          </div>
        </Card>

        {/* Feeling bar */}
        <Card style={{ marginBottom: 16, padding: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: T.sub, letterSpacing: 0.5 }}>Năng lượng</span>
            {feeling > 0 && <span style={{ fontSize: 24, fontWeight: 800, color: feeling >= 7 ? T.green : feeling >= 4 ? T.text : T.red }}>{feeling}</span>}
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            {[1,2,3,4,5,6,7,8,9,10].map(n => (
              <button key={n} onClick={() => setFeeling(n)} style={{
                flex: 1, height: 28, borderRadius: 8, border: "none", cursor: "pointer",
                background: n <= feeling ? (feeling >= 7 ? T.green : feeling >= 4 ? T.dark : T.red) : T.border,
                transition: "all .15s cubic-bezier(.4,0,.2,1)",
              }} />
            ))}
          </div>
        </Card>

        {/* Task sections */}
        <Card style={{ marginBottom: 16 }}>
          {SECTIONS.map(sec => {
            const items = tasks[sec.key];
            const secDone = items.filter(t => checks[t.id]).length;
            return (
              <div key={sec.key}>
                <SectionHead icon={sec.icon} label={sec.label} done={secDone} total={items.length} sKey={sec.key} />
                {openSec[sec.key] && (
                  <div style={{ animation: "fadeIn .3s ease" }}>
                    {items.map(t => (
                      <CheckItem key={t.id} checked={checks[t.id]} label={t.label} sub={t.sub} onToggle={() => toggle(t.id)} />
                    ))}
                    {sec.key === "mind" && (
                      <textarea value={noteText} onChange={e => setNoteText(e.target.value)}
                        placeholder="Ghi chú hôm nay..."
                        style={{
                          width: "100%", minHeight: 48, padding: "10px 0", background: "none",
                          border: "none", borderBottom: `1px solid ${T.border}`, color: T.text,
                          fontSize: 14, resize: "none", fontFamily: "inherit",
                        }} />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </Card>

        {/* Bottom bar */}
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <div style={{
            flex: 1, background: pct === 100 ? T.accent : T.border,
            borderRadius: T.radiusSm, padding: "14px 16px",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6
          }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: pct === 100 ? T.accentDark : T.sub }}>{pct}%</span>
            <span style={{ fontSize: 11, color: pct === 100 ? T.accentDark : T.sub }}>hoàn thành</span>
          </div>
          <button onClick={() => { setChecks({}); setFeeling(0); setNoteText(""); }} style={{
            padding: "14px 18px", background: T.card, border: `1px solid ${T.border}`,
            borderRadius: T.radiusSm, cursor: "pointer", fontSize: 12, color: T.sub, fontWeight: 600,
            fontFamily: "inherit",
          }}>Ngày mới</button>
        </div>
      </div>
    );
  };

  // ============ WEEK ============

  const WeekView = () => {
    const wDone = WEEK.filter(w => weekDone[w.day]).length;
    return (
      <div style={{ animation: "slideUp .5s cubic-bezier(.4,0,.2,1)" }}>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 15, color: T.sub }}>Lịch trình</div>
          <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: -1, color: T.text }}>Tuần này</div>
        </div>

        {/* Week pill bar */}
        <Card dark style={{ marginBottom: 16, padding: 12, display: "flex", gap: 4 }}>
          {WEEK.map(w => {
            const isToday = w.day === DAYS[dow];
            const done = weekDone[w.day];
            return (
              <button key={w.day} onClick={() => setWeekDone(p => ({ ...p, [w.day]: !p[w.day] }))} style={{
                flex: 1, padding: "10px 0", borderRadius: 12, border: "none", cursor: "pointer",
                background: done ? T.accent : (isToday ? "#333" : "transparent"),
                display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                transition: "all .2s cubic-bezier(.4,0,.2,1)",
              }}>
                <span style={{ fontSize: 9, fontWeight: 600, color: done ? T.accentDark : (isToday ? "#fff" : "#666"), letterSpacing: 0.5 }}>{w.day}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: done ? T.accentDark : (isToday ? T.accent : "#555") }}>{w.type === "s" ? "◆" : w.type === "c" ? "○" : w.type === "f" ? "◇" : "—"}</span>
              </button>
            );
          })}
        </Card>

        {/* Progress */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <Card style={{ flex: 1, textAlign: "center", padding: 16 }}>
            <div style={{ fontSize: 32, fontWeight: 800, color: T.text }}>{wDone}</div>
            <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>ngày xong</div>
          </Card>
          <Card style={{ flex: 1, textAlign: "center", padding: 16 }}>
            <div style={{ fontSize: 32, fontWeight: 800, color: 7 - wDone > 0 ? T.text : T.green }}>{7 - wDone}</div>
            <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>còn lại</div>
          </Card>
        </div>

        {/* Daily detail list */}
        <Card style={{ marginBottom: 16 }}>
          {WEEK.map((w, i) => {
            const detail = TRAINING[DAYS.indexOf(w.day)];
            const isToday = w.day === DAYS[dow];
            const isOpen = expandDay === i;
            return (
              <div key={w.day}>
                <button onClick={() => setExpandDay(isOpen ? null : i)} style={{
                  display: "flex", alignItems: "center", gap: 14, padding: "14px 0",
                  width: "100%", background: "none", border: "none", cursor: "pointer",
                  borderBottom: `1px solid ${T.border}`,
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 36, flexShrink: 0,
                    background: weekDone[w.day] ? T.green : (isToday ? T.dark : T.border),
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all .2s",
                  }}>
                    {weekDone[w.day]
                      ? <svg width="14" height="12" viewBox="0 0 14 12" fill="none"><path d="M1 6L5 10L13 1" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></svg>
                      : <span style={{ fontSize: 11, fontWeight: 700, color: isToday ? "#fff" : T.sub }}>{w.day}</span>
                    }
                  </div>
                  <div style={{ flex: 1, textAlign: "left" }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: isToday ? T.text : T.sub, letterSpacing: -0.3 }}>{detail.label}</div>
                    <div style={{ fontSize: 12, color: T.muted }}>{detail.desc}</div>
                  </div>
                  {isToday && <div style={{ width: 8, height: 8, borderRadius: 4, background: T.accent }} />}
                </button>
                {isOpen && (
                  <div style={{ padding: "10px 0 10px 50px", animation: "fadeIn .2s ease" }}>
                    <div style={{ fontSize: 12, color: T.sub, lineHeight: 1.6 }}>
                      ⏱ {detail.time}<br/>
                      💡 Bận? {detail.type === "strength" ? "20p bodyweight ở nhà" : detail.type === "cardio" ? "15p sau ăn trưa + tối" : "Nghỉ cũng tốt"}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </Card>

        {/* MVW */}
        <Card style={{ background: T.bg, border: `1px solid ${T.border}`, boxShadow: "none", marginBottom: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 10 }}>Minimum Viable Week</div>
          <div style={{ fontSize: 13, color: T.sub, lineHeight: 1.8 }}>
            <b style={{ color: T.text }}>Bận?</b> Bodyweight 20p × 2 + Walk sau ăn<br/>
            <b style={{ color: T.text }}>Ốm?</b> Đi bộ nhẹ. Không tập nặng.<br/>
            <b style={{ color: T.text }}>Công tác?</b> Push-up + Squat phòng KS
          </div>
        </Card>

        <button onClick={() => { setWeekDone({}); setExpandDay(null); }} style={{
          width: "100%", padding: 14, background: T.card, border: `1px solid ${T.border}`,
          borderRadius: T.radiusSm, cursor: "pointer", fontSize: 12, color: T.sub,
          fontWeight: 600, fontFamily: "inherit", marginBottom: 8,
        }}>Tuần mới</button>
      </div>
    );
  };

  // ============ STATS ============

  const StatsView = () => {
    const dim = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const fd = new Date(now.getFullYear(), now.getMonth(), 1).getDay();
    const cal = [];
    for (let i = 0; i < fd; i++) cal.push(null);
    for (let i = 1; i <= dim; i++) cal.push(i);

    const secStats = SECTIONS.map(s => {
      const items = tasks[s.key];
      return { ...s, done: items.filter(t => checks[t.id]).length, total: items.length };
    });

    return (
      <div style={{ animation: "slideUp .5s cubic-bezier(.4,0,.2,1)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 15, color: T.sub }}>Thống kê</div>
            <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: -1, color: T.text }}>{MONTHS[now.getMonth()]}</div>
          </div>
          <div style={{ fontSize: 13, color: T.muted }}>{now.getFullYear()}</div>
        </div>

        {/* Calendar */}
        <Card style={{ marginBottom: 16, padding: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
            {DAYS.map(d => (
              <div key={d} style={{ textAlign: "center", fontSize: 10, fontWeight: 600, color: T.muted, padding: 4 }}>{d}</div>
            ))}
            {cal.map((d, i) => (
              <div key={i} style={{
                textAlign: "center", padding: "7px 0", borderRadius: 10,
                fontSize: 13, fontWeight: d === now.getDate() ? 700 : 400,
                color: d === now.getDate() ? "#fff" : (d ? T.text : "transparent"),
                background: d === now.getDate() ? T.dark : "transparent",
              }}>{d || "·"}</div>
            ))}
          </div>
        </Card>

        {/* Ring */}
        <Card dark style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 20, padding: 20 }}>
          <ProgressRing size={90} stroke={5} pct={pct}>
            <span style={{ fontSize: 28, fontWeight: 800, color: "#fff" }}>{pct}</span>
            <span style={{ fontSize: 9, color: "#666" }}>%</span>
          </ProgressRing>
          <div>
            <div style={{ fontSize: 13, color: "#888", marginBottom: 8 }}>Hôm nay</div>
            {secStats.map(s => (
              <div key={s.key} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <div style={{ width: 16, height: 3, borderRadius: 2, background: s.done === s.total && s.total > 0 ? T.accent : "#333" }} />
                <span style={{ fontSize: 11, color: s.done === s.total && s.total > 0 ? T.accent : "#666" }}>{s.label} {s.done}/{s.total}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Feeling display */}
        {feeling > 0 && (
          <Card style={{ marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 13, color: T.sub }}>Năng lượng hôm nay</span>
            <span style={{ fontSize: 32, fontWeight: 800, color: feeling >= 7 ? T.green : feeling >= 4 ? T.text : T.red }}>{feeling}<span style={{ fontSize: 14, color: T.muted }}>/10</span></span>
          </Card>
        )}

        {/* Category cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
          {secStats.map(s => {
            const sp = s.total > 0 ? Math.round((s.done / s.total) * 100) : 0;
            return (
              <Card key={s.key} style={{ padding: 14 }}>
                <div style={{ fontSize: 11, color: T.sub, fontWeight: 600, marginBottom: 10 }}>{s.icon} {s.label}</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: sp === 100 ? T.green : T.text }}>{sp}%</div>
                <div style={{ height: 3, background: T.border, borderRadius: 2, marginTop: 8 }}>
                  <div style={{ height: 3, background: sp === 100 ? T.green : T.dark, borderRadius: 2, width: `${sp}%`, transition: "width .5s" }} />
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    );
  };

  // ============ SYSTEM ============

  const SystemView = () => (
    <div style={{ animation: "slideUp .5s cubic-bezier(.4,0,.2,1)" }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 15, color: T.sub }}>Hệ thống</div>
        <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: -1, color: T.text }}>Layer {layer}</div>
      </div>

      {/* Layer selector */}
      <Card dark style={{ marginBottom: 16, padding: 12 }}>
        <div style={{ display: "flex", gap: 6 }}>
          {LAYERS.map(l => (
            <button key={l.id} onClick={() => setLayer(l.id)} style={{
              flex: 1, padding: "12px 8px", borderRadius: 12, border: "none", cursor: "pointer",
              background: layer === l.id ? T.accent : "#333",
              transition: "all .2s",
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: layer === l.id ? T.accentDark : "#888" }}>Layer {l.id}</div>
              <div style={{ fontSize: 10, color: layer === l.id ? T.accentDark : "#666", marginTop: 2 }}>{l.name}</div>
            </button>
          ))}
        </div>
      </Card>

      {/* Active layer detail */}
      {LAYERS.filter(l => l.id === layer).map(l => (
        <Card key={l.id} style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: T.text }}>{l.name}</div>
              <div style={{ fontSize: 12, color: T.sub }}>{l.period}</div>
            </div>
            <span style={{ fontSize: 9, padding: "3px 10px", background: T.accent, color: T.accentDark, borderRadius: 8, fontWeight: 700 }}>ACTIVE</span>
          </div>
          {l.focus.map((f, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "10px 0",
              borderBottom: i < l.focus.length - 1 ? `1px solid ${T.border}` : "none",
            }}>
              <div style={{ width: 6, height: 6, borderRadius: 3, background: T.dark }} />
              <span style={{ fontSize: 14, color: T.text, fontWeight: 500 }}>{f}</span>
            </div>
          ))}
        </Card>
      ))}

      {/* Biomarkers */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.sub, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 10, padding: "0 2px" }}>7 Chỉ số cốt lõi</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {BIOMARKERS.map(b => (
            <Card key={b.name} style={{ padding: 14 }}>
              <div style={{ fontSize: 11, color: T.sub, fontWeight: 600, marginBottom: 6 }}>{b.name}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: T.text, letterSpacing: -0.5 }}>{b.target}</div>
              <div style={{ fontSize: 10, color: T.muted, marginTop: 2 }}>{b.unit}{b.unit ? " · " : ""}{b.desc}</div>
            </Card>
          ))}
        </div>
      </div>

      {/* 10 Foods */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.sub, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 10, padding: "0 2px" }}>10 Thực phẩm</div>
        <Card style={{ padding: 14 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {FOODS.map(f => (
              <div key={f.n} style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "6px 10px", background: T.bg, borderRadius: 10,
              }}>
                <span style={{ fontSize: 14 }}>{f.e}</span>
                <div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{f.n}</span>
                  <span style={{ fontSize: 10, color: T.muted, marginLeft: 4 }}>{f.p}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Supplements */}
      <Card style={{ background: T.bg, border: `1px solid ${T.border}`, boxShadow: "none", marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 10 }}>Bổ sung cơ bản</div>
        <div style={{ fontSize: 13, color: T.text, lineHeight: 1.8 }}>
          ☀️ <b>D3 + K2</b> — sáng, với chất béo<br/>
          🐟 <b>Omega-3</b> — cùng bữa ăn<br/>
          🌙 <b>Magnesium</b> — trước ngủ
        </div>
        <div style={{ marginTop: 10, fontSize: 11, color: T.sub, fontStyle: "italic" }}>
          Phần còn lại → xét nghiệm trước, bổ sung sau.
        </div>
      </Card>

      {/* Quote */}
      <div style={{ textAlign: "center", padding: "12px 0 8px" }}>
        <div style={{ fontSize: 13, color: T.muted, fontStyle: "italic", lineHeight: 1.6 }}>
          "Bền bỉ thắng hoàn hảo."
        </div>
      </div>
    </div>
  );

  // ============ TABS & RENDER ============

  const views = { today: TodayView, week: WeekView, stats: StatsView, system: SystemView };
  const tabList = [
    { id: "today", label: "Hôm nay", icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="3" y="3" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><rect x="11" y="3" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><rect x="3" y="11" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><rect x="11" y="11" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/></svg> },
    { id: "week", label: "Tuần", icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="3" y="4" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M3 8H17" stroke="currentColor" strokeWidth="1.5"/><path d="M7 2V5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M13 2V5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg> },
    { id: "stats", label: "Thống kê", icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M4 16V10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M8 16V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M12 16V8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M16 16V4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg> },
    { id: "system", label: "Hệ thống", icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="3" stroke="currentColor" strokeWidth="1.5"/><path d="M10 2V4M10 16V18M2 10H4M16 10H18M4.93 4.93L6.34 6.34M13.66 13.66L15.07 15.07M15.07 4.93L13.66 6.34M6.34 13.66L4.93 15.07" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg> },
  ];
  const View = views[tab];

  return (
    <div style={{
      minHeight: "100vh", background: T.bg,
      fontFamily: "'SF Pro Display', -apple-system, 'Helvetica Neue', sans-serif",
      maxWidth: 430, margin: "0 auto", WebkitFontSmoothing: "antialiased",
    }}>
      <style>{`
        @keyframes slideUp { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }
        @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        button { font-family: inherit; }
        input, textarea { outline: none; font-family: inherit; }
        ::placeholder { color: ${T.muted}; }
        ::-webkit-scrollbar { width: 0; }
      `}</style>

      {/* Top bar */}
      <div style={{
        padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center",
        position: "sticky", top: 0, zIndex: 10, background: `${T.bg}ee`,
        backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
      }}>
        <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: -0.5, color: T.text }}>
          dongbao<span style={{ fontWeight: 400, color: T.muted }}>OS</span>
        </div>
        <div style={{
          display: "flex", alignItems: "center", gap: 4,
          padding: "4px 10px", background: T.card, borderRadius: 10,
          boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
        }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: T.sub }}>L{layer}</span>
          <div style={{ width: 1, height: 12, background: T.border }} />
          <span style={{ fontSize: 10, fontWeight: 700, color: pct === 100 ? T.green : T.text }}>{pct}%</span>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "8px 16px 90px" }}>
        <View />
      </div>

      {/* Bottom nav */}
      <div style={{
        position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
        width: "100%", maxWidth: 430,
        background: `${T.bg}dd`, backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
        borderTop: `1px solid ${T.border}`,
        padding: "6px 8px 10px", display: "flex", justifyContent: "space-around", zIndex: 10,
      }}>
        {tabList.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            background: "none", border: "none", cursor: "pointer", padding: "4px 12px",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
            color: tab === t.id ? T.text : T.muted, transition: "color .2s",
          }}>
            <div style={{ opacity: tab === t.id ? 1 : 0.4, transition: "opacity .2s" }}>{t.icon}</div>
            <span style={{ fontSize: 9, fontWeight: tab === t.id ? 700 : 500, letterSpacing: 0.3 }}>{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
