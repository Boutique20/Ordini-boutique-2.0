"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

function getDataOperativaOggi() {
  const now = new Date();

  const roma = new Date(
    now.toLocaleString("en-US", { timeZone: "Europe/Rome" })
  );

  const anno = roma.getFullYear();
  const mese = roma.getMonth();
  const giorno = roma.getDate();
  const ore = roma.getHours();

  let dataBase = new Date(anno, mese, giorno);

  if (ore < 5) {
    dataBase.setDate(dataBase.getDate() - 1);
  }

  const y = dataBase.getFullYear();
  const m = String(dataBase.getMonth() + 1).padStart(2, "0");
  const d = String(dataBase.getDate()).padStart(2, "0");

  return `${y}-${m}-${d}`;
}

export default function StampaAndreaPage() {
  const [dati, setDati] = useState({});
  const [caricamento, setCaricamento] = useState(true);

  useEffect(() => {
    caricaDati();
  }, []);

  async function caricaDati() {
    setCaricamento(true);

    const dataOggi = getDataOperativaOggi();

    const { data: ordini, error: ordiniError } = await supabase
      .from("ordini")
      .select("*")
      .eq("data_operativa", dataOggi)
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

    const { data: righe, error: righeError } = await supabase
      .from("righe_ordine")
      .select("*");

    if (righeError) {
      console.error("Errore righe ordine:", righeError);
      alert("Errore nel caricamento righe ordine");
      setCaricamento(false);
      return;
    }

    const { data: prodotti, error: prodottiError } = await supabase
      .from("prodotti_v2")
      .select("id, nome, stampa");

    if (prodottiError) {
      console.error("Errore prodotti:", prodottiError);
      alert("Errore nel caricamento prodotti");
      setCaricamento(false);
      return;
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
      const clienteNome = clientiMap[ordine.cliente_id] || "Cliente sconosciuto";
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

        risultato[clienteNome].sort((a, b) => a.nome.localeCompare(b.nome, "it"));
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
        padding: 10,
        fontFamily: "Arial, sans-serif",
        backgroundColor: "#ffffff",
        color: "#000000",
        minHeight: "100vh",
      }}
    >
      <style>{`
        @page {
          size: A4 portrait;
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

      <div style={{ maxWidth: 1400, margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 10,
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <h1 style={{ margin: 0, fontSize: 20 }}>Stampa Andrea</h1>

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
          <p>Nessun dato per Andrea nella giornata operativa corrente.</p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 8,
              alignItems: "start",
            }}
          >
            {Object.entries(dati).map(([cliente, prodotti]) => (
              <div
                key={cliente}
                style={{
                  border: "1px solid #000000",
                  borderRadius: 4,
                  padding: 6,
                  backgroundColor: "#ffffff",
                  breakInside: "avoid",
                  pageBreakInside: "avoid",
                  minHeight: 0,
                }}
              >
                <div
                  style={{
                    fontWeight: "bold",
                    fontSize: 12,
                    textTransform: "uppercase",
                    borderBottom: "1px solid #000000",
                    paddingBottom: 4,
                    marginBottom: 4,
                    wordBreak: "break-word",
                    lineHeight: 1.1,
                  }}
                >
                  {cliente}
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                    fontSize: 10,
                    lineHeight: 1.1,
                  }}
                >
                  {prodotti.map((p, i) => (
                    <div
                      key={`${cliente}-${i}`}
                      style={{
                        paddingBottom: 2,
                        marginBottom: 2,
                        borderBottom:
                          i !== prodotti.length - 1 ? "1px dotted #cfcfcf" : "none",
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 700,
                          wordBreak: "break-word",
                          lineHeight: 1.05,
                        }}
                      >
                        {p.nome}
                      </div>
                      <div style={{ lineHeight: 1.05 }}>
                        {p.quantita} {p.unita}
                      </div>
                    </div>
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