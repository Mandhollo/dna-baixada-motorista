"use client";

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

interface Profile {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  role: string;
  foto_url: string | null;
}

interface Motorista {
  id: string;
  cnh: string;
  veiculo_modelo: string;
  veiculo_placa: string;
  veiculo_cor: string;
  veiculo_lugares: number;
  disponivel: boolean;
  avaliacao: number;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  motorista: Motorista | null;
  supabase: SupabaseClient;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  motorista: null,
  supabase: null as unknown as SupabaseClient,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [motorista, setMotorista] = useState<Motorista | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = useMemo(() => createClient(), []);

  const loadProfile = useCallback(
    async (userId: string) => {
      const { data: prof } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (prof) setProfile(prof as Profile);

      const { data: mot } = await supabase
        .from("motoristas")
        .select("*")
        .eq("id", userId)
        .single();

      if (mot) setMotorista(mot as Motorista);
    },
    [supabase]
  );

  const refreshProfile = useCallback(async () => {
    if (user) {
      await loadProfile(user.id);
    }
  }, [user, loadProfile]);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        setUser(session.user);
        await loadProfile(session.user.id);
      }
      setLoading(false);
    };

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser(session.user);
        await loadProfile(session.user.id);
      } else {
        setUser(null);
        setProfile(null);
        setMotorista(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase, loadProfile]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setMotorista(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        motorista,
        supabase,
        loading,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
