// Shared design tokens & data for dongbaoOS
// All inline-styled to match the original demo aesthetic

export const T = {
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
  orange: "#FF9500",
  shadow: "0 2px 16px rgba(0,0,0,0.06)",
  shadowLg: "0 8px 32px rgba(0,0,0,0.10)",
  radius: 18,
  radiusSm: 12,
} as const;

export const DAYS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
export const MONTHS = ["Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"];

const TRAINING: Record<number, { label: string; desc: string; type: string; time: string }> = {
  1: { label: "Strength A", desc: "Squat · Push-up · Row", type: "strength", time: "45–60p" },
  2: { label: "Đi bộ Zone 2", desc: "Nhẹ nhàng · nói chuyện được", type: "cardio", time: "30–45p" },
  3: { label: "Strength B", desc: "Hinge · Pull-up · Lunge", type: "strength", time: "45–60p" },
  4: { label: "Đi bộ + Mobility", desc: "Đi bộ 30p · Giãn cơ 10p", type: "cardio", time: "30–45p" },
  5: { label: "Strength C", desc: "Full body hoặc nghỉ", type: "strength", time: "45–60p" },
  6: { label: "Tự do", desc: "Bơi · Leo núi · Thể thao", type: "free", time: "Tự do" },
  0: { label: "Phục hồi", desc: "Nghỉ ngơi · Meal prep", type: "rest", time: "—" },
};

export { TRAINING };

export const buildTasks = (dow: number) => ({
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

export const SECTIONS = [
  { key: "training" as const, label: "Luyện Tập", icon: "●" },
  { key: "nutrition" as const, label: "Dinh Dưỡng", icon: "◐" },
  { key: "mind" as const, label: "Tư Duy", icon: "◆" },
  { key: "sleep" as const, label: "Giấc Ngủ", icon: "◑" },
];

export const WEEK = [
  { day: "T2", label: "Strength A", type: "s" },
  { day: "T3", label: "Walk", type: "c" },
  { day: "T4", label: "Strength B", type: "s" },
  { day: "T5", label: "Walk+", type: "c" },
  { day: "T6", label: "Strength C", type: "s" },
  { day: "T7", label: "Free", type: "f" },
  { day: "CN", label: "Rest", type: "r" },
];

export const BIOMARKERS = [
  { name: "ApoB", target: "< 60", unit: "mg/dL", desc: "Xơ vữa động mạch" },
  { name: "Fasting Insulin", target: "2–5", unit: "µIU/mL", desc: "Kháng insulin" },
  { name: "HbA1c", target: "4.8–5.3", unit: "%", desc: "Đường huyết TB" },
  { name: "hs-CRP", target: "< 0.5", unit: "mg/L", desc: "Viêm âm ỉ" },
  { name: "VO2 Max", target: "Top 25%", unit: "", desc: "Sức bền tim phổi" },
  { name: "Grip", target: "> 50", unit: "kg", desc: "Sức mạnh tổng thể" },
];

export const LAYERS = [
  { id: 1, name: "Nền Móng", period: "6 tháng đầu", focus: ["Tập 3-4x/tuần", "Ngủ 7-8h", "Protein + Rau", "Đi bộ mỗi ngày"] },
  { id: 2, name: "Mở Rộng", period: "Tháng 7–18", focus: ["VO2 Max 4×4", "Sauna 2-3x", "XN Biomarker", "Bổ sung theo data"] },
  { id: 3, name: "Tối Ưu", period: "Sau 18 tháng", focus: ["Cold Plunge", "NSDR", "Dual-tasking", "Geroprotectors"] },
];

export const FOODS = [
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

// Project list with colors (must match API seed)
export const DEFAULT_PROJECTS = [
  { id: "", name: "Nexos", slug: "nexos", color: "#2196F3", description: "Trust infrastructure cho xây dựng" },
  { id: "", name: "OpenArch", slug: "openarch", color: "#4ECDC4", description: "Dev-Team-as-a-Service" },
  { id: "", name: "Blublok", slug: "blublok", color: "#FFD700", description: "FICO cho công nhân xây dựng" },
  { id: "", name: "Yaloka", slug: "yaloka", color: "#FF6B35", description: "Location intelligence" },
  { id: "", name: "Saitrai", slug: "saitrai", color: "#AB47BC", description: "F&B → data moat" },
  { id: "", name: "DongbaoOS", slug: "dongbaoos", color: "#34C759", description: "30-year health OS" },
  { id: "", name: "Cá nhân", slug: "personal", color: "#8E8E93", description: "Cá nhân — đọc, học, family" },
];

// Format seconds to H:M
export function fmtDuration(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

// Format seconds to H:MM:SS for timer display
export function fmtTimer(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}
