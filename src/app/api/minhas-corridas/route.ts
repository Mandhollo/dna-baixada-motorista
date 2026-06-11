import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { data: corridas } = await supabase
    .from("corridas")
    .select("*, profiles!corridas_passageiro_id_fkey(nome)")
    .eq("motorista_id", user.id)
    .in("status", ["finalizada", "cancelada"])
    .order("created_at", { ascending: false });

  return NextResponse.json({ corridas: corridas || [] });
}
