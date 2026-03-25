"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const [code, setCode] = useState("");
  const [caricamento, setCaricamento] = useState(false);
  const [errore, setErrore] = useState("");
  const router = useRouter();

  async function handleLogin(e) {
    e.preventDefault();
    setErrore("");
    setCaricamento(true);

    try {
      const response = await fetch("/api/admin-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code }),
      });

      const result = await response.json();

      if (!response.ok) {
        setErrore(result.message || "Accesso non consentito");
        setCaricamento(false);
        return;
      }

      router.push("/gestione-ordini");
      router.refresh();
    } catch (error) {
      console.error("Errore login:", error);
      setErrore("Errore di connessione");
    }

    setCaricamento(false);
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#0f172a",
        color: "#ffffff",
        fontFamily: "Arial, sans-serif",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          backgroundColor: "#1e293b",
          border: "1px solid #334155",
          borderRadius: 16,
          padding: 32,
          boxShadow: "0 8px 30px rgba(0,0,0,0.25)",
        }}
      >
        <h1 style={{ marginTop: 0, marginBottom: 10, fontSize: 30 }}>
          Accesso Admin
        </h1>

        <p style={{ opacity: 0.8, marginBottom: 24 }}>
          Inserisci il codice per entrare nell’area interna.
        </p>

        <form onSubmit={handleLogin}>
          <input
            type="password"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Codice admin"
            style={{
              width: "100%",
              padding: "14px 12px",
              borderRadius: 10,
              border: "1px solid #475569",
              backgroundColor: "#0f172a",
              color: "#ffffff",
              fontSize: 16,
              boxSizing: "border-box",
              marginBottom: 14,
            }}
          />

          {errore ? (
            <div
              style={{
                marginBottom: 14,
                color: "#fca5a5",
                fontSize: 14,
                fontWeight: "bold",
              }}
            >
              {errore}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={caricamento}
            style={{
              width: "100%",
              padding: "14px 16px",
              border: "none",
              borderRadius: 10,
              backgroundColor: caricamento ? "#64748b" : "#2563eb",
              color: "#ffffff",
              fontWeight: "bold",
              fontSize: 16,
              cursor: caricamento ? "not-allowed" : "pointer",
            }}
          >
            {caricamento ? "Accesso in corso..." : "Entra"}
          </button>
        </form>
      </div>
    </div>
  );
}