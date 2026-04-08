"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
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

function StampaRaffaeleContent() {
  const searchParams = useSearchParams();
  const dataParam = searchParams.get("data");

  const [dati, setDati] = useState({});
  const [caricamento, setCaricamento] = useState(true);

  useEffect(() => {
    caricaDati();
  }, [dataParam]);

  async function caricaDati() {
    setCaricamento(true);

    const dataOggi = dataParam || getDataOperativaOggi();

    const { data: ordini, error: ordiniError } = await supabase
      .from("ordini")
      .select("*")
      .eq("data_operativa", dataOggi)
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

      const righeRaffaele = righeOrdine.filter(
        (r) => prodottiMap[r.prodotto_id]?.stampa === "RAFFAELE"
      );

      if (righeRaffaele.length > 0) {
        if (!risultato[clienteNome]) {
          risultato[clienteNome] = [];
        }

        righeRaffaele.forEach((r) => {
          risultato[clienteNome].push({
            nome: prodottiMap[r.prodotto_id]?.nome || "Prodotto sconosciuto",
            quantita: r.quantita,
            unita: r.unita,
          });
        });

        risultato[clienteNome].sort((a, b) =>
          a.nome.localeCompare(b.nome, "it")
        );
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

  const dataRiferimento = dataParam || getDataOperativaOggi();

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
          <div>
            <h1 style={{ margin: 0, fontSize: 20 }}>Stampa Raffaele</h1>
            <div style={{ fontSize: 13, marginTop: 4 }}>
              Data operativa: {dataRiferimento}
            </div>
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
          <p>Nessun dato per Raffaele nella data selezionata.</p>
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
                    gap: 10,
                    fontSize: 14,
                    lineHeight: 1.6,
                  }}
                >
                  {prodotti.map((p, i) => (
                    <div
                      key={`${cliente}-${i}`}
                      style={{
                        paddingBottom: 6,
                        marginBottom: 8,
                        borderBottom:
                          i !== prodotti.length - 1
                            ? "1px dotted #cfcfcf"
                            : "none",
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 700,
                          wordBreak: "break-word",
                          lineHeight: 1.05,
                        }}
                      >
                        {p.quantita} {p.unita} {p.nome}
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

export default function StampaRaffaelePage() {
  return (
    <Suspense fallback={<p>Caricamento...</p>}>
      <StampaRaffaeleContent />
    </Suspense>
  );
}