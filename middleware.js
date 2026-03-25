import { NextResponse } from "next/server";

export function middleware(request) {
  const { pathname } = request.nextUrl;

  const percorsiProtetti = [
    "/gestione-ordini",
    "/stampa/andrea",
    "/stampa/raffaele",
    "/stampa/totale",
  ];

  const richiedeProtezione = percorsiProtetti.some((percorso) =>
    pathname.startsWith(percorso)
  );

  if (!richiedeProtezione) {
    return NextResponse.next();
  }

  const adminAuth = request.cookies.get("admin_auth")?.value;

  if (adminAuth === "ok") {
    return NextResponse.next();
  }

  const loginUrl = new URL("/admin", request.url);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/gestione-ordini/:path*",
    "/stampa/andrea/:path*",
    "/stampa/raffaele/:path*",
    "/stampa/totale/:path*",
  ],
};