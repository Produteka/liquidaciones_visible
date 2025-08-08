import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { month, year } = await req.json() as { month?: number, year?: number };
    
    if (!month || month < 1 || month > 12) {
      return NextResponse.json({ ok: false, error: "Mes inválido" }, { status: 400 });
    }
    
    if (!year || year < 2000) {
      return NextResponse.json({ ok: false, error: "Año inválido" }, { status: 400 });
    }

    const timestamp = new Date().toISOString();
    const url = process.env.MAKE_WEBHOOK_URL;

    if (!url) {
      return NextResponse.json({ ok: false, error: "Falta MAKE_WEBHOOK_URL en variables de entorno" }, { status: 500 });
    }

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ month, year, timestamp })
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return NextResponse.json(
        { ok: false, error: `Webhook respondió ${res.status}. ${text}` },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true, month, year, timestamp });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message ?? "Error desconocido" }, { status: 500 });
  }
}
