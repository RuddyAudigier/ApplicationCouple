import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase, supabaseConfigured, supabaseConfigError } from "../supabaseClient";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("Connexion en cours…");
  const [showOpenApp, setShowOpenApp] = useState(false);

  useEffect(() => {
    async function run() {
      if (!supabaseConfigured || !supabase) {
        setStatus(supabaseConfigError);
        return;
      }

      try {
        // Magic link uses ?code=... (PKCE). Exchange it for a session.
        const url = new URL(window.location.href);
        const next = url.searchParams.get("next") || "/";

        // Android handoff: si le callback s'ouvre dans Chrome (ou WebAPK/PWA),
        // on tente d'ouvrir l'APK via le custom scheme pour finaliser la session dans la WebView.
        const ua = navigator.userAgent || "";
        const isAndroid = ua.includes("Android");
        const isAndroidShell = ua.includes("NanamoureuxAndroid") || Boolean(window.NanamoureuxBridge);
        if (isAndroid && !isAndroidShell) {
          const schemeUrl = `nanamoureux://auth/callback${window.location.search || ""}`;
          setStatus("Ouverture de l’application…");
          setShowOpenApp(true);
          // Tentative silencieuse. Si l’APK n’est pas installé, l’utilisateur restera sur le web.
          window.location.href = schemeUrl;
          // Ne pas continuer l’exchange ici: on le fera dans l’APK (WebView).
          return;
        }

        if (url.searchParams.get("code")) {
          const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);
          if (error) throw error;
        } else if (window.location.hash?.includes("access_token=")) {
          // Some flows return tokens in the URL hash (implicit). Store them as a session.
          const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
          const access_token = params.get("access_token");
          const refresh_token = params.get("refresh_token");
          if (!access_token || !refresh_token) {
            throw new Error("Tokens manquants dans l’URL.");
          }
          const { error } = await supabase.auth.setSession({ access_token, refresh_token });
          if (error) throw error;
        }

        navigate(next, { replace: true });
      } catch (err) {
        setStatus(`Erreur: ${err?.message || String(err)}`);
      }
    }

    run();
  }, [navigate]);

  return (
    <div style={{ padding: 16 }}>
      <div>{status}</div>
      {showOpenApp ? (
        <div style={{ marginTop: 12 }}>
          <a href={`nanamoureux://auth/callback${window.location.search || ""}`}>
            Ouvrir Nanamoureux
          </a>
        </div>
      ) : null}
    </div>
  );
}
