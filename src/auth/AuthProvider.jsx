import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase, supabaseConfigured } from "../supabaseClient";

const AuthContext = createContext({ loading: true, session: null, user: null });

export function AuthProvider({ children }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);

  useEffect(() => {
    let unsub = null;

    async function init() {
      if (!supabaseConfigured || !supabase) {
        setSession(null);
        setLoading(false);
        return;
      }

      const { data } = await supabase.auth.getSession();
      setSession(data?.session ?? null);
      setLoading(false);

      const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
        setSession(nextSession ?? null);
      });
      unsub = () => listener?.subscription?.unsubscribe?.();
    }

    init();

    return () => {
      if (unsub) unsub();
    };
  }, []);

  const value = useMemo(() => {
    const user = session?.user ?? null;
    return { loading, session, user };
  }, [loading, session]);

  useEffect(() => {
    const email = session?.user?.email;
    if (!email) return;
    try {
      window.NanamoureuxBridge?.setUserEmail?.(email);
    } catch {
      // ignore
    }
  }, [session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
