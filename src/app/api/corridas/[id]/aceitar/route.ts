import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  // Verify motorista role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "motorista") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  // Accept ride (only if still waiting)
  const { data: corrida, error } = await supabase
    .from("corridas")
    .update({ motorista_id: user.id, status: "aceita" })
    .eq("id", id)
    .eq("status", "aguardando")
    .select()
    .single();

  if (error || !corrida) {
    return NextResponse.json(
      { error: "Corrida não disponível ou já aceita" },
      { status: 400 }
    );
  }

  return NextResponse.json({ corrida });
}
