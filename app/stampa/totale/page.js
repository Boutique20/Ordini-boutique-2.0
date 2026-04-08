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

function chunkArray(array, size) {
  const risultato = [];
  for (let i = 0; i < array.length; i += size) {
    risultato.push(array.slice(i, i + size));
  }
  return risultato;
}

function StampaTotaleContent() {
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
        .select("id, nome")
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

      if (righeOrdine.length > 0) {
        if (!risultato[clienteNome]) {
          risultato[clienteNome] = [];
        }

        righeOrdine.forEach((r) => {
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

  const dataRiferimento = dataParam || getDataOperativaOggi();

  const clientiArray = Object.entries(dati).map(([cliente, prodotti]) => ({
    cliente,
    prodotti,
  }));

  const gruppi = chunkArray(clientiArray, 3);

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
            <h1 style={{ margin: 0, fontSize: 20 }}>Stampa Totale Ordini</h1>
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
        ) : clientiArray.length === 0 ? (
          <p>Nessun ordine nella data selezionata.</p>
        ) : (
          <div>
            {gruppi.map((gruppo, indexGruppo) => (
              <div
                key={indexGruppo}
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: 8,
                  marginBottom: 8,
                  alignItems: "start",
                }}
              >
                {gruppo.map((blocco) => (
                  <div
                    key={blocco.cliente}
                    style={{
                      border: "1px solid #000000",
                      minHeight: 120,
                      breakInside: "avoid",
                      pageBreakInside: "avoid",
                    }}
                  >
                    <div
                      style={{
                        borderBottom: "1px solid #000000",
                        padding: "8px 10px",
                        fontWeight: "bold",
                        fontSize: 12,
                        textTransform: "uppercase",
                        wordBreak: "break-word",
                        minHeight: 38,
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      {blocco.cliente}
                    </div>

                    <div
                      style={{
                        padding: "8px 10px",
                        fontSize: 11,
                        lineHeight: 1.25,
                      }}
                    >
                      {blocco.prodotti.map((p, i) => (
                        <div
                          key={`${blocco.cliente}-${i}`}
                          style={{
                            marginBottom: 4,
                            paddingBottom: 4,
                            borderBottom:
                              i !== blocco.prodotti.length - 1
                                ? "1px dotted #cfcfcf"
                                : "none",
                          }}
                        >
                          <strong>
                            {p.quantita} {p.unita}
                          </strong>{" "}
                          {p.nome}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {gruppo.length < 3 &&
                  Array.from({ length: 3 - gruppo.length }).map((_, i) => (
                    <div key={`vuoto-${indexGruppo}-${i}`} />
                  ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function StampaTotalePage() {
  return (
    <Suspense fallback={<p>Caricamento...</p>}>
      <StampaTotaleContent />
    </Suspense>
  );
}