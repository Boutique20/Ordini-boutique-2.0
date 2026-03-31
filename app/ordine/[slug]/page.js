"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";

const CATEGORY_LABELS = {
  P: "PESCE FRESCO",
  "P/L": "PESCE FRESCO LAVORATO",
  FDM: "FRUTTI DI MARE",
  "FDM/L": "FRUTTI DI MARE LAVORATI",
  C: "CONGELATO",
  OST: "OSTRICHE",
};

const CATEGORY_ORDER = ["C", "FDM", "FDM/L", "P", "P/L", "OST"];

const ORDINE_NOMI = [
  "SCAMPO 0/5",
  "SCAMPO 5/10",
  "SCAMPO 10/15",
  "SCAMPO 15/20",
  "SCAMPO 20/30",
  "SCAMPO 30/40",

  "ORATA 3/4",
  "ORATA 4/6",
  "ORATA 6/8",
  "ORATA 1000",
  "ORATA 1200",
  "ORATA 1500",
  "ORATA ORBETELLO",

  "SPIGOLA 3/4",
  "SPIGOLA 4/6",
  "SPIGOLA 6/8",
  "SPIGOLA 1000",
  "SPIGOLA 1200",
  "SPIGOLA 1500",
  "SPIGOLA 2000+",
  "SPIGOLA ORBETELLO",
];

