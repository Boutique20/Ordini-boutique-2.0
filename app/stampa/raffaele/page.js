"use client";

import { Suspense, useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

function getDataOperativa() {
  const now = new Date();

  const roma = new Date(
    now.toLocaleString("en-US", { timeZone: "Europe/Rome" })
  );

  const y = roma.getFullYear();
  const m = String(roma.getMonth() + 1).padStart(2, "0");
  const d = String(roma.getDate()).padStart(2, "0");

  return `${y}-${m}-${d}`;
}

function formatDataConsegna(dataIso) {
  if (!dataIso) return "-";

  const [anno, mese, giorno] = dataIso.split("-").map(Number);
  const data = new Date(anno, mese - 1, giorno);

  return data.toLocaleDateString("it-IT", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function cambiaMeseIso(meseIso, spostamento) {
  const [anno, mese] = meseIso.split("-").map(Number);
  const data = new Date(anno, mese - 1 + spostamento, 1);

  const y = data.getFullYear();
  const m = String(data.getMonth() + 1).padStart(2, "0");

  return `${y}-${m}`;
}

function formatMeseCalendario(meseIso) {
  const [anno, mese] = meseIso.split("-").map(Number);
  const data = new Date(anno, mese - 1, 1);

  return data.toLocaleDateString("it-IT", {
    month: "long",
    year: "numeric",
  });
}

function getGiorniCalendario(meseIso) {
  const [anno, mese] = meseIso.split("-").map(Number);
  const primoGiorno = new Date(anno, mese - 1, 1);
  const ultimoGiorno = new Date(anno, mese, 0);

  const vuotiPrima = (primoGiorno.getDay() + 6) % 7;
  const celle = [];

  for (let i = 0; i < vuotiPrima; i++) {
    celle.push(null);
  }

  for (let giorno = 1; giorno <= ultimoGiorno.getDate(); giorno++) {
    const data = new Date(anno, mese - 1, giorno);

    const y = data.getFullYear();
    const m = String(data.getMonth() + 1).padStart(2, "0");
    const d = String(data.getDate()).padStart(2, "0");

    celle.push({
      giorno,
      iso: `${y}-${m}-${d}`,
    });
  }

  return celle;
}

function StampaRaffaeleContent() {
  const [dati, setDati] = useState({});
  const [caricamento, setCaricamento] = useState(true);
  const [dataOperativa, setDataOperativa] = useState(getDataOperativa());
  const [meseCalendario, setMeseCalendario] = useState(getDataOperativa().slice(0, 7));

  useEffect(() => {
    caricaDati(dataOperativa);
  }, [dataOperativa]);

  async function caricaDati(dataSelezionata = dataOperativa) {
    setCaricamento(true);

    const { data: ordini, error: ordiniError } = await supabase
      .from("ordini")
      .select("*")
      .eq("stato", "bozza")
      .eq("data_operativa", dataSelezionata)
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

    const dataOrdini = dataSelezionata;

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
          button, .no-print {
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
            Preparazione pesce - Ordini in bozza - {formatDataConsegna(dataOperativa)}
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

        <div
          className="no-print"
          style={{
            marginBottom: 18,
            borderRadius: 14,
            padding: 16,
            backgroundColor: "#0f172a",
            border: "1px solid rgba(14,165,233,0.45)",
            color: "#ffffff",
          }}
        >
          <div
            style={{
              fontSize: 20,
              fontWeight: "bold",
              marginBottom: 8,
              color: "#7dd3fc",
            }}
          >
            Seleziona data Raffaele
          </div>

          <div
            style={{
              fontSize: 14,
              color: "#cbd5e1",
              marginBottom: 14,
            }}
          >
            Mostra solo i prodotti Raffaele degli ordini in bozza della data selezionata.
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 10,
              marginBottom: 14,
            }}
          >
            <button
              type="button"
              onClick={() => setMeseCalendario(cambiaMeseIso(meseCalendario, -1))}
              style={{
                padding: "10px 14px",
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.18)",
                backgroundColor: "#1e293b",
                color: "#ffffff",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              ←
            </button>

            <div
              style={{
                flex: 1,
                textAlign: "center",
                fontSize: 18,
                fontWeight: "bold",
                color: "#ffffff",
                textTransform: "capitalize",
              }}
            >
              {formatMeseCalendario(meseCalendario)}
            </div>

            <button
              type="button"
              onClick={() => setMeseCalendario(cambiaMeseIso(meseCalendario, 1))}
              style={{
                padding: "10px 14px",
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.18)",
                backgroundColor: "#1e293b",
                color: "#ffffff",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              →
            </button>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: 6,
              marginBottom: 8,
            }}
          >
            {["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"].map(
              (giorno) => (
                <div
                  key={giorno}
                  style={{
                    textAlign: "center",
                    fontSize: 13,
                    fontWeight: "bold",
                    color: "#7dd3fc",
                  }}
                >
                  {giorno}
                </div>
              )
            )}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: 6,
            }}
          >
            {getGiorniCalendario(meseCalendario).map((giorno, indice) => {
              if (!giorno) {
                return <div key={`vuoto-${indice}`} />;
              }

              const selezionato = giorno.iso === dataOperativa;

              return (
                <button
                  type="button"
                  key={giorno.iso}
                  onClick={() => setDataOperativa(giorno.iso)}
                  style={{
                    minHeight: 42,
                    borderRadius: 10,
                    border: selezionato
                      ? "2px solid #ffffff"
                      : "1px solid rgba(255,255,255,0.16)",
                    backgroundColor: selezionato ? "#0284c7" : "#0f172a",
                    color: "#ffffff",
                    fontWeight: "bold",
                    fontSize: 15,
                    cursor: "pointer",
                  }}
                >
                  {giorno.giorno}
                </button>
              );
            })}
          </div>

          <div
            style={{
              marginTop: 14,
              color: "#ffffff",
              fontSize: 15,
              backgroundColor: "rgba(14,165,233,0.14)",
              border: "1px solid rgba(125,211,252,0.35)",
              borderRadius: 10,
              padding: 12,
            }}
          >
            Data visualizzata: <strong>{formatDataConsegna(dataOperativa)}</strong>
          </div>
        </div>

        {caricamento ? (
          <p>Caricamento dati...</p>
        ) : Object.keys(dati).length === 0 ? (
          <p>Nessun ordine Raffaele in bozza per la data selezionata.</p>
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
                        {p.note ? ` â€” Nota: ${p.note}` : ""}
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