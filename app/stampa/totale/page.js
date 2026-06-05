"use client";

import { Suspense, useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

const COLONNE_PER_PAGINA = 8;
const RIGHE_PER_PAGINA = 7;
const CELLE_PER_PAGINA = COLONNE_PER_PAGINA * RIGHE_PER_PAGINA;
const RIGHE_PRODOTTO_PER_CELLA = 4;

function chunkArray(array, size) {
  const risultato = [];
  for (let i = 0; i < array.length; i += size) {
    risultato.push(array.slice(i, i + size));
  }
  return risultato;
}

function formatDataOra(dataString) {
  if (!dataString) return "-";

  const data = new Date(dataString);

  return data.toLocaleString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StampaTotaleContent() {
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
        .select("id, nome, ordine_visualizzazione")
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
        ordine.cliente_nome_manuale ||
        clientiMap[ordine.cliente_id] ||
        "Cliente sconosciuto";

      const righeOrdine = (righe || []).filter(
        (r) => r.ordine_id === ordine.id
      );

      if (righeOrdine.length > 0) {
        if (!risultato[clienteNome]) {
          risultato[clienteNome] = [];
        }

        righeOrdine.forEach((r) => {
          risultato[clienteNome].push({
            nome: prodottiMap[r.prodotto_id]?.nome || "Prodotto sconosciuto",
            ordine_visualizzazione:
              prodottiMap[r.prodotto_id]?.ordine_visualizzazione ?? 9999,
            quantita: r.quantita,
            unita: r.unita,
            note: r.note || "",
          });
        });

        risultato[clienteNome].sort(
          (a, b) =>
            a.ordine_visualizzazione - b.ordine_visualizzazione ||
            a.nome.localeCompare(b.nome, "it")
        );
      }
    });

    const risultatoOrdinato = Object.fromEntries(
      Object.entries(risultato).sort((a, b) =>
        a[0].localeCompare(b[0], "it")
      )
    );

    setDati(risultatoOrdinato);
    setCaricamento(false);
  }

  function stampaPagina() {
    window.print();
  }

  const clientiArray = Object.entries(dati).map(([cliente, prodotti]) => ({
    cliente,
    prodotti,
  }));

  const celle = [];

  clientiArray.forEach((blocco) => {
    const partiProdotti = chunkArray(
      blocco.prodotti,
      RIGHE_PRODOTTO_PER_CELLA
    );

    if (partiProdotti.length === 0) {
      celle.push({
        cliente: blocco.cliente,
        prodotti: [],
        parte: 1,
        totaleParti: 1,
      });
      return;
    }

    partiProdotti.forEach((prodotti, index) => {
      celle.push({
        cliente: blocco.cliente,
        prodotti,
        parte: index + 1,
        totaleParti: partiProdotti.length,
      });
    });
  });

  const pagine = chunkArray(celle, CELLE_PER_PAGINA);

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
          size: A4 landscape;
          margin: 5mm;
        }

        @media print {
          button,
          .no-print {
            display: none !important;
          }

          html,
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
          }

          .pagina-stampa {
          width: 287mm;
          height: 200mm;
          margin: 0 auto 0 auto;
          background: #ffffff;
          box-sizing: border-box;
          border: 1px solid #000000;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          page-break-inside: avoid;
          break-inside: avoid;
        }

          .pagina-stampa:last-child {
            page-break-after: auto;
            break-after: auto;
          }
        }

        .pagina-stampa {
          width: 287mm;
          height: 200mm;
          margin: 0 auto 0 auto;
          background: #ffffff;
          box-sizing: border-box;
          border: 1px solid #000000;
          display: flex;
          flex-direction: column;
        }

        .intestazione-stampa {
          height: 11mm;
          border-bottom: 1px solid #000000;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 5mm;
          box-sizing: border-box;
          font-size: 10px;
          font-weight: bold;
        }

        .griglia-stampa {
          flex: 1;
          display: grid;
          grid-template-columns: repeat(${COLONNE_PER_PAGINA}, 1fr);
          grid-template-rows: repeat(${RIGHE_PER_PAGINA}, 1fr);
        }

        .cella-ordine,
        .cella-vuota {
          border-right: 1px solid #000000;
          border-bottom: 1px solid #000000;
          box-sizing: border-box;
        }

        .cella-ordine:nth-child(${COLONNE_PER_PAGINA}n),
        .cella-vuota:nth-child(${COLONNE_PER_PAGINA}n) {
          border-right: none;
        }

        .cella-ordine {
          padding: 2.5mm;
          overflow: hidden;
          font-size: 9.2px;
          line-height: 1.15;
        }

        .cliente {
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          border-bottom: 1px solid #000000;
          padding-bottom: 1.5mm;
          margin-bottom: 1.5mm;
          min-height: 8mm;
          display: flex;
          flex-direction: column;
          justify-content: center;
          word-break: break-word;
        }

        .continua {
          display: none !important;
        }

        .riga-prodotto {
          display: flex; align-items: flex-start; gap: 0.8mm;
          border-bottom: none !important;
          padding: 0.25mm 0;
          min-height: 3mm;
        }

        .quantita {
          font-weight: bold;
          white-space: nowrap;
        }

        .prodotto {
          word-break: break-word;
        }

        .nota-riga {
          font-style: italic;
          font-size: 7.5px;
        }
      `}</style>

      <div className="no-print" style={{ maxWidth: 1200, margin: "0 auto" }}>
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
          <h1 style={{ margin: 0, fontSize: 20 }}>
            Stampa Totale - Griglia Orizzontale
          </h1>

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
      </div>

      {caricamento ? (
        <p>Caricamento dati...</p>
      ) : celle.length === 0 ? (
        <p>Nessun ordine in bozza.</p>
      ) : (
        pagine.map((pagina, indexPagina) => {
          const celleVuote = CELLE_PER_PAGINA - pagina.length;

          return (
            <div className="pagina-stampa" key={`pagina-${indexPagina}`}>
              <div className="intestazione-stampa">
                <div>STAMPA TOTALE â€” ORDINI IN BOZZA</div>
                <div>Generata: {formatDataOra(new Date().toISOString())}</div>
                <div>
                  Pagina {indexPagina + 1} di {pagine.length}
                </div>
              </div>

              <div className="griglia-stampa">
                {pagina.map((cella, indexCella) => (
                  <div
                    className="cella-ordine"
                    key={`${cella.cliente}-${cella.parte}-${indexCella}`}
                  >
                    <div className="cliente">
                      <div>{cella.cliente}</div>

                      {cella.totaleParti > 1 ? (
                        <div className="continua">
                          continuazione {cella.parte}
                        </div>
                      ) : null}
                    </div>

                    {cella.prodotti.map((p, i) => (
                      <div
                        className="riga-prodotto"
                        key={`${cella.cliente}-${cella.parte}-${i}`}
                      >
                        <div className="quantita">
                          {p.quantita} {p.unita}
                        </div>

                        <div className="prodotto">
                          {p.nome}
                          {p.note ? (
                            <div className="nota-riga">Nota: {p.note}</div>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}

                {Array.from({ length: celleVuote }).map((_, i) => (
                  <div className="cella-vuota" key={`vuota-${i}`} />
                ))}
              </div>
            </div>
          );
        })
      )}
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



