import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json();
    const codiceInserito = body?.code;

    if (!codiceInserito) {
      return NextResponse.json(
        { success: false, message: "Codice mancante" },
        { status: 400 }
      );
    }

    if (codiceInserito !== process.env.ADMIN_ACCESS_CODE) {
      return NextResponse.json(
        { success: false, message: "Codice non valido" },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      success: true,
      message: "Accesso consentito",
    });

    response.cookies.set("admin_auth", "ok", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 8,
    });

    return response;
  } catch (error) {
    console.error("Errore login admin:", error);

    return NextResponse.json(
      { success: false, message: "Errore interno" },
      { status: 500 }
    );
  }
}