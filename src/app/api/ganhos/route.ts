import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const agora = new Date();

    // Ganhos hoje
    const inicioHoje = new Date(agora);
    inicioHoje.setHours(0, 0, 0, 0);
    const { data: hoje, error: e1 } = await supabase
      .from("corridas")
      .select("preco_final,preco_estimado")
      .eq("motorista_id", user.id)
      .eq("status", "finalizada")
      .gte("created_at", inicioHoje.toISOString());

    // Ganhos semanal
    const inicioSemana = new Date(agora);
    inicioSemana.setDate(inicioSemana.getDate() - 7);
    const { data: semana, error: e2 } = await supabase
      .from("corridas")
      .select("preco_final,preco_estimado")
      .eq("motorista_id", user.id)
      .eq("status", "finalizada")
      .gte("created_at", inicioSemana.toISOString());

    // Ganhos mensal
    const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
    const { data: mes, error: e3 } = await supabase
      .from("corridas")
      .select("preco_final,preco_estimado")
      .eq("motorista_id", user.id)
      .eq("status", "finalizada")
      .gte("created_at", inicioMes.toISOString());

    if (e1 || e2 || e3) {
      return NextResponse.json({ error: "Erro ao buscar ganhos" }, { status: 500 });
    }

    const sum = (arr: any[] | null) =>
      arr?.reduce((acc: number, c: any) => acc + (c.preco_final ?? c.preco_estimado ?? 0), 0) || 0;

    return NextResponse.json({
      hoje: sum(hoje),
      semana: sum(semana),
      mes: sum(mes),
      corridasHoje: hoje?.length || 0,
      corridasSemana: semana?.length || 0,
      corridasMes: mes?.length || 0,
    });
  } catch (err) {
    console.error("[GET /api/ganhos]", err);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