function normalizeName(nome) {
  return (nome || "").replace(/\s+/g, " ").trim().toUpperCase();
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

function getOrdineNomeProdotto(nome) {
  const nomeNorm = normalizeName(nome);
  const indice = ORDINE_NOMI.findIndex((item) => item === nomeNorm);
  return indice === -1 ? 999999 : indice;
}

function confrontaProdotti(a, b) {
  const ordineA = getOrdineNomeProdotto(a.nome);
  const ordineB = getOrdineNomeProdotto(b.nome);

  if (ordineA !== ordineB) {
    return ordineA - ordineB;
  }

  const ordineVisualA =
    typeof a.ordine_visualizzazione === "number"
      ? a.ordine_visualizzazione
      : Number.isFinite(Number(a.ordine_visualizzazione))
      ? Number(a.ordine_visualizzazione)
      : 999999;

  const ordineVisualB =
    typeof b.ordine_visualizzazione === "number"
      ? b.ordine_visualizzazione
      : Number.isFinite(Number(b.ordine_visualizzazione))
      ? Number(b.ordine_visualizzazione)
      : 999999;

  if (ordineVisualA !== ordineVisualB) {
    return ordineVisualA - ordineVisualB;
  }

  return (a.nome || "").localeCompare(b.nome || "", "it");
}

const UNITA_FALLBACK = {
  "ASTICE CONGELATO": ["KG", "PZ"],
  "FILETTO BACCALA": ["KG", "CT"],
  "GAMBERO ECUADOR SGUSCIATO": ["KG", "CT"],
  "GAMBERO L1": ["KG", "CT"],
  "GAMBERO ROSSO 1": ["KG"],
  "GAMBERO ROSSO 2": ["KG"],
  "GAMBERO ROSSO 3": ["KG"],
  "GAMBERO ROSSO 4": ["KG"],
  "GAMBERO ROSSO 5": ["KG"],
  "GAMBERO VIOLA 1": ["KG"],
  "GAMBERO VIOLA 2": ["KG"],
  "GAMBERO VIOLA 3": ["KG"],
  "GAMBERO VIOLA 4": ["KG"],
  "GAMBERO VIOLA 5": ["KG"],
  "MAZZANCOLLE MAKUBA 1": ["KG"],
  "MAZZANCOLLE MAKUBA 2": ["KG"],
  "MAZZANCOLLE MAKUBA 3": ["KG"],
  "MAZZANCOLLE MAKUBA 4": ["KG"],
  "POLPO T5": ["KG", "CT"],
  "POLPO T6": ["KG", "CT"],
  "POLPO T7": ["KG", "CT"],
  "POLPO T8": ["KG", "CT"],
  "POLPO T9": ["KG", "CT"],
  "SCAMPO 0/5": ["KG"],
  "SCAMPO 5/10": ["KG"],
  "SCAMPO 10/15": ["KG"],
  "SCAMPO 15/20": ["KG"],
  "SCAMPO 20/30": ["KG"],
  "SCAMPO 30/40": ["KG"],
  "SEPPIA PULITA TAGLIATA X CUCINA": ["KG"],
  "SEPPIA SPIEDINO": ["KG"],

  "BULLI": ["KG"],
  "CANESTRELLO": ["KG"],
  "CANNELLO": ["KG"],
  "COZZA NERA": ["KG"],
  "COZZA PELOSA": ["KG"],
  "FASOLARI": ["KG"],
  "LUPINI": ["KG"],
  "MUSSOLI": ["KG"],
  "NOCE BIANCA": ["KG"],
  "NOCE ROSSA": ["KG"],
  "OSTRICA CONCAVA": ["KG", "PZ"],
  "OSTRICA PERLE BY BOUTIQUE": ["KG", "CEST"],
  "VONGOLA VERACE": ["KG"],

  "CALAMARETTO": ["KG", "PZ"],
  "ALLIEVI": ["KG", "PZ"],
  "COZZA FRUTTO NETTO APERTA": ["KG", "PZ"],
  "COZZA MEZZO GUSCIO APERTA": ["KG", "PZ"],
  "COZZA PELOSA APERTA": ["KG", "PZ"],
  "FASOLARI APERTI": ["KG", "PZ"],
  "GAMBERO ROSSO X CRUDO 3": ["KG", "PZ"],
  "GAMBERO ROSSO X CRUDO 4": ["KG", "PZ"],
  "NOCE BIANCA MEZZO GUSCIO APERTA": ["KG", "PZ"],
  "NOCE ROSSA MEZZO GUSCIO APERTA": ["KG", "PZ"],
  "POLIPETTO": ["KG"],
  "RICCI": ["KG", "PZ"],
  "SCAMPO 16/20 X CRUDO": ["KG", "PZ"],
  "SCAMPO 20/30 X CRUDO": ["KG", "PZ"],
  "TAGLIATELLA": ["KG"],
  "VONGOLA APERTA": ["KG", "PZ"],

  "CICALA/CANOCCHIA": ["KG", "PZ"],
  "CICALA GRECA": ["KG", "PZ"],
  "ARAGOSTA": ["KG", "PZ"],
  "ASTICI BLU": ["KG", "PZ"],
  "DENTICE LOCALE": ["KG", "PZ"],
  "ORATA LOCALE": ["KG", "PZ"],
  "SPIGOLA LOCALE": ["KG", "PZ"],
  "ALICI": ["KG", "CASSA"],
  "ASTICE FRESCO": ["KG", "PZ"],
  "CALAMARO FRESCO": ["KG", "PZ"],
  "CERNIA": ["KG", "PZ"],
  "DENTICE": ["KG", "PZ"],
  "FILONE DI SPADA": ["KG", "PZ"],
  "FRITTURA": ["KG"],
  "GALLINELLA": ["KG", "PZ"],
  "MAZZANCOLLE LOCALE": ["KG", "PZ"],
  "MERLUZZO": ["KG", "PZ"],
  "OMBRINA": ["KG", "PZ"],
  "ORATA 1000": ["KG", "PZ"],
  "ORATA 1200": ["KG", "PZ"],
  "ORATA 1500": ["KG", "PZ"],
  "ORATA 3/4": ["KG", "PZ"],
  "ORATA 4/6": ["KG", "PZ"],
  "ORATA 6/8": ["KG", "PZ"],
  "ORATA ORBETELLO": ["KG", "PZ"],
  "RANA PESCATRICE": ["KG", "PZ"],
  "RICCIOLA": ["KG", "PZ"],
  "RICCIOLA 800/1500": ["KG", "PZ"],
  "ROMBO": ["KG", "PZ"],
  "SALMONE": ["KG", "PZ"],
  "SAN PIETRO": ["KG", "PZ"],
  "SARAGO 1": ["KG", "PZ"],
  "SARAGO 2": ["KG", "PZ"],
  "SCORFANO LOCALE": ["KG", "PZ"],
  "SCORFANO MAROCCO": ["KG", "PZ"],
  "SCORFANO SENEGAL": ["KG", "PZ"],
  "SEPPIA FRESCA": ["KG", "PZ"],
  "SGOMBRO": ["KG", "PZ"],
  "SOGLIOLA": ["KG", "PZ"],
  "SPIGOLA 3/4": ["KG", "PZ"],
  "SPIGOLA 4/6": ["KG", "PZ"],
  "SPIGOLA 6/8": ["KG", "PZ"],
  "SPIGOLA 1000": ["KG", "PZ"],
  "SPIGOLA 1200": ["KG", "PZ"],
  "SPIGOLA 1500": ["KG", "PZ"],
  "SPIGOLA 2000+": ["KG", "PZ"],
  "SPIGOLA ORBETELLO": ["KG", "PZ"],
  "TONNO": ["KG", "PZ"],
  "TRIGLIA": ["KG", "PZ"],
};

function getDataOperativa() {
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

function getColoreStato(stato) {
  switch (stato) {
    case "bozza":
      return "#94a3b8";
    case "lavorazione":
      return "#f59e0b";
    case "pronto":
      return "#3b82f6";
    case "consegnato":
      return "#22c55e";
    default:
      return "#94a3b8";
  }
}

export default function OrdineClientePage() {
  const params = useParams();
  const token = params?.slug;

  const [cliente, setCliente] = useState(null);
  const [prodotti, setProdotti] = useState([]);
  const [note, setNote] = useState("");
  const [caricamento, setCaricamento] = useState(true);
  const [invioInCorso, setInvioInCorso] = useState(false);
  const [storicoOrdini, setStoricoOrdini] = useState([]);
  const [ricerca, setRicerca] = useState("");
  const [mostraStorico, setMostraStorico] = useState(false);

  const [quantita, setQuantita] = useState({});
  const [unitaProdotti, setUnitaProdotti] = useState({});
  const [unitaSelezionate, setUnitaSelezionate] = useState({});

  useEffect(() => {
    if (token) {
      caricaDati();
    }
  }, [token]);

  async function caricaDati() {
    setCaricamento(true);

    const { data: clienteData, error: clienteError } = await supabase
      .from("clienti")
      .select("*")
      .eq("access_token", token)
      .single();

    if (clienteError || !clienteData) {
      console.error("Errore cliente:", clienteError);
      alert("Cliente non trovato");
      setCaricamento(false);
      return;
    }

    const { data: prodottiData, error: prodottiError } = await supabase
      .from("prodotti_v2")
      .select("*")
      .order("categoria", { ascending: true })
      .order("ordine_visualizzazione", { ascending: true, nullsFirst: false })
      .order("nome", { ascending: true });

    if (prodottiError) {
      console.error("Errore prodotti:", prodottiError);
      alert(JSON.stringify(prodottiError, null, 2));
      setCaricamento(false);
      return;
    }

    const prodottiOrdinati = [...(prodottiData || [])].sort(confrontaProdotti);

    const { data: unitaData, error: unitaError } = await supabase
      .from("prodotti_unita")
      .select("prodotto_id, unita");

    if (unitaError) {
      console.error("Errore unità:", unitaError);
      alert(JSON.stringify(unitaError, null, 2));
      setCaricamento(false);
      return;
    }

    const mappaUnita = {};
    for (const riga of unitaData || []) {
      if (!mappaUnita[riga.prodotto_id]) {
        mappaUnita[riga.prodotto_id] = [];
      }
      mappaUnita[riga.prodotto_id].push(riga.unita);
    }

    const defaultUnita = {};
    for (const prodotto of prodottiOrdinati || []) {
      const nomeNorm = normalizeName(prodotto.nome);
      const fallback =
        UNITA_FALLBACK[nomeNorm] || [prodotto.unita_vendita || "KG"];
      const opzioni = mappaUnita[prodotto.id] || fallback;
      defaultUnita[prodotto.id] = opzioni[0];
      mappaUnita[prodotto.id] = opzioni;
    }

    const { data: ordiniData, error: ordiniError } = await supabase
      .from("ordini")
      .select("*")
      .eq("cliente_id", clienteData.id)
      .order("created_at", { ascending: false });

    if (ordiniError) {
      console.error("Errore storico ordini:", ordiniError);
      alert(JSON.stringify(ordiniError, null, 2));
      setCaricamento(false);
      return;
    }

  // PRENDO SOLO GLI ID DEGLI ORDINI DEL CLIENTE
const idsOrdini = (ordiniData || []).map((ordine) => ordine.id);

let righeData = [];
let righeError = null;

// SE CI SONO ORDINI → PRENDO SOLO LE RIGHE RELATIVE
if (idsOrdini.length > 0) {
  const response = await supabase
    .from("righe_ordine")
    .select("*")
    .in("ordine_id", idsOrdini);

  righeData = response.data || [];
  righeError = response.error;
}

// GESTIONE ERRORE
if (righeError) {
  console.error("Errore righe storico:", righeError);
  alert(JSON.stringify(righeError, null, 2));
  setCaricamento(false);
  return;
}
    const prodottiMap = {};
    prodottiOrdinati.forEach((p) => {
      prodottiMap[p.id] = p;
    });

    const righePerOrdine = {};
    (righeData || []).forEach((riga) => {
      if (!righePerOrdine[riga.ordine_id]) {
        righePerOrdine[riga.ordine_id] = [];
      }

      righePerOrdine[riga.ordine_id].push({
        ...riga,
        prodotto_nome:
          prodottiMap[riga.prodotto_id]?.nome || "Prodotto sconosciuto",
      });
    });

    const storicoFinale = (ordiniData || []).map((ordine) => ({
      ...ordine,
      righe: righePerOrdine[ordine.id] || [],
    }));

    setCliente(clienteData);
    setProdotti(prodottiOrdinati);
    setUnitaProdotti(mappaUnita);
    setUnitaSelezionate(defaultUnita);
    setStoricoOrdini(storicoFinale);
    setCaricamento(false);
  }

  function aggiornaQuantita(prodottoId, valore) {
    setQuantita((prev) => ({
      ...prev,
      [prodottoId]: valore,
    }));
  }

  function aggiornaUnita(prodottoId, valore) {
    setUnitaSelezionate((prev) => ({
      ...prev,
      [prodottoId]: valore,
    }));
  }

  const prodottiFiltrati = useMemo(() => {
    const testo = ricerca.trim().toLowerCase();

    if (!testo) return prodotti;

    return prodotti.filter((prodotto) =>
      (prodotto.nome || "").toLowerCase().includes(testo)
    );
  }, [prodotti, ricerca]);

  const prodottiPerCategoria = useMemo(() => {
    const gruppi = {};

    for (const prodotto of prodottiFiltrati) {
      const codice = prodotto.categoria || "ALTRO";
      if (!gruppi[codice]) gruppi[codice] = [];
      gruppi[codice].push(prodotto);
    }

    const gruppiOrdinati = {};
    for (const categoria of CATEGORY_ORDER) {
      if (gruppi[categoria]) {
        gruppiOrdinati[categoria] = gruppi[categoria];
      }
    }

    for (const categoria of Object.keys(gruppi)) {
      if (!gruppiOrdinati[categoria]) {
        gruppiOrdinati[categoria] = gruppi[categoria];
      }
    }

    return gruppiOrdinati;
  }, [prodottiFiltrati]);

  const riepilogoOrdine = useMemo(() => {
    return prodotti
      .filter((p) => {
        const valore = quantita[p.id];
        return valore !== undefined && valore !== "" && Number(valore) > 0;
      })
      .map((p) => ({
        id: p.id,
        nome: p.nome,
        quantita: Number(quantita[p.id]),
        unita: unitaSelezionate[p.id] || "KG",
      }));
  }, [prodotti, quantita, unitaSelezionate]);

  async function inviaOrdine() {
    if (!cliente) {
      alert("Cliente non trovato");
      return;
    }

    if (riepilogoOrdine.length === 0) {
      alert("Inserisci almeno una quantità");
      return;
    }

    if (!confirm("Confermi l'invio dell'ordine?")) {
      return;
    }

    setInvioInCorso(true);

    const dataOperativa = getDataOperativa();

    const { data: ordine, error: ordineError } = await supabase
      .from("ordini")
      .insert({
        cliente_id: cliente.id,
        note_generali: note || null,
        stato: "bozza",
        data_operativa: dataOperativa,
      })
      .select()
      .single();

    if (ordineError) {
      console.error("Errore ordine:", ordineError);
      alert(JSON.stringify(ordineError, null, 2));
      setInvioInCorso(false);
      return;
    }

    const righeFinali = riepilogoOrdine.map((r) => ({
      ordine_id: ordine.id,
      prodotto_id: r.id,
      quantita: r.quantita,
      unita: r.unita,
      note: null,
    }));

    const { error: righeError } = await supabase
      .from("righe_ordine")
      .insert(righeFinali);

    if (righeError) {
      console.error("Errore righe ordine:", righeError);
      alert(JSON.stringify(righeError, null, 2));
      setInvioInCorso(false);
      return;
    }

    alert(
      "Ordine ricevuto ✅ Stiamo verificando la disponibilità e procediamo con la preparazione."
    );

    setQuantita({});
    setNote("");

    const resetUnita = {};
    for (const prodotto of prodotti) {
      const nomeNorm = normalizeName(prodotto.nome);
      const fallback =
        UNITA_FALLBACK[nomeNorm] || [prodotto.unita_vendita || "KG"];
      const opzioni = unitaProdotti[prodotto.id] || fallback;
      resetUnita[prodotto.id] = opzioni[0];
    }
    setUnitaSelezionate(resetUnita);

    await caricaDati();

    setInvioInCorso(false);
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #0b2d3b 0%, #0f172a 100%)",
        padding: 20,
        fontFamily: "Arial, sans-serif",
        color: "#ffffff",
      }}
    >
      <div style={{ maxWidth: 980, margin: "0 auto" }}>
        <div
          style={{
            background: "linear-gradient(90deg, #0ea5e9 0%, #0284c7 100%)",
            borderRadius: 18,
            padding: 20,
            marginBottom: 24,
            boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-start",
              gap: 20,
              textAlign: "left",
            }}
          >
            <img
              src="/logo-boutique.jpg"
              alt="Logo Boutique dei Frutti di Mare"
              style={{
                width: 110,
                height: 110,
                objectFit: "contain",
                borderRadius: 14,
                backgroundColor: "#ffffff",
                padding: 8,
                flexShrink: 0,
              }}
            />

            <div>
              <h1
                style={{
                  margin: 0,
                  fontSize: 34,
                  fontWeight: "bold",
                  color: "#ffffff",
                  letterSpacing: 0.3,
                  lineHeight: 1.1,
                }}
              >
                Boutique 2.0
              </h1>

              <div
                style={{
                  marginTop: 6,
                  fontSize: 17,
                  color: "#e0f2fe",
                  fontWeight: 600,
                }}
              >
                Selezione giornaliera
              </div>

              {cliente && (
                <div
                  style={{
                    marginTop: 10,
                    fontSize: 24,
                    fontWeight: "bold",
                    color: "#ffffff",
                    lineHeight: 1.1,
                  }}
                >
                  {cliente.nome}
                </div>
              )}
            </div>
          </div>
        </div>

        <div
          style={{
            backgroundColor: "rgba(15, 23, 42, 0.45)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 18,
            padding: 22,
            boxShadow: "0 12px 30px rgba(0,0,0,0.18)",
            backdropFilter: "blur(6px)",
          }}
        >
          <div style={{ marginBottom: 24 }}>
            <div
              style={{
                fontSize: 22,
                fontWeight: "bold",
                marginBottom: 12,
                color: "#7dd3fc",
              }}
            >
              Cerca prodotto
            </div>

            <input
              type="text"
              value={ricerca}
              onChange={(e) => setRicerca(e.target.value)}
              placeholder="Scrivi il nome del prodotto..."
              style={{
                width: "100%",
                padding: 14,
                borderRadius: 12,
                border: "2px solid #475569",
                backgroundColor: "#0f172a",
                color: "#ffffff",
                fontSize: 15,
                boxSizing: "border-box",
                outline: "none",
              }}
            />
          </div>

          {caricamento ? (
            <p style={{ fontSize: 18 }}>Caricamento...</p>
          ) : Object.keys(prodottiPerCategoria).length === 0 ? (
            <p style={{ color: "#cbd5e1" }}>Nessun prodotto trovato.</p>
          ) : (
            Object.keys(prodottiPerCategoria).map((categoria) => (
              <div key={categoria} style={{ marginBottom: 34 }}>
                <div
                  style={{
                    fontSize: 24,
                    fontWeight: "bold",
                    marginTop: 10,
                    marginBottom: 14,
                    color: "#7dd3fc",
                    borderBottom: "2px solid rgba(125, 211, 252, 0.35)",
                    paddingBottom: 8,
                    letterSpacing: 0.5,
                  }}
                >
                  {CATEGORY_LABELS[categoria] || categoria}
                </div>

                <div
                  style={{ display: "flex", flexDirection: "column", gap: 10 }}
                >
                  {prodottiPerCategoria[categoria].map((p) => {
                    const nomeNorm = normalizeName(p.nome);
                    const opzioniUnita =
                      unitaProdotti[p.id] ||
                      UNITA_FALLBACK[nomeNorm] ||
                      [p.unita_vendita || "KG"];

                    return (
                      <div
                        key={p.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: 14,
                          padding: "12px 14px",
                          borderRadius: 12,
                          border: "1px solid rgba(255,255,255,0.10)",
                          backgroundColor: "rgba(255,255,255,0.04)",
                          flexWrap: "wrap",
                        }}
                      >
                        <div
                          style={{
                            flex: 1,
                            minWidth: 240,
                            fontSize: 17,
                            fontWeight: 600,
                            color: "#f8fafc",
                          }}
                        >
                          {p.nome}
                        </div>

                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            flexWrap: "wrap",
                          }}
                        >
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            value={quantita[p.id] || ""}
                            onChange={(e) =>
                              aggiornaQuantita(p.id, e.target.value)
                            }
                            placeholder="Qtà"
                            style={{
                              width: 95,
                              padding: "12px 10px",
                              borderRadius: 10,
                              border: "2px solid #475569",
                              backgroundColor: "#0f172a",
                              color: "#ffffff",
                              fontSize: 16,
                              textAlign: "center",
                              outline: "none",
                            }}
                          />

                          {opzioniUnita.length === 1 ? (
                            <div
                              style={{
                                minWidth: 72,
                                padding: "12px 10px",
                                borderRadius: 10,
                                border: "2px solid #334155",
                                backgroundColor: "#1e293b",
                                color: "#e2e8f0",
                                textAlign: "center",
                                fontWeight: "bold",
                                fontSize: 15,
                              }}
                            >
                              {opzioniUnita[0]}
                            </div>
                          ) : (
                            <select
                              value={unitaSelezionate[p.id] || opzioniUnita[0]}
                              onChange={(e) =>
                                aggiornaUnita(p.id, e.target.value)
                              }
                              style={{
                                minWidth: 100,
                                padding: "12px 10px",
                                borderRadius: 10,
                                border: "2px solid #475569",
                                backgroundColor: "#0f172a",
                                color: "#ffffff",
                                fontSize: 15,
                                fontWeight: "bold",
                                outline: "none",
                              }}
                            >
                              {opzioniUnita.map((u) => (
                                <option key={u} value={u}>
                                  {u}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}

          <div style={{ marginTop: 36 }}>
            <div
              style={{
                fontSize: 22,
                fontWeight: "bold",
                marginBottom: 12,
                color: "#7dd3fc",
              }}
            >
              Note finali
            </div>

            <textarea
              rows="4"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              style={{
                width: "100%",
                padding: 14,
                borderRadius: 12,
                border: "2px solid #475569",
                backgroundColor: "#0f172a",
                color: "#ffffff",
                fontSize: 15,
                resize: "vertical",
                boxSizing: "border-box",
              }}
              placeholder="Scrivi qui eventuali note generali"
            />
          </div>

          <div style={{ marginTop: 36 }}>
            <div
              style={{
                fontSize: 22,
                fontWeight: "bold",
                marginBottom: 12,
                color: "#7dd3fc",
              }}
            >
              Riepilogo ordine
            </div>

            {riepilogoOrdine.length === 0 ? (
              <p style={{ color: "#cbd5e1" }}>Nessun prodotto selezionato.</p>
            ) : (
              <div
                style={{
                  borderRadius: 14,
                  padding: 16,
                  backgroundColor: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.10)",
                }}
              >
                {riepilogoOrdine.map((riga) => (
                  <div key={riga.id} style={{ marginBottom: 8, fontSize: 16 }}>
                    - {riga.nome} → {riga.quantita} {riga.unita}
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={inviaOrdine}
            disabled={invioInCorso}
            style={{
              marginTop: 28,
              width: "100%",
              padding: "16px 20px",
              border: "none",
              cursor: invioInCorso ? "not-allowed" : "pointer",
              fontWeight: "bold",
              fontSize: 17,
              borderRadius: 14,
              background: invioInCorso
                ? "#64748b"
                : "linear-gradient(90deg, #0ea5e9 0%, #0284c7 100%)",
              color: "#ffffff",
              boxShadow: "0 10px 24px rgba(2,132,199,0.25)",
            }}
          >
            {invioInCorso ? "Invio in corso..." : "Invia ordine"}
          </button>
        </div>

        <div
          style={{
            marginTop: 24,
            backgroundColor: "rgba(15, 23, 42, 0.45)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 18,
            padding: 22,
            boxShadow: "0 12px 30px rgba(0,0,0,0.18)",
            backdropFilter: "blur(6px)",
          }}
        >
          <button
            onClick={() => setMostraStorico(!mostraStorico)}
            style={{
              width: "100%",
              padding: "14px 18px",
              borderRadius: 12,
              border: "none",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: 16,
              backgroundColor: "#1e293b",
              color: "#ffffff",
              marginBottom: mostraStorico ? 18 : 0,
            }}
          >
            {mostraStorico
              ? "Nascondi ordini precedenti"
              : "Visualizza ordini precedenti"}
          </button>

          {mostraStorico && (
            <>
              <div
                style={{
                  fontSize: 24,
                  fontWeight: "bold",
                  marginBottom: 16,
                  color: "#7dd3fc",
                }}
              >
                Ultimi ordini inviati
              </div>

              {storicoOrdini.length === 0 ? (
                <p style={{ color: "#cbd5e1", margin: 0 }}>
                  Nessun ordine inviato al momento.
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {storicoOrdini.map((ordine) => (
                    <div
                      key={ordine.id}
                      style={{
                        borderRadius: 14,
                        padding: 16,
                        backgroundColor: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.10)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          gap: 12,
                          flexWrap: "wrap",
                          marginBottom: 12,
                        }}
                      >
                        <div>
                          <div
                            style={{
                              fontSize: 18,
                              fontWeight: "bold",
                              color: "#f8fafc",
                              marginBottom: 6,
                            }}
                          >
                            Ordine del {formatDataOra(ordine.created_at)}
                          </div>

                          <div
                            style={{
                              fontSize: 14,
                              color: "#cbd5e1",
                              marginBottom: 4,
                            }}
                          >
                            Data operativa: {ordine.data_operativa || "-"}
                          </div>

                          {ordine.note_generali && (
                            <div
                              style={{
                                fontSize: 14,
                                color: "#cbd5e1",
                              }}
                            >
                              Note: {ordine.note_generali}
                            </div>
                          )}
                        </div>

                        <div
                          style={{
                            backgroundColor: getColoreStato(ordine.stato),
                            color: "#ffffff",
                            padding: "6px 10px",
                            borderRadius: 8,
                            fontWeight: "bold",
                            fontSize: 13,
                            textTransform: "uppercase",
                          }}
                        >
                          {ordine.stato || "bozza"}
                        </div>
                      </div>

                      {ordine.righe.length === 0 ? (
                        <p style={{ color: "#cbd5e1", margin: 0 }}>
                          Nessuna riga ordine.
                        </p>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          {ordine.righe.map((riga) => (
                            <div
                              key={riga.id}
                              style={{
                                fontSize: 15,
                                color: "#e2e8f0",
                                borderBottom: "1px solid rgba(255,255,255,0.06)",
                                paddingBottom: 6,
                              }}
                            >
                              - {riga.quantita} {riga.unita} {riga.prodotto_nome}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}