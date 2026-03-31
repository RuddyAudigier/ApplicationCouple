import React, { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase, supabaseConfigured, supabaseConfigError } from "../supabaseClient";
import { useAuth } from "./AuthProvider";

export default function LoginPage() {
  const { session, user } = useAuth();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from || "/";

  const redirectTo = useMemo(() => {
    const base = (import.meta.env.VITE_AUTH_REDIRECT_BASE_URL || window.location.origin).replace(/\/$/, "");
    const next = encodeURIComponent(from || "/");
    return `${base}/auth/callback?next=${next}`;
  }, [from]);

  const sendMagicLink = async (e) => {
    e.preventDefault();
    if (!supabaseConfigured || !supabase) return;
    if (!email.trim()) return;

    setBusy(true);
    setStatus("");
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: redirectTo },
      });
      if (error) throw error;
      setStatus("Lien envoyé. Ouvre ton email et clique sur le lien de connexion.");
    } catch (err) {
      setStatus(`Erreur: ${err?.message || String(err)}`);
    } finally {
      setBusy(false);
    }
  };

  const signOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    navigate("/login");
  };

  if (!supabaseConfigured) {
    return (
      <div style={{ padding: 16 }}>
        <h2>Connexion</h2>
        <p>{supabaseConfigError}</p>
      </div>
    );
  }

  if (session) {
    return (
      <div style={{ padding: 16 }}>
        <h2>Connecté</h2>
        <p style={{ opacity: 0.8 }}>{user?.email}</p>
        <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
          <button onClick={() => navigate(from)} style={{ padding: "10px 12px", borderRadius: 12 }}>
            Aller à l&apos;app
          </button>
          <button onClick={signOut} style={{ padding: "10px 12px", borderRadius: 12 }}>
            Se déconnecter
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 16, maxWidth: 520, margin: "0 auto" }}>
      <h2>Connexion</h2>
      <p style={{ opacity: 0.8 }}>
        Connexion par lien magique (email). Configure dans Supabase les URLs de redirection vers ton domaine Vercel.
      </p>

      <form onSubmit={sendMagicLink} style={{ display: "flex", gap: 10, marginTop: 10 }}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@exemple.com"
          required
          style={{ flex: 1, padding: "10px 12px", borderRadius: 12 }}
        />
        <button type="submit" disabled={busy} style={{ padding: "10px 12px", borderRadius: 12 }}>
          {busy ? "Envoi…" : "Envoyer"}
        </button>
      </form>

      {status && <div style={{ marginTop: 10, opacity: 0.9 }}>{status}</div>}

      <div style={{ marginTop: 16, opacity: 0.8 }}>
        <Link to="/">Retour</Link>
      </div>
    </div>
  );
}
