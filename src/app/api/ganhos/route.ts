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

  const agora = new Date();

  // Ganhos hoje
  const inicioHoje = new Date(agora);
  inicioHoje.setHours(0, 0, 0, 0);
  const { data: hoje } = await supabase
    .from("corridas")
    .select("preco")
    .eq("motorista_id", user.id)
    .eq("status", "finalizada")
    .gte("created_at", inicioHoje.toISOString());

  // Ganhos semanal
  const inicioSemana = new Date(agora);
  inicioSemana.setDate(inicioSemana.getDate() - 7);
  const { data: semana } = await supabase
    .from("corridas")
    .select("preco")
    .eq("motorista_id", user.id)
    .eq("status", "finalizada")
    .gte("created_at", inicioSemana.toISOString());

  // Ganhos mensal
  const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
  const { data: mes } = await supabase
    .from("corridas")
    .select("preco")
    .eq("motorista_id", user.id)
    .eq("status", "finalizada")
    .gte("created_at", inicioMes.toISOString());

  const sum = (arr: any[] | null) =>
    arr?.reduce((acc: number, c: any) => acc + (c.preco || 0), 0) || 0;

  return NextResponse.json({
    hoje: sum(hoje),
    semana: sum(semana),
    mes: sum(mes),
    corridasHoje: hoje?.length || 0,
    corridasSemana: semana?.length || 0,
    corridasMes: mes?.length || 0,
  });
}
