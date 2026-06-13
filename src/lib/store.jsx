/* ============================================================
   NANAMOUREUX — Store (contexte React branché sur Supabase)
   ============================================================ */
import { createContext, useContext, useEffect, useMemo, useRef, useState, useCallback } from "react";
import { supabase, supabaseConfigured } from "../supabaseClient";
import { useAuth } from "../auth/AuthProvider";
import {
  applyAppearance, uid, todayISO, localISO, partnerOf,
  DEFAULT_DEFI_TODAY, DEFAULT_PERSON,
  addHoursToTime, diffHours, isEventOnDate,
} from "./themes";

const THEME_KEY = "nanamoureux_theme";
const PREFS_KEY = "nanamoureux_prefs";
const ME_OVERRIDE_KEY = "nanamoureux_me_override";
const DEFAULT_PREFS = { bg: "creme", customBg: "#f3e9f7" };

function readLocal(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function writeLocal(key, value) {
  try {
    if (value === null || value === undefined) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* noop */
  }
}

export const whoToBy = (who) => (who === "her" ? "p2" : "p1");
export const byToWho = (by) => (by === "p2" ? "her" : "him");

const NanaContext = createContext(null);

export function NanaProvider({ children }) {
  const { user } = useAuth();

  /* ---------------- préférences locales (par appareil) ---------------- */
  const [theme, setThemeState] = useState(() => readLocal(THEME_KEY, "light"));
  const [prefs, setPrefsState] = useState(() => readLocal(PREFS_KEY, DEFAULT_PREFS));
  const [meOverride, setMeOverrideState] = useState(() => readLocal(ME_OVERRIDE_KEY, null));

  useEffect(() => { applyAppearance({ theme, prefs }); }, [theme, prefs]);

  const setTheme = useCallback((t) => {
    setThemeState(t);
    writeLocal(THEME_KEY, t);
  }, []);
  const setPrefs = useCallback((patch) => {
    setPrefsState((p) => {
      const next = typeof patch === "function" ? patch(p) : { ...p, ...patch };
      writeLocal(PREFS_KEY, next);
      return next;
    });
  }, []);

  /* ---------------- données Supabase ---------------- */
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [coupleSettings, setCoupleSettings] = useState(null);
  const [courses, setCourses] = useState([]);
  const [agendaRaw, setAgendaRaw] = useState([]);
  const [idees, setIdees] = useState([]);
  const [budgetParams, setBudgetParams] = useState(null);
  const [budgetDepenses, setBudgetDepenses] = useState([]);
  const [coupleMessages, setCoupleMessages] = useState([]);
  const [petitsMots, setPetitsMots] = useState([]);
  const [defis, setDefis] = useState([]);

  /* ---------------- p1/p2 <-> him/her ---------------- */
  const p1Id = members[0]?.user_id || null;
  const p2Id = members[1]?.user_id || null;

  const myAutoPos = user && p1Id === user.id ? "p1" : user && p2Id === user.id ? "p2" : null;
  const mePos = meOverride || myAutoPos || "p1";
  const me = mePos === "p1" ? "him" : "her";

  const setMe = useCallback((who) => {
    const pos = who === "her" ? "p2" : "p1";
    const next = pos === myAutoPos ? null : pos;
    writeLocal(ME_OVERRIDE_KEY, next);
    setMeOverrideState(next);
  }, [myAutoPos]);

  /* ---------------- fetchers ---------------- */
  const fetchMembers = useCallback(async () => {
    const { data } = await supabase.from("app_members").select("user_id, created_at").order("created_at", { ascending: true });
    if (data) setMembers(data);
    return data || [];
  }, []);
  const fetchProfiles = useCallback(async (ids) => {
    if (!ids || !ids.length) return;
    const { data } = await supabase.from("profiles").select("*").in("id", ids);
    if (data) {
      const map = {};
      data.forEach((p) => { map[p.id] = p; });
      setProfiles(map);
    }
  }, []);
  const fetchCoupleSettings = useCallback(async () => {
    const { data } = await supabase.from("couple_settings").select("*").eq("id", 1).maybeSingle();
    if (data) setCoupleSettings(data);
  }, []);
  const fetchCourses = useCallback(async () => {
    const { data } = await supabase.from("courses").select("*").order("created_at", { ascending: false });
    if (data) setCourses(data);
  }, []);
  const fetchAgenda = useCallback(async () => {
    const { data } = await supabase.from("calendrier_evenements").select("*");
    if (data) setAgendaRaw(data);
  }, []);
  const fetchIdees = useCallback(async () => {
    const { data } = await supabase.from("idees_dates").select("*").order("created_at", { ascending: false });
    if (data) setIdees(data);
  }, []);
  const fetchBudgetParams = useCallback(async () => {
    const { data } = await supabase.from("budget_params").select("*").limit(1).maybeSingle();
    if (data) setBudgetParams(data);
  }, []);
  const fetchBudgetDepenses = useCallback(async () => {
    const { data } = await supabase.from("budget_depenses").select("*").order("created_at", { ascending: false });
    if (data) setBudgetDepenses(data);
  }, []);
  const fetchCoupleMessages = useCallback(async () => {
    const { data } = await supabase.from("couple_messages").select("*").order("created_at", { ascending: true });
    if (data) setCoupleMessages(data);
  }, []);
  const fetchPetitsMots = useCallback(async () => {
    const { data } = await supabase.from("petits_mots").select("*").order("created_at", { ascending: false });
    if (data) setPetitsMots(data);
  }, []);
  const fetchDefis = useCallback(async () => {
    const { data } = await supabase.from("defis").select("*").eq("scope", "day");
    if (data) setDefis(data);
  }, []);

  /* fetchers gardés à jour via ref pour les callbacks realtime */
  const fetchersRef = useRef({});
  useEffect(() => {
    fetchersRef.current = {
      fetchCourses, fetchAgenda, fetchIdees, fetchBudgetParams, fetchBudgetDepenses,
      fetchCoupleMessages, fetchPetitsMots, fetchDefis, fetchCoupleSettings,
      fetchProfiles: () => fetchProfiles([p1Id, p2Id].filter(Boolean)),
    };
  }, [fetchCourses, fetchAgenda, fetchIdees, fetchBudgetParams, fetchBudgetDepenses, fetchCoupleMessages, fetchPetitsMots, fetchDefis, fetchCoupleSettings, fetchProfiles, p1Id, p2Id]);

  /* chargement initial */
  useEffect(() => {
    if (!supabaseConfigured || !user) { setLoading(false); return; }
    let active = true;
    (async () => {
      setLoading(true);
      const membersData = await fetchMembers();
      await Promise.all([
        fetchCoupleSettings(), fetchCourses(), fetchAgenda(), fetchIdees(),
        fetchBudgetParams(), fetchBudgetDepenses(), fetchCoupleMessages(),
        fetchPetitsMots(), fetchDefis(),
      ]);
      const ids = (membersData || []).map((m) => m.user_id);
      if (active) await fetchProfiles(ids);
      if (active) setLoading(false);
    })();
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  /* abonnements realtime */
  useEffect(() => {
    if (!supabaseConfigured || !user) return;
    const tables = [
      "courses", "calendrier_evenements", "idees_dates", "budget_params", "budget_depenses",
      "couple_messages", "petits_mots", "defis", "couple_settings", "profiles", "app_members",
    ];
    const handlers = {
      courses: () => fetchersRef.current.fetchCourses?.(),
      calendrier_evenements: () => fetchersRef.current.fetchAgenda?.(),
      idees_dates: () => fetchersRef.current.fetchIdees?.(),
      budget_params: () => fetchersRef.current.fetchBudgetParams?.(),
      budget_depenses: () => fetchersRef.current.fetchBudgetDepenses?.(),
      couple_messages: () => fetchersRef.current.fetchCoupleMessages?.(),
      petits_mots: () => fetchersRef.current.fetchPetitsMots?.(),
      defis: () => fetchersRef.current.fetchDefis?.(),
      couple_settings: () => fetchersRef.current.fetchCoupleSettings?.(),
      profiles: () => fetchersRef.current.fetchProfiles?.(),
      app_members: async () => { await fetchMembers(); fetchersRef.current.fetchProfiles?.(); },
    };
    const channel = supabase.channel("nanamoureux-realtime");
    tables.forEach((table) => {
      channel.on("postgres_changes", { event: "*", schema: "public", table }, () => handlers[table]?.());
    });
    channel.subscribe();
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  /* ---------------- couple (profils) ---------------- */
  const couple = useMemo(() => {
    const personFrom = (profile, who) => {
      const def = DEFAULT_PERSON[who];
      const opts = (profile && profile.avatar_options) || {};
      return {
        name: (profile && profile.username) || def.name,
        emoji: opts.emoji || def.emoji,
        color: opts.color || def.color,
        email: (profile && profile.email) || null,
      };
    };
    return {
      him: personFrom(profiles[p1Id], "him"),
      her: personFrom(profiles[p2Id], "her"),
      since: coupleSettings?.since || "2021-09-18",
      nickname: coupleSettings?.nickname || "",
      mascot: coupleSettings?.mascot || "blobs",
    };
  }, [profiles, p1Id, p2Id, coupleSettings]);

  /* ---------------- défi du jour ---------------- */
  const defiToday = useMemo(() => {
    const dj = coupleSettings?.defi_jour;
    if (dj && typeof dj === "object" && dj.text) return dj;
    return DEFAULT_DEFI_TODAY;
  }, [coupleSettings]);

  const defiList = useMemo(() => ({
    him: defis.filter((d) => d.assigned_to === "p1").map((d) => ({ id: d.id, text: d.title, done: !!d.completed })),
    her: defis.filter((d) => d.assigned_to === "p2").map((d) => ({ id: d.id, text: d.title, done: !!d.completed })),
  }), [defis]);

  /* ---------------- courses ---------------- */
  const courseList = useMemo(() => courses.map((c) => ({
    id: c.id, text: c.text, cat: c.category, by: byToWho(c.by), done: !!c.completed,
  })), [courses]);

  /* ---------------- agenda (occurrences) ---------------- */
  const agenda = useMemo(() => {
    const out = [];
    const today = new Date();
    const rangeStart = new Date(today); rangeStart.setDate(rangeStart.getDate() - 60);
    const rangeEnd = new Date(today); rangeEnd.setDate(rangeEnd.getDate() + 400);
    for (const e of agendaRaw) {
      const start = e.time || "00:00";
      const end = addHoursToTime(start, e.duration ?? 1);
      const base = { title: e.title, start, end, by: byToWho(e.by) };
      if (!e.recurrence || e.recurrence === "none") {
        out.push({ ...base, id: `${e.id}::${e.date}`, date: e.date });
        continue;
      }
      for (let d = new Date(rangeStart); d <= rangeEnd; d.setDate(d.getDate() + 1)) {
        const ds = localISO(d);
        if (isEventOnDate(e, ds)) out.push({ ...base, id: `${e.id}::${ds}`, date: ds });
      }
    }
    return out;
  }, [agendaRaw]);

  /* ---------------- idées dates ---------------- */
  const ideeList = useMemo(() => idees.map((i) => ({
    id: i.id, title: i.title, cat: i.mood, lieu: i.place || "", note: i.notes || "", done: !!i.completed,
  })), [idees]);

  /* ---------------- budget ---------------- */
  const budget = useMemo(() => {
    const spent = budgetDepenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    return {
      total: Number(budgetParams?.enveloppe || 0),
      spent,
      incomeHim: Number(budgetParams?.revenu_p1 || 0),
      incomeHer: Number(budgetParams?.revenu_p2 || 0),
      expenses: budgetDepenses.map((e) => ({ id: e.id, label: e.label, amount: Number(e.amount), by: byToWho(e.by), at: e.created_at ? new Date(e.created_at).getTime() : Date.now() })),
    };
  }, [budgetParams, budgetDepenses]);

  /* ---------------- messages (Nous) ---------------- */
  const messages = useMemo(() => coupleMessages.map((m) => ({
    id: m.id, text: m.content, by: byToWho(m.sender), at: m.created_at ? new Date(m.created_at).getTime() : Date.now(),
  })), [coupleMessages]);

  /* ---------------- poésie (petits mots) ---------------- */
  const poesie = useMemo(() => {
    const himEmail = (couple.him.email || "").toLowerCase();
    return petitsMots.map((n) => {
      const senderEmail = (n.sender_email || "").toLowerCase();
      const by = senderEmail && himEmail && senderEmail === himEmail ? "him" : "her";
      return {
        id: n.id, text: n.content, by, scope: n.recipient_email ? "love" : "shared",
        widget: !!n.widget, at: n.created_at ? new Date(n.created_at).getTime() : Date.now(),
      };
    });
  }, [petitsMots, couple.him.email]);

  /* ============================================================
     ACTIONS
     ============================================================ */

  /* --- courses --- */
  const addCourse = useCallback(async (text, cat) => {
    await supabase.from("courses").insert([{ text, category: cat, by: whoToBy(me), completed: false }]);
    await fetchCourses();
  }, [me, fetchCourses]);
  const toggleCourse = useCallback(async (item) => {
    await supabase.from("courses").update({ completed: !item.done }).eq("id", item.id);
    await fetchCourses();
  }, [fetchCourses]);
  const editCourse = useCallback(async (id, text) => {
    await supabase.from("courses").update({ text }).eq("id", id);
    await fetchCourses();
  }, [fetchCourses]);
  const delCourse = useCallback(async (id) => {
    await supabase.from("courses").delete().eq("id", id);
    await fetchCourses();
  }, [fetchCourses]);

  /* --- agenda --- */
  const saveEvent = useCallback(async (ev) => {
    const by = whoToBy(ev.by);
    const duration = diffHours(ev.start, ev.end);
    if (ev.id) {
      const [baseId] = String(ev.id).split("::");
      const raw = agendaRaw.find((e) => String(e.id) === String(baseId));
      const patch = { title: ev.title, time: ev.start, duration, by };
      if (!raw || !raw.recurrence || raw.recurrence === "none") patch.date = ev.date;
      await supabase.from("calendrier_evenements").update(patch).eq("id", baseId);
    } else {
      await supabase.from("calendrier_evenements").insert([{ title: ev.title, date: ev.date, time: ev.start, duration, by, recurrence: "none", exceptions: [] }]);
    }
    await fetchAgenda();
  }, [agendaRaw, fetchAgenda]);
  const delEvent = useCallback(async (occId) => {
    const [baseId, occDate] = String(occId).split("::");
    const raw = agendaRaw.find((e) => String(e.id) === String(baseId));
    if (!raw) return;
    if (!raw.recurrence || raw.recurrence === "none") {
      await supabase.from("calendrier_evenements").delete().eq("id", baseId);
    } else {
      const exceptions = Array.isArray(raw.exceptions) ? raw.exceptions.slice() : [];
      if (!exceptions.includes(occDate)) exceptions.push(occDate);
      await supabase.from("calendrier_evenements").update({ exceptions }).eq("id", baseId);
    }
    await fetchAgenda();
  }, [agendaRaw, fetchAgenda]);

  /* --- idées dates --- */
  const addIdea = useCallback(async (f) => {
    await supabase.from("idees_dates").insert([{ title: f.title, mood: f.cat, place: f.lieu || null, notes: f.note || null, completed: false }]);
    await fetchIdees();
  }, [fetchIdees]);
  const toggleIdea = useCallback(async (idea) => {
    await supabase.from("idees_dates").update({ completed: !idea.done }).eq("id", idea.id);
    await fetchIdees();
  }, [fetchIdees]);
  const delIdea = useCallback(async (id) => {
    await supabase.from("idees_dates").delete().eq("id", id);
    await fetchIdees();
  }, [fetchIdees]);

  /* --- budget --- */
  const setBudgetTotal = useCallback(async (total) => {
    if (!budgetParams?.id) return;
    await supabase.from("budget_params").update({ enveloppe: total }).eq("id", budgetParams.id);
    await fetchBudgetParams();
  }, [budgetParams, fetchBudgetParams]);
  const setIncome = useCallback(async (who, amount) => {
    if (!budgetParams?.id) return;
    const col = who === "him" ? "revenu_p1" : "revenu_p2";
    await supabase.from("budget_params").update({ [col]: amount }).eq("id", budgetParams.id);
    await fetchBudgetParams();
  }, [budgetParams, fetchBudgetParams]);
  const addExpense = useCallback(async (label, amount, by) => {
    await supabase.from("budget_depenses").insert([{ label, amount, by: whoToBy(by || me) }]);
    await fetchBudgetDepenses();
  }, [me, fetchBudgetDepenses]);
  const delExpense = useCallback(async (id) => {
    await supabase.from("budget_depenses").delete().eq("id", id);
    await fetchBudgetDepenses();
  }, [fetchBudgetDepenses]);

  /* --- messages (Nous) --- */
  const sendMessage = useCallback(async (text) => {
    await supabase.from("couple_messages").insert([{ content: text, sender: whoToBy(me) }]);
    await fetchCoupleMessages();
  }, [me, fetchCoupleMessages]);

  /* --- poésie --- */
  const pinNoteToWidget = useCallback(async (note) => {
    const senderEmail = (user?.email || "").toLowerCase();
    const partnerEmail = (me === "him" ? couple.her.email : couple.him.email || "").toLowerCase();
    if (!partnerEmail) return;
    await supabase.from("poesie_widget_messages").upsert(
      { recipient_email: partnerEmail, content: note.text, sender_email: senderEmail },
      { onConflict: "recipient_email" }
    );
  }, [user, me, couple]);
  const addNote = useCallback(async ({ text, scope, widget }) => {
    const senderEmail = user?.email || null;
    const recipientEmail = scope === "love" ? (me === "him" ? couple.her.email : couple.him.email) : null;
    const { data } = await supabase.from("petits_mots")
      .insert([{ content: text, sender_email: senderEmail, recipient_email: recipientEmail, widget: !!widget }])
      .select();
    await fetchPetitsMots();
    if (widget && data?.[0]) await pinNoteToWidget({ text });
  }, [user, me, couple, fetchPetitsMots, pinNoteToWidget]);
  const editNote = useCallback(async (id, text) => {
    await supabase.from("petits_mots").update({ content: text }).eq("id", id);
    await fetchPetitsMots();
  }, [fetchPetitsMots]);
  const delNote = useCallback(async (id) => {
    await supabase.from("petits_mots").delete().eq("id", id);
    await fetchPetitsMots();
  }, [fetchPetitsMots]);
  const togglePin = useCallback(async (note) => {
    if (note.widget) {
      await supabase.from("petits_mots").update({ widget: false }).eq("id", note.id);
    } else {
      await supabase.from("petits_mots").update({ widget: false }).neq("id", note.id);
      await supabase.from("petits_mots").update({ widget: true }).eq("id", note.id);
      await pinNoteToWidget(note);
    }
    await fetchPetitsMots();
  }, [fetchPetitsMots, pinNoteToWidget]);

  /* --- défi du jour --- */
  const upsertCoupleSettings = useCallback(async (patch) => {
    await supabase.from("couple_settings").upsert({ id: 1, ...patch }, { onConflict: "id" });
    await fetchCoupleSettings();
  }, [fetchCoupleSettings]);
  const toggleDefiToday = useCallback(async () => {
    await upsertCoupleSettings({ defi_jour: { ...defiToday, done: !defiToday.done } });
  }, [defiToday, upsertCoupleSettings]);
  const setDefiToday = useCallback(async (suggestion) => {
    await upsertCoupleSettings({ defi_jour: { ...suggestion, done: false } });
  }, [upsertCoupleSettings]);
  const addDefiItem = useCallback(async (who, text) => {
    await supabase.from("defis").insert([{
      title: text, assigned_to: whoToBy(who), created_by: whoToBy(me), scope: "day", target_date: todayISO(), completed: false,
    }]);
    await fetchDefis();
  }, [me, fetchDefis]);
  const toggleDefiItem = useCallback(async (item) => {
    await supabase.from("defis").update({ completed: !item.done, completed_at: !item.done ? new Date().toISOString() : null }).eq("id", item.id);
    await fetchDefis();
  }, [fetchDefis]);
  const delDefiItem = useCallback(async (id) => {
    await supabase.from("defis").delete().eq("id", id);
    await fetchDefis();
  }, [fetchDefis]);

  /* --- réglages couple --- */
  const updateCoupleSettings = useCallback(async (patch) => {
    await upsertCoupleSettings(patch);
  }, [upsertCoupleSettings]);
  const updatePerson = useCallback(async (who, patch) => {
    const targetId = who === "him" ? p1Id : p2Id;
    if (!targetId) return;
    const current = profiles[targetId] || {};
    const avatar_options = { ...(current.avatar_options || {}) };
    if (patch.emoji !== undefined) avatar_options.emoji = patch.emoji;
    if (patch.color !== undefined) avatar_options.color = patch.color;
    const row = { id: targetId, avatar_options };
    if (patch.name !== undefined) row.username = patch.name;
    await supabase.from("profiles").upsert(row, { onConflict: "id" });
    await fetchProfiles([p1Id, p2Id].filter(Boolean));
  }, [p1Id, p2Id, profiles, fetchProfiles]);

  const value = {
    loading,
    ready: supabaseConfigured && !!user,
    theme, setTheme,
    prefs, setPrefs,
    me, setMe, mePos, myAutoPos,
    couple, updateCoupleSettings, updatePerson,
    defi: { today: defiToday, list: defiList },
    toggleDefiToday, setDefiToday, addDefiItem, toggleDefiItem, delDefiItem,
    courses: courseList, addCourse, toggleCourse, editCourse, delCourse,
    agenda, saveEvent, delEvent,
    idees: ideeList, addIdea, toggleIdea, delIdea,
    budget, setBudgetTotal, setIncome, addExpense, delExpense,
    messages, sendMessage,
    poesie, addNote, editNote, delNote, togglePin,
  };

  return <NanaContext.Provider value={value}>{children}</NanaContext.Provider>;
}

export function useNana() {
  const ctx = useContext(NanaContext);
  if (!ctx) throw new Error("useNana doit être utilisé dans <NanaProvider>");
  return ctx;
}

export { uid, partnerOf, todayISO, localISO };
