"use client";

import { Suspense, useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

function StampaRaffaeleContent() {
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
  ordine.cliente_nome_manuale ||
  clientiMap[ordine.cliente_id] ||
  "Cliente sconosciuto";

      const righeOrdine = (righe || []).filter(
        (r) => r.ordine_id === ordine.id
      );

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
            note: r.note || "",
          });
        });

        risultato[clienteNome].sort((a, b) =>
          a.nome.localeCompare(b.nome, "it")
        );
      }
    });

    const dataOrdini =
      (ordini || []).find((ordine) => ordine.data_operativa)
        ?.data_operativa || "senza-data";

    let ordineSalvato = [];

    if (/^\d{4}-\d{2}-\d{2}$/.test(dataOrdini)) {
      const { data: layoutSalvato, error: layoutError } =
        await supabase
          .from("stampa_totale_layout")
          .select("ordine_andrea")
          .eq("data_operativa", dataOrdini)
          .maybeSingle();

      if (
        !layoutError &&
        Array.isArray(layoutSalvato?.ordine_andrea)
      ) {
        ordineSalvato = layoutSalvato.ordine_andrea;
      } else {
        if (layoutError) {
          console.error(
            "Errore lettura ordine Raffaele da Supabase:",
            layoutError
          );
        }

        try {
          ordineSalvato = JSON.parse(
            localStorage.getItem(
              "ordine-stampe-" + dataOrdini
            ) ||
              localStorage.getItem("ordine-stampe-ultimo") ||
              "[]"
          );
        } catch (errore) {
          ordineSalvato = [];
        }
      }
    }

    const posizioneCliente = new Map(
      ordineSalvato.map((cliente, index) => [cliente, index])
    );

    const risultatoOrdinato = Object.fromEntries(
      Object.entries(risultato).sort((a, b) => {
        const posizioneA = posizioneCliente.has(a[0])
          ? posizioneCliente.get(a[0])
          : 999999;

        const posizioneB = posizioneCliente.has(b[0])
          ? posizioneCliente.get(b[0])
          : 999999;

        return (
          posizioneA - posizioneB ||
          a[0].localeCompare(b[0], "it")
        );
      })
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
          <h1 style={{ margin: 0, fontSize: 20 }}>
            Preparazione pesce - Ordini in bozza
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

        {caricamento ? (
          <p>Caricamento dati...</p>
        ) : Object.keys(dati).length === 0 ? (
          <p>Nessun ordine in bozza per preparazione pesce.</p>
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
                }}
              >
                <div
                  style={{
                    fontWeight: "bold",
                    fontSize: 12,
                    textTransform: "uppercase",
                    borderBottom: "1px solid #000000",
                    paddingBottom: 4,
                    marginBottom: 6,
                  }}
                >
                  {cliente}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {prodotti.map((p, i) => (
                    <div
                      key={`${cliente}-${i}`}
                      style={{
                        borderBottom:
                          i !== prodotti.length - 1
                            ? "1px dotted #cfcfcf"
                            : "none",
                        paddingBottom: 4,
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 700,
                          wordBreak: "break-word",
                        }}
                      >
                        {p.quantita} {p.unita} {p.nome}
                        {p.note ? ` — Nota: ${p.note}` : ""}
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