/* ============================================================
   NANAMOUREUX — Thèmes, palettes & petits helpers partagés
   ============================================================ */

export const BG_TINTS = {
  creme:  { label: "Crème",  dot: "#e6dcc2", light: { bg: "#fbf6ea", bg2: "#f5eedd" }, dark: { bg: "#181520", bg2: "#201b2b" } },
  peche:  { label: "Pêche",  dot: "#f0d6c2", light: { bg: "#fdf2ec", bg2: "#f8e6da" }, dark: { bg: "#1f1820", bg2: "#281f29" } },
  rose:   { label: "Rosé",   dot: "#eccdd7", light: { bg: "#fceef2", bg2: "#f7e0e8" }, dark: { bg: "#1f1622", bg2: "#291d2d" } },
  menthe: { label: "Menthe", dot: "#cfe2cf", light: { bg: "#eff7ef", bg2: "#e2efe2" }, dark: { bg: "#141d1e", bg2: "#1c2729" } },
  ciel:   { label: "Ciel",   dot: "#cdddee", light: { bg: "#eef4fb", bg2: "#e0ebf6" }, dark: { bg: "#141a24", bg2: "#1c2430" } },
  lilas:  { label: "Lilas",  dot: "#ddd0ec", light: { bg: "#f5eefb", bg2: "#eadef6" }, dark: { bg: "#1a1626", bg2: "#231d33" } },
};

export const PERSON_COLORS = [
  { name: "Cerise", hex: "#e25c54" },
  { name: "Corail", hex: "#ef7a5d" },
  { name: "Ambre",  hex: "#e0a236" },
  { name: "Olive",  hex: "#8a9a4e" },
  { name: "Feuille",hex: "#6fae6e" },
  { name: "Lagon",  hex: "#3bb0a3" },
  { name: "Ciel",   hex: "#5fa8d8" },
  { name: "Indigo", hex: "#6d7ae0" },
  { name: "Prune",  hex: "#a87193" },
  { name: "Rose",   hex: "#e86a92" },
];

export const MASCOTS = [
  { key: "blobs",   label: "Bulles" },
  { key: "foxbear", label: "Ours & Renard",    a: "🐻", b: "🦊" },
  { key: "catfly",  label: "Chat & Papillon",  a: "🐱", b: "🦋" },
  { key: "pengbun", label: "Pingouin & Lapin", a: "🐧", b: "🐰" },
  { key: "sunmoon", label: "Soleil & Lune",    a: "☀️", b: "🌙" },
  { key: "koapanda",label: "Koala & Panda",    a: "🐨", b: "🐼" },
  { key: "duckchick",label: "Canard & Poussin",a: "🦆", b: "🐥" },
  { key: "dogcat",  label: "Chien & Chat",     a: "🐶", b: "🐱" },
];

export const DEFI_SUGGESTIONS = [
  { text: "Un compliment sincère, là maintenant", emoji: "💬" },
  { text: "10 min sans téléphone, juste vous deux", emoji: "📵" },
  { text: "Préparer le café/thé de l'autre", emoji: "☕" },
  { text: "Un câlin de 20 secondes (vraiment)", emoji: "🤗" },
  { text: "Raconter un souvenir qui vous fait rire", emoji: "😂" },
  { text: "Planifier la prochaine date ensemble", emoji: "🗓️" },
  { text: "Dire merci pour un truc du quotidien", emoji: "🙏" },
];

export const DEFAULT_DEFI_TODAY = { text: "Le bien, l'ennemi du mieux", emoji: "🙃", done: false };

export const DEFAULT_PERSON = {
  him: { name: "Ruddy", emoji: "🐻", color: "#e25c54" },
  her: { name: "Claire", emoji: "🦊", color: "#5fa8d8" },
};

/* ---------------- Appearance ---------------- */
export function applyAppearance({ theme, prefs }) {
  const root = document.documentElement;
  ["--him", "--her", "--us-a", "--us-b"].forEach((v) => root.style.removeProperty(v));
  const tint = BG_TINTS[(prefs && prefs.bg) || "creme"] || BG_TINTS.creme;
  const mode = theme === "dark" ? "dark" : "light";
  if ((prefs && prefs.bg) === "custom" && prefs.customBg) {
    const hex = prefs.customBg;
    root.style.setProperty("--bg", hex);
    const mix2 = mode === "dark" ? `color-mix(in srgb, ${hex} 84%, #ffffff)` : `color-mix(in srgb, ${hex} 88%, #6b5a3f)`;
    root.style.setProperty("--bg2", mix2);
    const dot = mode === "dark" ? `color-mix(in srgb, ${hex} 78%, #ffffff)` : `color-mix(in srgb, ${hex} 76%, #000)`;
    root.style.setProperty("--line-ink", dot);
  } else {
    root.style.setProperty("--bg", tint[mode].bg);
    root.style.setProperty("--bg2", tint[mode].bg2);
    if (mode === "light") root.style.setProperty("--line-ink", tint.dot);
    else root.style.removeProperty("--line-ink");
  }
  root.dataset.theme = theme || "light";
}

/* ---------------- Helpers ---------------- */
export const uid = () => Math.random().toString(36).slice(2, 9);

export function partnerOf(who) {
  return who === "him" ? "her" : "him";
}

export const localISO = (d = new Date()) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
};
export const todayISO = () => localISO();

export function daysSince(iso) {
  const then = new Date(iso);
  const now = new Date();
  return Math.floor((now - then) / 86400000);
}

export function prettyDuration(iso) {
  const start = new Date(iso);
  const now = new Date();
  let years = now.getFullYear() - start.getFullYear();
  let months = now.getMonth() - start.getMonth();
  let days = now.getDate() - start.getDate();
  if (days < 0) {
    months--;
    const pm = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
    days += pm;
  }
  if (months < 0) {
    years--;
    months += 12;
  }
  return { years, months, days, totalDays: daysSince(iso) };
}

/* ---------------- Agenda recurrence ---------------- */
export function isEventOnDate(event, checkDateStr) {
  if (Array.isArray(event?.exceptions) && event.exceptions.includes(checkDateStr)) return false;
  if (!event.recurrence || event.recurrence === "none") return event.date === checkDateStr;
  const evDate = new Date(event.date);
  const ckDate = new Date(checkDateStr);
  evDate.setHours(0, 0, 0, 0);
  ckDate.setHours(0, 0, 0, 0);
  if (ckDate < evDate) return false;
  if (event.recurrence === "daily") return true;
  if (event.recurrence === "weekly") return evDate.getDay() === ckDate.getDay();
  if (event.recurrence === "monthly") return evDate.getDate() === ckDate.getDate();
  if (event.recurrence === "yearly") return evDate.getDate() === ckDate.getDate() && evDate.getMonth() === ckDate.getMonth();
  return event.date === checkDateStr;
}

/* "HH:MM" + heures (peut être fractionnaire) -> "HH:MM" */
export function addHoursToTime(time, hours) {
  const [h, m] = String(time || "00:00").split(":").map(Number);
  let total = (h * 60 + m) + Math.round((hours || 0) * 60);
  total = ((total % 1440) + 1440) % 1440;
  const hh = Math.floor(total / 60);
  const mm = total % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

/* différence "HH:MM" -> "HH:MM" en heures (>= 0.25) */
export function diffHours(start, end) {
  const [sh, sm] = String(start || "00:00").split(":").map(Number);
  const [eh, em] = String(end || "00:00").split(":").map(Number);
  let diff = (eh * 60 + em) - (sh * 60 + sm);
  if (diff <= 0) diff += 1440;
  return Math.max(0.25, diff / 60);
}
