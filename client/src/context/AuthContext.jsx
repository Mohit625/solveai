import { createContext, useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => subscription.unsubscribe();
  }, []);

  const value = {
    session,
    user: session?.user ?? null,
    loading,
    signUp: (email, password) => supabase.auth.signUp({ email, password }),
    signIn: (email, password) => supabase.auth.signInWithPassword({ email, password }),
    // Same call covers both sign-in and sign-up — Supabase creates the
    // auth.users row (and, via the handle_new_user trigger, the matching
    // profiles row) automatically on a Google account's first use.
    signInWithGoogle: () =>
      supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin } }),
    signOut: () => supabase.auth.signOut(),
    resetPassword: (email) => supabase.auth.resetPasswordForEmail(email),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
