import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, RefreshCcw } from "lucide-react";
import { supabase, supabaseConfigured, supabaseConfigError } from "./supabaseClient";
import { useAuth } from "./auth/AuthProvider";
import "./PoetryWidgetPage.css";

export default function PoetryWidgetPage() {
  const { user } = useAuth();
  const myEmail = (user?.email || "").trim();

  const [row, setRow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const canLoad = supabaseConfigured && Boolean(myEmail) && Boolean(supabase);

  const fetchLatest = async () => {
    if (!canLoad) return;
    setErrorMsg("");
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("petits_mots")
        .select("*")
        .or(`recipient_email.eq.${myEmail},recipient_email.is.null`)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;

      const candidates = (data || []).filter((m) => {
        if (!m) return false;
        // Priorité: messages explicitement "pour moi"
        if ((m.recipient_email || "") === myEmail) return true;
        // Sinon: partagés, mais pas ceux que j'ai moi-même écrits
        return !m.recipient_email && (m.sender_email || "") !== myEmail;
      });

      setRow(candidates[0] || null);
    } catch (e) {
      console.error("Erreur widget poésie:", e);
      setErrorMsg(e?.message || "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLatest();

    if (!canLoad) return undefined;
    const subscription = supabase
      .channel("public:petits_mots-widget")
      .on("postgres_changes", { event: "*", schema: "public", table: "petits_mots" }, () => {
        fetchLatest();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myEmail, canLoad]);

  const hint = useMemo(() => {
    if (!supabaseConfigured) return supabaseConfigError;
    if (!myEmail) return "Connecte-toi pour afficher le dernier petit mot.";
    return "Ajoute ce lien à l’écran d’accueil pour l’utiliser comme “widget”.";
  }, [myEmail]);

  return (
    <div className="poetry-widget">
      <div className="poetry-widget-bg" />
      <header className="poetry-widget-header">
        <Link to="/page4" className="poetry-widget-back" aria-label="Retour">
          <ArrowLeft size={22} />
        </Link>
        <div className="poetry-widget-title">Dernier petit mot</div>
        <button className="poetry-widget-refresh" onClick={fetchLatest} aria-label="Rafraîchir">
          <RefreshCcw size={18} />
        </button>
      </header>

      <main className="poetry-widget-main">
        <div className="poetry-widget-hint">{hint}</div>

        {!supabaseConfigured ? null : errorMsg ? (
          <div className="poetry-widget-card">
            <div className="poetry-widget-error">Erreur : {errorMsg}</div>
          </div>
        ) : loading ? (
          <div className="poetry-widget-card">
            <div className="poetry-widget-loading">Chargement…</div>
          </div>
        ) : row ? (
          <div className="poetry-widget-card">
            <div className="poetry-widget-content">“{row.content}”</div>
            <div className="poetry-widget-meta">
              <span>{(row.sender_email || "") === myEmail ? "Toi" : "Ton amour"}</span>
              <span className="dot">•</span>
              <span>
                {row.created_at
                  ? new Date(row.created_at).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" })
                  : ""}
              </span>
            </div>
          </div>
        ) : (
          <div className="poetry-widget-card">
            <div className="poetry-widget-empty">Aucun mot reçu pour le moment.</div>
          </div>
        )}
      </main>
    </div>
  );
}

