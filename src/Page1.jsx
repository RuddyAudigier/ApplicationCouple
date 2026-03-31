import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { supabase, supabaseConfigured, supabaseConfigError } from "./supabaseClient";
import "./Page1.css";

const PEOPLE = [
  { id: "p1", label: "P1", subtitle: "Amoureux 1", accent: "#ffb5a7" },
  { id: "p2", label: "P2", subtitle: "Amoureux 2", accent: "#a3e4d7" },
];

// Tu peux modifier cette liste plus tard (ou la remplacer par une table Supabase)
const CATEGORIES = [
  "Attention",
  "Maison",
  "Bien-être",
  "Communication",
  "Surprise",
  "Autre",
];

function pad2(n) {
  return String(n).padStart(2, "0");
}

function getLocalYmd(d = new Date()) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function getWeekStartYmd(d = new Date()) {
  // Monday as week start
  const date = new Date(d);
  const day = date.getDay(); // 0=Sun
  const diff = (day === 0 ? -6 : 1) - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return getLocalYmd(date);
}

function formatFrDate(ymd) {
  try {
    const d = new Date(`${ymd}T00:00:00`);
    return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  } catch {
    return ymd;
  }
}

export default function Page1() {
  const [scope, setScope] = useState("day"); // 'day' | 'week'
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formAssignedTo, setFormAssignedTo] = useState("p2");
  const [formCreatedBy, setFormCreatedBy] = useState("p1");
  const [formTitle, setFormTitle] = useState("");
  const [formNote, setFormNote] = useState("");
  const [formCategory, setFormCategory] = useState(CATEGORIES[0]);
  const [formCategoryCustom, setFormCategoryCustom] = useState("");
  const [formTargetDate, setFormTargetDate] = useState(getLocalYmd());

  const todayYmd = useMemo(() => getLocalYmd(), []);
  const weekStartYmd = useMemo(() => getWeekStartYmd(), []);

  const scopeLabel = scope === "day" ? "Défi du jour" : "Défis de la semaine";
  const scopeHint = scope === "day" ? formatFrDate(todayYmd) : `Semaine du ${formatFrDate(weekStartYmd)}`;

  const openAddModalFor = (assignedTo) => {
    setEditingId(null);
    setFormAssignedTo(assignedTo);
    setFormCreatedBy(assignedTo === "p1" ? "p2" : "p1");
    setFormTitle("");
    setFormNote("");
    setFormCategory(CATEGORIES[0]);
    setFormCategoryCustom("");
    setFormTargetDate(todayYmd);
    setModalOpen(true);
  };

  const openEditModal = (row) => {
    setEditingId(row.id);
    setFormAssignedTo(row.assigned_to || "p2");
    setFormCreatedBy(row.created_by || (row.assigned_to === "p1" ? "p2" : "p1"));
    setFormTitle(row.title || "");
    setFormNote(row.note || "");
    const cat = row.category || CATEGORIES[0];
    if (CATEGORIES.includes(cat)) {
      setFormCategory(cat);
      setFormCategoryCustom("");
    } else {
      setFormCategory("Autre");
      setFormCategoryCustom(cat);
    }
    setFormTargetDate(row.target_date || todayYmd);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
  };

  const fetchChallenges = async ({ showLoading = false } = {}) => {
    if (!supabase) return;
    if (showLoading) setLoading(true);
    setErrorMsg("");

    try {
      let query = supabase.from("defis").select("*");

      if (scope === "day") {
        query = query.eq("scope", "day").eq("target_date", todayYmd);
      } else {
        query = query.eq("scope", "week").eq("week_start", weekStartYmd);
      }

      const { data, error } = await query;
      if (error) throw error;

      const nextItems = (data || []).slice();
      nextItems.sort((a, b) => {
        if (a?.created_at && b?.created_at) return (b.created_at || "").localeCompare(a.created_at || "");
        if (typeof a?.id === "number" && typeof b?.id === "number") return (b.id ?? 0) - (a.id ?? 0);
        return 0;
      });
      setItems(nextItems);
    } catch (error) {
      console.error("Erreur de chargement des défis:", error);
      setErrorMsg(error?.message || "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!supabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    fetchChallenges({ showLoading: true });

    const channelName =
      scope === "day"
        ? `public:defis:day:${todayYmd}`
        : `public:defis:week:${weekStartYmd}`;

    const subscription = supabase
      .channel(channelName)
      .on("postgres_changes", { event: "*", schema: "public", table: "defis" }, () => {
        fetchChallenges();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope]);

  const getCategoryValue = () => {
    if (formCategory === "Autre") return formCategoryCustom.trim() || "Autre";
    return formCategory;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formTitle.trim()) return;
    if (!supabase) return;

    const payload = {
      title: formTitle.trim(),
      note: formNote.trim() || null,
      category: getCategoryValue(),
      assigned_to: formAssignedTo,
      created_by: formCreatedBy,
      scope,
      target_date: scope === "day" ? todayYmd : (formTargetDate || null),
      week_start: scope === "week" ? weekStartYmd : null,
      completed: false,
    };

    try {
      if (editingId) {
        const { data, error } = await supabase
          .from("defis")
          .update({
            title: payload.title,
            note: payload.note,
            category: payload.category,
            assigned_to: payload.assigned_to,
            created_by: payload.created_by,
            target_date: payload.target_date,
          })
          .eq("id", editingId)
          .select();

        if (error) throw error;
        const updated = Array.isArray(data) ? data[0] : null;
        if (updated) setItems((prev) => prev.map((it) => (it.id === editingId ? updated : it)));
        else await fetchChallenges();
      } else {
        const { data, error } = await supabase.from("defis").insert([payload]).select();
        if (error) throw error;
        const inserted = Array.isArray(data) ? data[0] : null;
        if (inserted) setItems((prev) => [inserted, ...prev]);
        else await fetchChallenges();
      }

      closeModal();
    } catch (error) {
      alert("Erreur lors de l'enregistrement: " + (error?.message || "Erreur inconnue"));
    }
  };

  const toggleDone = async (row) => {
    if (!supabase) return;
    const next = !row.completed;
    setItems((prev) => prev.map((it) => (it.id === row.id ? { ...it, completed: next } : it)));

    try {
      const { error } = await supabase
        .from("defis")
        .update({ completed: next, completed_at: next ? new Date().toISOString() : null })
        .eq("id", row.id);

      if (error) throw error;
    } catch (error) {
      setItems((prev) => prev.map((it) => (it.id === row.id ? row : it)));
      alert("Erreur lors de la mise à jour: " + (error?.message || "Erreur inconnue"));
    }
  };

  const removeItem = async (row) => {
    if (!supabase) return;
    if (!confirm("Supprimer ce défi ?")) return;

    const snapshot = items;
    setItems((prev) => prev.filter((it) => it.id !== row.id));

    try {
      const { error } = await supabase.from("defis").delete().eq("id", row.id);
      if (error) throw error;
    } catch (error) {
      setItems(snapshot);
      alert("Erreur lors de la suppression: " + (error?.message || "Erreur inconnue"));
    }
  };

  const groups = useMemo(() => {
    const byAssigned = { p1: [], p2: [] };
    for (const it of items) {
      const key = it.assigned_to === "p1" ? "p1" : "p2";
      byAssigned[key].push(it);
    }
    return byAssigned;
  }, [items]);

  if (!supabaseConfigured) {
    return (
      <div className="page1-container">
        <header className="page1-header">
          <Link to="/" className="page1-back">
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="page1-title">{scopeLabel}</h1>
            <div className="page1-subtitle">{scopeHint}</div>
          </div>
        </header>

        <div className="page1-empty">
          <div className="page1-empty-icon">⚠️</div>
          <div className="page1-empty-text">{supabaseConfigError}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="page1-container">
      <header className="page1-header">
        <Link to="/" className="page1-back">
          <ArrowLeft size={24} />
        </Link>
        <div className="page1-headings">
          <h1 className="page1-title">{scopeLabel}</h1>
          <div className="page1-subtitle">{scopeHint}</div>
        </div>

        <div className="page1-scope">
          <button
            className={`scope-btn ${scope === "day" ? "active" : ""}`}
            onClick={() => setScope("day")}
            type="button"
          >
            Aujourd&apos;hui
          </button>
          <button
            className={`scope-btn ${scope === "week" ? "active" : ""}`}
            onClick={() => setScope("week")}
            type="button"
          >
            Semaine
          </button>
        </div>
      </header>

      {errorMsg && (
        <div className="page1-error">
          <div>Erreur Supabase : {errorMsg}</div>
          <div className="page1-error-hint">
            Vérifie que la table <code>defis</code> existe et que tes règles RLS autorisent
            <code>select/insert/update/delete</code> pour la clé anon.
          </div>
        </div>
      )}

      {loading ? (
        <div className="page1-empty">Chargement...</div>
      ) : (
        <div className="page1-grid">
          {PEOPLE.map((p) => (
            <section key={p.id} className="panel" style={{ borderColor: p.accent }}>
              <div className="panel-head">
                <div>
                  <div className="panel-title">Défis pour {p.label}</div>
                  <div className="panel-subtitle">{p.subtitle}</div>
                </div>
                <button
                  className="panel-add"
                  style={{ backgroundColor: p.accent }}
                  onClick={() => openAddModalFor(p.id)}
                  type="button"
                >
                  <Plus size={18} /> Ajouter
                </button>
              </div>

              {groups[p.id].length === 0 ? (
                <div className="panel-empty">Aucun défi pour le moment.</div>
              ) : (
                <div className="cards">
                  {groups[p.id].map((row) => (
                    <div key={row.id} className={`card ${row.completed ? "done" : ""}`}>
                      <button
                        className={`check ${row.completed ? "checked" : ""}`}
                        onClick={() => toggleDone(row)}
                        type="button"
                        aria-label="Marquer comme accompli"
                      >
                        {row.completed && <Check size={16} />}
                      </button>

                      <div className="card-body">
                        <div className="card-top">
                          <div className="card-title">{row.title}</div>
                          <div className="card-meta">
                            <span className="pill">{row.category || "Sans catégorie"}</span>
                            {scope === "week" && row.target_date && (
                              <span className="pill subtle">{formatFrDate(row.target_date)}</span>
                            )}
                            {row.created_by && (
                              <span className="pill subtle">de {row.created_by.toUpperCase()}</span>
                            )}
                          </div>
                        </div>
                        {row.note && <div className="card-note">{row.note}</div>}
                      </div>

                      <div className="card-actions">
                        <button className="icon-btn" onClick={() => openEditModal(row)} type="button">
                          <Pencil size={18} />
                        </button>
                        <button className="icon-btn danger" onClick={() => removeItem(row)} type="button">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>{editingId ? "Modifier un défi" : "Nouveau défi"}</h3>
              <button className="icon-btn" onClick={closeModal} type="button">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="modal-form">
              <label className="field">
                <div className="label">Titre</div>
                <input
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Ex: Préparer le café ☕"
                  required
                />
              </label>

              <label className="field">
                <div className="label">Détail (optionnel)</div>
                <textarea
                  value={formNote}
                  onChange={(e) => setFormNote(e.target.value)}
                  placeholder="Un petit mot, une précision…"
                  rows={3}
                />
              </label>

              <div className="row">
                <label className="field">
                  <div className="label">Catégorie</div>
                  <select value={formCategory} onChange={(e) => setFormCategory(e.target.value)}>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </label>

                {formCategory === "Autre" && (
                  <label className="field">
                    <div className="label">Nom catégorie</div>
                    <input
                      value={formCategoryCustom}
                      onChange={(e) => setFormCategoryCustom(e.target.value)}
                      placeholder="Ex: Romantique"
                    />
                  </label>
                )}
              </div>

              <div className="row">
                <label className="field">
                  <div className="label">Pour qui ?</div>
                  <select value={formAssignedTo} onChange={(e) => setFormAssignedTo(e.target.value)}>
                    {PEOPLE.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="field">
                  <div className="label">Proposé par</div>
                  <select value={formCreatedBy} onChange={(e) => setFormCreatedBy(e.target.value)}>
                    {PEOPLE.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {scope === "week" && (
                <label className="field">
                  <div className="label">Jour (optionnel)</div>
                  <input
                    type="date"
                    value={formTargetDate || ""}
                    onChange={(e) => setFormTargetDate(e.target.value)}
                  />
                  <div className="help">Laisse vide si c&apos;est un défi libre de la semaine.</div>
                </label>
              )}

              <div className="modal-actions">
                <button className="btn secondary" onClick={closeModal} type="button">
                  Annuler
                </button>
                <button className="btn primary" type="submit">
                  {editingId ? "Enregistrer" : "Ajouter"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
