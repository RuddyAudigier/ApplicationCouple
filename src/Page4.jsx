import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowLeft, Check, Feather, Heart, Plus, Send, Trash2, X } from "lucide-react";
import { supabase, supabaseConfigured, supabaseConfigError } from "./supabaseClient";
import { useAuth } from "./auth/AuthProvider";
import "./Page4.css";

const getDefaultRecipientEmail = () => {
  const email = (import.meta.env.VITE_PARTNER_EMAIL || "").trim();
  return email || "";
};

function isEmailLike(value) {
  const v = String(value || "").trim();
  if (!v) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export default function Page4() {
  const { user } = useAuth();
  const myEmail = (user?.email || "").trim();
  const location = useLocation();

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const [composerOpen, setComposerOpen] = useState(false);
  const [sendTarget, setSendTarget] = useState("messages"); // 'messages' | 'widget'
  const [mode, setMode] = useState("shared"); // 'shared' | 'to_partner'

  const [content, setContent] = useState("");
  const [recipientEmail, setRecipientEmail] = useState(getDefaultRecipientEmail());

  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState("");

  const isReady = supabaseConfigured && Boolean(myEmail);

  if (!supabaseConfigured) {
    return (
      <div className="page4-layout">
        <header className="page4-header">
          <Link to="/" className="page4-back" aria-label="Retour à l'accueil">
            <ArrowLeft size={24} />
          </Link>
          <h1 className="page4-title">Poésie</h1>
          <div className="page4-actions" />
        </header>

        <div className="page4-content">
          <div className="page4-empty">
            <div className="page4-empty-icon">⚠️</div>
            <div style={{ maxWidth: 520, textAlign: "center" }}>{supabaseConfigError}</div>
          </div>
        </div>
      </div>
    );
  }

  const fetchMessages = async ({ showLoading = false } = {}) => {
    if (!supabase) return;
    if (showLoading) setLoading(true);
    setErrorMsg("");

    try {
      let query = supabase.from("petits_mots").select("*");

      if (myEmail) {
        query = query.or(`recipient_email.is.null,recipient_email.eq.${myEmail},sender_email.eq.${myEmail}`);
      }

      const { data, error } = await query;
      if (error) throw error;

      const nextMessages = (data || []).slice();
      nextMessages.sort((a, b) => {
        if (a?.created_at && b?.created_at) return (b.created_at || "").localeCompare(a.created_at || "");
        if (typeof a?.id === "number" && typeof b?.id === "number") return (b.id ?? 0) - (a.id ?? 0);
        return 0;
      });

      setMessages(nextMessages);
    } catch (e) {
      console.error("Erreur de chargement des petits mots:", e);
      setErrorMsg(e?.message || "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!supabase || !myEmail) {
      setLoading(false);
      return;
    }

    fetchMessages({ showLoading: true });

    const subscription = supabase
      .channel("public:petits_mots")
      .on("postgres_changes", { event: "*", schema: "public", table: "petits_mots" }, () => {
        fetchMessages();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myEmail]);

  useEffect(() => {
    const params = new URLSearchParams(location.search || "");
    const compose = params.get("compose");
    if (compose !== "1") return;
    setComposerOpen(true);

    const nextMode = params.get("mode");
    if (nextMode === "to_partner") setMode("to_partner");
    if (nextMode === "shared") setMode("shared");

    const recipient = (params.get("recipient") || "").trim();
    if (recipient) setRecipientEmail(recipient);

    const widget = params.get("widget");
    if (widget === "1") {
      setSendTarget("widget");
      setMode("to_partner");
    }
  }, [location.search]);

  const resetComposer = () => {
    setContent("");
    setSendTarget("messages");
    setMode("shared");
    setRecipientEmail(getDefaultRecipientEmail());
    setComposerOpen(false);
  };

  const canSendToPartner = mode === "shared" || isEmailLike(recipientEmail);

  const addMessage = async (e) => {
    e.preventDefault();
    if (!supabase || !myEmail) return;

    const nextContent = content.trim();
    if (!nextContent) return;

    const toEmail = mode === "to_partner" ? recipientEmail.trim() : null;
    if (mode === "to_partner" && !isEmailLike(toEmail)) return;

    try {
      if (sendTarget === "widget") {
        if (!toEmail) return;
        const { error } = await supabase
          .from("poesie_widget_messages")
          .upsert(
            { recipient_email: toEmail.toLowerCase(), content: nextContent, sender_email: myEmail.toLowerCase() },
            { onConflict: "recipient_email" },
          );
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("petits_mots")
          .insert([{ content: nextContent, sender_email: myEmail, recipient_email: toEmail || null }])
          .select();

        if (error) throw error;
        const inserted = Array.isArray(data) ? data[0] : null;
        if (inserted) setMessages((prev) => [inserted, ...prev]);
        else await fetchMessages();
      }

      resetComposer();
    } catch (e2) {
      alert("Erreur lors de l'envoi: " + (e2?.message || "Erreur inconnue"));
    }
  };

  const startEdit = (row) => {
    setEditingId(row.id);
    setEditContent(row.content || "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditContent("");
  };

  const saveEdit = async (row) => {
    if (!supabase) return;
    const nextContent = editContent.trim();
    if (!nextContent) return;

    try {
      const { error } = await supabase.from("petits_mots").update({ content: nextContent }).eq("id", row.id);
      if (error) throw error;
      setMessages((prev) => prev.map((m) => (m.id === row.id ? { ...m, content: nextContent } : m)));
      cancelEdit();
    } catch (e) {
      alert("Erreur lors de la modification: " + (e?.message || "Erreur inconnue"));
    }
  };

  const deleteMessage = async (row) => {
    if (!supabase) return;
    if (!confirm("Supprimer ce petit mot ?")) return;

    try {
      const { error } = await supabase.from("petits_mots").delete().eq("id", row.id);
      if (error) throw error;
      setMessages((prev) => prev.filter((m) => m.id !== row.id));
    } catch (e) {
      alert("Erreur lors de la suppression: " + (e?.message || "Erreur inconnue"));
    }
  };

  const titleHint = useMemo(() => {
    if (!myEmail) return "Connecte-toi pour partager";
    return "Un endroit doux pour se dire les choses";
  }, [myEmail]);

  return (
    <div className="page4-layout">
      <div className="page4-bg" />
      <header className="page4-header">
        <Link to="/" className="page4-back" aria-label="Retour à l'accueil">
          <ArrowLeft size={24} />
        </Link>
        <div className="page4-header-center">
          <h1 className="page4-title">
            Poésie <span className="page4-title-emoji">✍️</span>
          </h1>
          <div className="page4-subtitle">
            <Feather size={14} /> {titleHint}
          </div>
        </div>
        <div className="page4-actions">
          <Link className="page4-ghost-btn" to="/poesie-widget" title="Affichage plein écran (à épingler sur l’écran d’accueil)">
            Widget
          </Link>
          <button className="page4-primary-btn" onClick={() => setComposerOpen(true)} disabled={!isReady}>
            <Plus size={18} /> Écrire
          </button>
        </div>
      </header>

      <main className="page4-content">
        {!myEmail ? (
          <div className="page4-empty" style={{ marginTop: 6 }}>
            <div className="page4-empty-icon">🔒</div>
            <div style={{ maxWidth: 520, textAlign: "center" }}>
              Connecte-toi pour écrire et voir les petits mots.
            </div>
          </div>
        ) : null}

        {errorMsg ? (
          <div className="page4-banner">
            <span>Erreur Supabase : {errorMsg}</span>
          </div>
        ) : null}

        {composerOpen ? (
          <section className="page4-composer">
            <div className="page4-composer-head">
              <div className="page4-composer-title">
                <Heart size={16} /> Écrire un petit mot
              </div>
              <button className="page4-icon-btn" onClick={resetComposer} aria-label="Fermer">
                <X size={18} />
              </button>
            </div>

            <div className="page4-mode-row">
              <button
                type="button"
                className={`page4-chip ${sendTarget === "messages" && mode === "shared" ? "active" : ""}`}
                onClick={() => {
                  setSendTarget("messages");
                  setMode("shared");
                }}
              >
                💞 Partagé
              </button>
              <button
                type="button"
                className={`page4-chip ${sendTarget === "messages" && mode === "to_partner" ? "active" : ""}`}
                onClick={() => {
                  setSendTarget("messages");
                  setMode("to_partner");
                }}
              >
                💌 À mon amour
              </button>
              <button
                type="button"
                className={`page4-chip ${sendTarget === "widget" ? "active" : ""}`}
                onClick={() => {
                  setSendTarget("widget");
                  setMode("to_partner");
                }}
                title="Envoie un texte épinglé au widget (remplace le précédent)"
              >
                📌 Widget
              </button>
            </div>

            {mode === "to_partner" ? (
              <div className="page4-row">
                <input
                  className="page4-input"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="Email du destinataire"
                />
                <div className="page4-hint">Astuce: tu peux mettre `VITE_PARTNER_EMAIL` dans `.env`.</div>
              </div>
            ) : null}

            <form onSubmit={addMessage} className="page4-form">
              <textarea
                className="page4-textarea"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Une phrase, une pensée, un truc simple…"
                rows={4}
                autoFocus
              />
              {sendTarget === "widget" ? (
                <div className="page4-hint">
                  Le texte sera affiché dans le widget et remplacera le précédent (pour éviter de brouiller les messages).
                </div>
              ) : null}
              <div className="page4-form-actions">
                <button type="submit" className="page4-primary-btn" disabled={!canSendToPartner}>
                  <Send size={18} /> {sendTarget === "widget" ? "Envoyer au widget" : "Envoyer"}
                </button>
                <button type="button" className="page4-ghost-btn" onClick={resetComposer}>
                  Annuler
                </button>
              </div>
            </form>
          </section>
        ) : null}

        {!myEmail ? null : loading ? (
          <div className="page4-empty">
            <div className="page4-empty-icon">⏳</div>
            <div>Chargement...</div>
          </div>
        ) : messages.length === 0 ? (
          <div className="page4-empty">
            <div className="page4-empty-icon">📜</div>
            <div className="page4-empty-title">Aucun petit mot</div>
            <div className="page4-empty-text">Écris une phrase qui fait du bien. Même toute petite.</div>
            <button className="page4-primary-btn" onClick={() => setComposerOpen(true)}>
              <Plus size={18} /> Écrire le premier
            </button>
          </div>
        ) : (
          <section className="page4-list">
            {messages.map((m) => {
              const isMine = (m.sender_email || "") === myEmail;
              const isEditing = editingId === m.id;
              const toYou = (m.recipient_email || "") === myEmail;
              const isShared = !m.recipient_email;
              const tag = isShared ? "Partagé" : toYou ? "Pour toi" : "Privé";

              return (
                <article key={m.id} className={`page4-note ${isMine ? "mine" : ""}`}>
                  <div className="page4-note-top">
                    <div className="page4-note-tag">{tag}</div>
                    <div className="page4-note-actions">
                      {isMine ? (
                        <>
                          {isEditing ? (
                            <>
                              <button className="page4-icon-btn" onClick={() => saveEdit(m)} aria-label="Enregistrer">
                                <Check size={18} />
                              </button>
                              <button className="page4-icon-btn" onClick={cancelEdit} aria-label="Annuler">
                                <X size={18} />
                              </button>
                            </>
                          ) : (
                            <>
                              <button className="page4-icon-btn" onClick={() => startEdit(m)} aria-label="Modifier">
                                ✏️
                              </button>
                              <button className="page4-icon-btn danger" onClick={() => deleteMessage(m)} aria-label="Supprimer">
                                <Trash2 size={18} />
                              </button>
                            </>
                          )}
                        </>
                      ) : null}
                    </div>
                  </div>

                  <div className="page4-note-body">
                    {isEditing ? (
                      <textarea
                        className="page4-textarea"
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows={4}
                      />
                    ) : (
                      <div className="page4-note-content">{m.content}</div>
                    )}
                    <div className="page4-note-meta">
                      <span>{isMine ? "Toi" : "Ton amour"}</span>
                      <span className="page4-dot">•</span>
                      <span>
                        {m.created_at ? new Date(m.created_at).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" }) : ""}
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}

        <div className="page4-future">
          <div className="page4-future-title">Pour le futur (widget)</div>
          <div className="page4-future-text">
            Aujourd’hui, ça s’envoie via la BDD et l’autre le voit instantanément si l’app est ouverte. Pour un widget / notif
            sur le téléphone, il faudra ajouter des notifications (push) ou une app mobile dédiée.
          </div>
        </div>
      </main>
    </div>
  );
}
