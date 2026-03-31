import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Check, Heart, MapPin, Pencil, Plus, Sparkles, Trash2, X } from "lucide-react";
import { supabase, supabaseConfigured, supabaseConfigError } from "./supabaseClient";
import "./Page5.css";

const MOODS = [
  { id: "jazz", label: "Jazz", emoji: "🎷", color: "#d7bde2", softColor: "#d7bde233" },
  { id: "romantique", label: "Romantique", emoji: "💘", color: "#ffb5a7", softColor: "#ffb5a733" },
  { id: "cozy", label: "Cozy", emoji: "🕯️", color: "#f9e79f", softColor: "#f9e79f33" },
  { id: "aventure", label: "Aventure", emoji: "✨", color: "#a3e4d7", softColor: "#a3e4d733" },
];

const getMood = (id) => MOODS.find((m) => m.id === id) || MOODS[1];

export default function Page5() {
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState("");
  const [mood, setMood] = useState("jazz");
  const [place, setPlace] = useState("");
  const [notes, setNotes] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editMood, setEditMood] = useState("romantique");
  const [editPlace, setEditPlace] = useState("");
  const [editNotes, setEditNotes] = useState("");

  const fetchIdeas = async ({ showLoading = false } = {}) => {
    if (!supabase) return;
    if (showLoading) setLoading(true);
    setErrorMsg("");

    try {
      const { data, error } = await supabase.from("idees_dates").select("*");
      if (error) throw error;

      const nextIdeas = (data || []).slice();
      nextIdeas.sort((a, b) => {
        if (a?.created_at && b?.created_at) return (b.created_at || "").localeCompare(a.created_at || "");
        if (typeof a?.id === "number" && typeof b?.id === "number") return (b.id ?? 0) - (a.id ?? 0);
        return 0;
      });

      setIdeas(nextIdeas);
    } catch (e) {
      console.error("Erreur de chargement des idées:", e);
      setErrorMsg(e?.message || "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!supabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    fetchIdeas({ showLoading: true });

    const subscription = supabase
      .channel("public:idees_dates")
      .on("postgres_changes", { event: "*", schema: "public", table: "idees_dates" }, () => {
        fetchIdeas();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const startEdit = (idea) => {
    setEditingId(idea.id);
    setEditTitle(idea.title || "");
    setEditMood(idea.mood || "romantique");
    setEditPlace(idea.place || "");
    setEditNotes(idea.notes || "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
    setEditMood("romantique");
    setEditPlace("");
    setEditNotes("");
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    const nextTitle = title.trim();
    if (!nextTitle) return;

    try {
      const { data, error } = await supabase
        .from("idees_dates")
        .insert([
          {
            title: nextTitle,
            mood,
            place: place.trim() || null,
            notes: notes.trim() || null,
          },
        ])
        .select();

      if (error) throw error;
      const inserted = Array.isArray(data) ? data[0] : null;
      if (inserted) setIdeas((prev) => [inserted, ...prev]);
      else await fetchIdeas();

      setTitle("");
      setMood("jazz");
      setPlace("");
      setNotes("");
      setShowAdd(false);
    } catch (e2) {
      alert("Erreur lors de l'ajout: " + (e2?.message || "Erreur inconnue"));
    }
  };

  const saveEdit = async (id) => {
    const nextTitle = editTitle.trim();
    if (!nextTitle) return;

    try {
      const { error } = await supabase
        .from("idees_dates")
        .update({
          title: nextTitle,
          mood: editMood,
          place: editPlace.trim() || null,
          notes: editNotes.trim() || null,
        })
        .eq("id", id);

      if (error) throw error;

      setIdeas((prev) =>
        prev.map((it) =>
          it.id === id
            ? { ...it, title: nextTitle, mood: editMood, place: editPlace.trim() || null, notes: editNotes.trim() || null }
            : it,
        ),
      );
      cancelEdit();
    } catch (e) {
      alert("Erreur lors de la modification: " + (e?.message || "Erreur inconnue"));
    }
  };

  const deleteIdea = async (id) => {
    if (!confirm("Supprimer cette idée de date ?")) return;

    try {
      const { error } = await supabase.from("idees_dates").delete().eq("id", id);
      if (error) throw error;
      setIdeas((prev) => prev.filter((it) => it.id !== id));
    } catch (e) {
      alert("Erreur lors de la suppression: " + (e?.message || "Erreur inconnue"));
    }
  };

  const addJazzPreset = async () => {
    try {
      const { data, error } = await supabase
        .from("idees_dates")
        .insert([
          {
            title: "Aller à un bar de jazz",
            mood: "jazz",
            place: "Un petit bar intimiste",
            notes: "Tenue chic, un verre chacun, et on se laisse porter par la musique.",
          },
        ])
        .select();

      if (error) throw error;
      const inserted = Array.isArray(data) ? data[0] : null;
      if (inserted) setIdeas((prev) => [inserted, ...prev]);
      else await fetchIdeas();
    } catch (e) {
      alert("Erreur lors de l'ajout: " + (e?.message || "Erreur inconnue"));
    }
  };

  const romanticCount = useMemo(() => ideas.length, [ideas.length]);

  return (
    <div className="page5-layout">
      <div className="page5-bg" />
      <header className="page5-header">
        <Link to="/" className="page5-back" aria-label="Retour à l'accueil">
          <ArrowLeft size={24} />
        </Link>
        <div className="page5-header-center">
          <h1 className="page5-title">
            Idées Dates <span className="page5-title-emoji">💖</span>
          </h1>
          <div className="page5-subtitle">
            <Sparkles size={14} /> {romanticCount} idée{romanticCount === 1 ? "" : "s"} à faire fondre le quotidien
          </div>
        </div>
        <div className="page5-actions">
          <button
            className="page5-primary-btn"
            onClick={() => setShowAdd((v) => !v)}
            disabled={!supabaseConfigured}
            title={!supabaseConfigured ? "Configurer Supabase pour activer la BDD" : undefined}
          >
            <Plus size={18} /> Ajouter
          </button>
        </div>
      </header>

      <main className="page5-content">
        {!supabaseConfigured ? (
          <div className="page5-empty" style={{ marginTop: 6 }}>
            <div className="page5-empty-icon">⚠️</div>
            <div style={{ maxWidth: 520, textAlign: "center" }}>{supabaseConfigError}</div>
          </div>
        ) : null}

        {errorMsg && (
          <div className="page5-banner">
            <span>Erreur Supabase : {errorMsg}</span>
          </div>
        )}

        {showAdd && (
          <section className="page5-add-card">
            <div className="page5-add-head">
              <div className="page5-add-title">
                <Heart size={16} /> Nouvelle idée
              </div>
              <button className="page5-icon-btn" onClick={() => setShowAdd(false)} aria-label="Fermer">
                <X size={18} />
              </button>
            </div>

            <form className="page5-form" onSubmit={handleAdd}>
              <div className="page5-form-row">
                <input
                  className="page5-input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Aller à un bar de jazz"
                />
              </div>

              <div className="page5-form-row">
                <div className="page5-mood-row">
                  {MOODS.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      className={`page5-mood-chip ${mood === m.id ? "active" : ""}`}
                      style={{
                        borderColor: mood === m.id ? m.color : "rgba(255,255,255,0.35)",
                        background: mood === m.id ? m.softColor : "rgba(255,255,255,0.20)",
                      }}
                      onClick={() => setMood(m.id)}
                    >
                      <span className="page5-mood-emoji">{m.emoji}</span> {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="page5-form-row">
                <div className="page5-input-with-icon">
                  <MapPin size={16} />
                  <input
                    className="page5-input"
                    value={place}
                    onChange={(e) => setPlace(e.target.value)}
                    placeholder="Lieu (optionnel)"
                  />
                </div>
              </div>

              <div className="page5-form-row">
                <textarea
                  className="page5-textarea"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Petites notes (optionnel) : tenue, ambiance, budget, playlist..."
                  rows={3}
                />
              </div>

              <div className="page5-form-actions">
                <button type="submit" className="page5-primary-btn">
                  <Plus size={18} /> Ajouter l’idée
                </button>
                <button type="button" className="page5-ghost-btn" onClick={() => setShowAdd(false)}>
                  Annuler
                </button>
              </div>
            </form>
          </section>
        )}

        {!supabaseConfigured ? null : loading ? (
          <div className="page5-empty">
            <div className="page5-empty-icon">⏳</div>
            <div>Chargement des idées...</div>
          </div>
        ) : ideas.length === 0 ? (
          <div className="page5-empty">
            <div className="page5-empty-icon">💞</div>
            <div className="page5-empty-title">Aucune idée pour le moment</div>
            <div className="page5-empty-text">On commence doux : une musique, deux verres, et un peu de magie.</div>
            <button className="page5-primary-btn" onClick={addJazzPreset}>
              <Sparkles size={18} /> Ajouter “Bar de jazz”
            </button>
          </div>
        ) : (
          <section className="page5-grid">
            {ideas.map((idea) => {
              const m = getMood(idea.mood);
              const isEditing = editingId === idea.id;

              return (
                <article key={idea.id} className="page5-card" style={{ borderColor: m.color }}>
                  <div className="page5-card-top" style={{ background: m.softColor }}>
                    <div className="page5-card-mood">
                      <span className="page5-card-emoji">{m.emoji}</span>
                      <span className="page5-card-label">{m.label}</span>
                    </div>
                    <div className="page5-card-actions">
                      {isEditing ? (
                        <>
                          <button className="page5-icon-btn" onClick={() => saveEdit(idea.id)} aria-label="Enregistrer">
                            <Check size={18} />
                          </button>
                          <button className="page5-icon-btn" onClick={cancelEdit} aria-label="Annuler">
                            <X size={18} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button className="page5-icon-btn" onClick={() => startEdit(idea)} aria-label="Modifier">
                            <Pencil size={18} />
                          </button>
                          <button className="page5-icon-btn danger" onClick={() => deleteIdea(idea.id)} aria-label="Supprimer">
                            <Trash2 size={18} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="page5-card-body">
                    {isEditing ? (
                      <>
                        <input className="page5-input" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                        <div className="page5-mood-row compact">
                          {MOODS.map((mm) => (
                            <button
                              key={mm.id}
                              type="button"
                              className={`page5-mood-chip ${editMood === mm.id ? "active" : ""}`}
                              style={{
                                borderColor: editMood === mm.id ? mm.color : "rgba(255,255,255,0.35)",
                                background: editMood === mm.id ? mm.softColor : "rgba(255,255,255,0.20)",
                              }}
                              onClick={() => setEditMood(mm.id)}
                            >
                              <span className="page5-mood-emoji">{mm.emoji}</span> {mm.label}
                            </button>
                          ))}
                        </div>
                        <div className="page5-input-with-icon">
                          <MapPin size={16} />
                          <input
                            className="page5-input"
                            value={editPlace}
                            onChange={(e) => setEditPlace(e.target.value)}
                            placeholder="Lieu (optionnel)"
                          />
                        </div>
                        <textarea
                          className="page5-textarea"
                          value={editNotes}
                          onChange={(e) => setEditNotes(e.target.value)}
                          placeholder="Notes (optionnel)"
                          rows={3}
                        />
                      </>
                    ) : (
                      <>
                        <div className="page5-card-title">{idea.title}</div>
                        {idea.place ? (
                          <div className="page5-card-place">
                            <MapPin size={14} />
                            <span>{idea.place}</span>
                          </div>
                        ) : null}
                        {idea.notes ? <div className="page5-card-notes">{idea.notes}</div> : null}
                      </>
                    )}
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </main>
    </div>
  );
}
