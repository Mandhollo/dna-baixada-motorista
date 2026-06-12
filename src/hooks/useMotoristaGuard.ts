"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Hook that guards routes for motorista role only.
 * Redirects to "/" if user is not a motorista.
 */
export function useMotoristaGuard() {
  const { user, profile, loading, isMotorista } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
      return;
    }
    if (!loading && user && profile && !isMotorista) {
      router.push("/");
    }
  }, [user, profile, loading, isMotorista, router]);

  return { loading, isAuthorized: !!user && isMotorista };
}
