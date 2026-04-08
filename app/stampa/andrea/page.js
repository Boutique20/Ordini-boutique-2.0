"use client";

import { Suspense, useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

function StampaAndreaContent() {
  const [dati, setDati] = useState({});
  const [caricamento, setCaricamento] = useState(true);

  useEffect(() => {
    caricaDati();
  }, []);

  async function caricaDati() {
    setCaricamento(true);

    const { data: ordini, error: ordiniError } = await supabase
      .from("ordini")
      .select("*")
      .eq("stato", "bozza")
      .order("id", { ascending: true });

    if (ordiniError) {
      console.error("Errore ordini:", ordiniError);
      alert("Errore nel caricamento ordini");
      setCaricamento(false);
      return;
    }

    const { data: clienti, error: clientiError } = await supabase
      .from("clienti")
      .select("id, nome");

    if (clientiError) {
      console.error("Errore clienti:", clientiError);
      alert("Errore nel caricamento clienti");
      setCaricamento(false);
      return;
    }

    const idsOrdini = (ordini || []).map((o) => o.id);

    let righe = [];
    if (idsOrdini.length > 0) {
      const response = await supabase
        .from("righe_ordine")
        .select("*")
        .in("ordine_id", idsOrdini);

      if (response.error) {
        console.error("Errore righe ordine:", response.error);
        alert("Errore nel caricamento righe ordine");
        setCaricamento(false);
        return;
      }

      righe = response.data || [];
    }

    const idsProdotti = [...new Set(righe.map((r) => r.prodotto_id))];

    let prodotti = [];
    if (idsProdotti.length > 0) {
      const response = await supabase
        .from("prodotti_v2")
        .select("id, nome, stampa")
        .in("id", idsProdotti);

      if (response.error) {
        console.error("Errore prodotti:", response.error);
        alert("Errore nel caricamento prodotti");
        setCaricamento(false);
        return;
      }

      prodotti = response.data || [];
    }

    const clientiMap = {};
    (clienti || []).forEach((c) => {
      clientiMap[c.id] = c.nome;
    });

    const prodottiMap = {};
    (prodotti || []).forEach((p) => {
      prodottiMap[p.id] = p;
    });

    const risultato = {};

    (ordini || []).forEach((ordine) => {
      const clienteNome =
        clientiMap[ordine.cliente_id] || "Cliente sconosciuto";
      const righeOrdine = (righe || []).filter((r) => r.ordine_id === ordine.id);

      const righeAndrea = righeOrdine.filter(
        (r) => prodottiMap[r.prodotto_id]?.stampa === "ANDREA"
      );

      if (righeAndrea.length > 0) {
        if (!risultato[clienteNome]) {
          risultato[clienteNome] = [];
        }

        righeAndrea.forEach((r) => {
          risultato[clienteNome].push({
            nome: prodottiMap[r.prodotto_id]?.nome || "Prodotto sconosciuto",
            quantita: r.quantita,
            unita: r.unita,
          });
        });
      }
    });

    const risultatoOrdinato = Object.fromEntries(
      Object.entries(risultato).sort((a, b) => a[0].localeCompare(b[0], "it"))
    );

    setDati(risultatoOrdinato);
    setCaricamento(false);
  }

  function stampaPagina() {
    window.print();
  }

  return (
    <div
      style={{
        padding: 12,
        fontFamily: "Arial, sans-serif",
        backgroundColor: "#ffffff",
        color: "#000000",
        minHeight: "100vh",
      }}
    >
      <style>{`
        @page {
          size: A4 landscape;
          margin: 8mm;
        }

        @media print {
          button {
            display: none !important;
          }

          body {
            margin: 0;
            padding: 0;
            background: #ffffff;
          }
        }
      `}</style>

      <div style={{ maxWidth: 1600, margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 14,
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <div>
            <h1 style={{ margin: 0, fontSize: 22 }}>
              Stampa Andrea - Ordini in bozza
            </h1>
          </div>

          <button
            onClick={stampaPagina}
            style={{
              padding: "8px 14px",
              border: "none",
              borderRadius: 6,
              backgroundColor: "#111827",
              color: "#ffffff",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            Stampa
          </button>
        </div>

        {caricamento ? (
          <p>Caricamento dati...</p>
        ) : Object.keys(dati).length === 0 ? (
          <p>Nessun ordine in bozza per Andrea.</p>
        ) : (
          <div
            style={{
              border: "1px solid #000000",
              borderBottom: "none",
            }}
          >
            {Object.entries(dati).map(([cliente, prodotti]) => (
              <div
                key={cliente}
                style={{
                  display: "grid",
                  gridTemplateColumns: "240px 1fr",
                  borderBottom: "1px solid #000000",
                  alignItems: "stretch",
                }}
              >
                <div
                  style={{
                    padding: "10px 12px",
                    fontWeight: "bold",
                    borderRight: "1px solid #000000",
                    wordBreak: "break-word",
                    display: "flex",
                    alignItems: "center",
                    fontSize: 13,
                    textTransform: "uppercase",
                  }}
                >
                  {cliente}
                </div>

                <div
                  style={{
                    padding: "10px 12px",
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    rowGap: 8,
                    columnGap: 0,
                    fontSize: 13,
                    lineHeight: 1.35,
                  }}
                >
                  {prodotti.map((p, index) => (
                    <span
                      key={`${cliente}-${index}`}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        marginRight: 12,
                      }}
                    >
                      <strong style={{ marginRight: 4 }}>
                        {p.quantita} {p.unita}
                      </strong>
                      <span>{p.nome}</span>
                      {index !== prodotti.length - 1 && (
                        <span style={{ marginLeft: 12, marginRight: 4 }}>
                          •
                        </span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function StampaAndreaPage() {
  return (
    <Suspense fallback={<p>Caricamento...</p>}>
      <StampaAndreaContent />
    </Suspense>
  );
}