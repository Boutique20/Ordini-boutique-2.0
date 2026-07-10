"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";

const CATEGORY_LABELS = {
  P: "PESCE FRESCO",
  "P/L": "PESCE FRESCO LAVORATO",
  FDM: "FRUTTI DI MARE",
  "FDM/L": "FRUTTI DI MARE LAVORATI",
  C: "CONGELATO",
  OST: "SELEZIONE OSTRICHE",
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

function normalizeName(nome) {
  return (nome || "").replace(/\s+/g, " ").trim().toUpperCase();
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

export default function OrdineManualePage() {
  const [clienteNomeManuale, setClienteNomeManuale] = useState("");
  const [prodotti, setProdotti] = useState([]);
  const [note, setNote] = useState("");
  const [caricamento, setCaricamento] = useState(true);
  const [invioInCorso, setInvioInCorso] = useState(false);
  const [ricerca, setRicerca] = useState("");

  const [quantita, setQuantita] = useState({});
  const [unitaProdotti, setUnitaProdotti] = useState({});
  const [unitaSelezionate, setUnitaSelezionate] = useState({});
  const [noteProdotti, setNoteProdotti] = useState({});
  const [righeAggiuntive, setRigheAggiuntive] = useState({});
  const [dataConsegna, setDataConsegna] = useState(getDataOperativa());
  const [meseCalendario, setMeseCalendario] = useState(getDataOperativa().slice(0, 7));

  useEffect(() => {
    caricaDati();
  }, []);

  async function caricaDati() {
    setCaricamento(true);

    const { data: prodottiData, error: prodottiError } = await supabase
      .from("prodotti_v2")
      .select("*")
      .neq("categoria", "ARCHIVIO")
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
      console.error("Errore unitÃ :", unitaError);
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

    setProdotti(prodottiOrdinati);
    setUnitaProdotti(mappaUnita);
    setUnitaSelezionate(defaultUnita);
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

  function aggiornaNotaProdotto(prodottoId, valore) {
    setNoteProdotti((prev) => ({
      ...prev,
      [prodottoId]: valore,
    }));
  }

  function aggiungiAltraQuantita(prodotto) {
    const nomeNorm = normalizeName(prodotto.nome);
    const opzioniUnita =
      unitaProdotti[prodotto.id] ||
      UNITA_FALLBACK[nomeNorm] ||
      [prodotto.unita_vendita || "KG"];

    const nuovaRiga = {
      rigaId: `${prodotto.id}-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}`,
      quantita: "",
      unita: unitaSelezionate[prodotto.id] || opzioniUnita[0] || "KG",
      note: "",
    };

    setRigheAggiuntive((prev) => ({
      ...prev,
      [prodotto.id]: [...(prev[prodotto.id] || []), nuovaRiga],
    }));
  }

  function aggiornaRigaAggiuntiva(prodottoId, rigaId, campo, valore) {
    setRigheAggiuntive((prev) => ({
      ...prev,
      [prodottoId]: (prev[prodottoId] || []).map((riga) =>
        riga.rigaId === rigaId ? { ...riga, [campo]: valore } : riga
      ),
    }));
  }

  function rimuoviRigaAggiuntiva(prodottoId, rigaId) {
    setRigheAggiuntive((prev) => ({
      ...prev,
      [prodottoId]: (prev[prodottoId] || []).filter(
        (riga) => riga.rigaId !== rigaId
      ),
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

      if (codice === "ARCHIVIO") continue;

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
    const righe = [];

    prodotti.forEach((p) => {
      const valore = quantita[p.id];

      if (valore !== undefined && valore !== "" && Number(valore) > 0) {
        righe.push({
          rigaId: `principale-${p.id}`,
          id: p.id,
          nome: p.nome,
          quantita: Number(valore),
          unita: unitaSelezionate[p.id] || "KG",
          note: noteProdotti[p.id] || "",
        });
      }

      const righeExtra = righeAggiuntive[p.id] || [];

      righeExtra.forEach((riga) => {
        if (
          riga.quantita !== undefined &&
          riga.quantita !== "" &&
          Number(riga.quantita) > 0
        ) {
          righe.push({
            rigaId: riga.rigaId,
            id: p.id,
            nome: p.nome,
            quantita: Number(riga.quantita),
            unita: riga.unita || unitaSelezionate[p.id] || "KG",
            note: riga.note || "",
          });
        }
      });
    });

    return righe;
  }, [
    prodotti,
    quantita,
    unitaSelezionate,
    noteProdotti,
    righeAggiuntive,
  ]);

  async function inviaOrdine() {
    const nomeManuale = clienteNomeManuale.trim();

    if (!nomeManuale) {
      alert("Inserisci il nome del cliente.");
      return;
    }

    if (riepilogoOrdine.length === 0) {
      alert("Inserisci almeno una quantitÃ .");
      return;
    }

    const dataOperativa = dataConsegna;

    if (!/^\d{4}-\d{2}-\d{2}$/.test(dataOperativa)) {
      alert("Seleziona una data consegna valida.");
      return;
    }

    if (!confirm(`Confermi l'inserimento dell'ordine manuale per consegna ${formatDataConsegna(dataOperativa)}?`)) {
      return;
    }

    setInvioInCorso(true);
    const { data: ordine, error: ordineError } = await supabase
      .from("ordini")
      .insert({
        cliente_id: null,
        cliente_nome_manuale: nomeManuale,
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
      note: r.note || null,
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

    try {
      await fetch("/api/telegram", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cliente: nomeManuale,
          data_operativa: dataOperativa,
        }),
      });
    } catch (error) {
      console.error("Errore notifica Telegram:", error);
    }

    alert("Ordine manuale inserito correttamente.");

    setClienteNomeManuale("");
    setQuantita({});
    setNote("");
    setNoteProdotti({});
    setRigheAggiuntive({});
    setDataConsegna(getDataOperativa());
    setMeseCalendario(getDataOperativa().slice(0, 7));

    const resetUnita = {};
    for (const prodotto of prodotti) {
      const nomeNorm = normalizeName(prodotto.nome);
      const fallback =
        UNITA_FALLBACK[nomeNorm] || [prodotto.unita_vendita || "KG"];
      const opzioni = unitaProdotti[prodotto.id] || fallback;
      resetUnita[prodotto.id] = opzioni[0];
    }

    setUnitaSelezionate(resetUnita);
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
                Inserimento ordine manuale
              </div>

              <div
                style={{
                  marginTop: 10,
                  fontSize: 24,
                  fontWeight: "bold",
                  color: "#ffffff",
                  lineHeight: 1.1,
                }}
              >
                Ordine volante / cliente non registrato
              </div>
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
              Nome cliente
            </div>

            <input
              type="text"
              value={clienteNomeManuale}
              onChange={(e) => setClienteNomeManuale(e.target.value)}
              placeholder="Scrivi il nome del cliente..."
              style={{
                width: "100%",
                padding: 14,
                borderRadius: 12,
                border: "2px solid #475569",
                backgroundColor: "#0f172a",
                color: "#ffffff",
                fontSize: 16,
                boxSizing: "border-box",
                outline: "none",
              }}
            />
          </div>

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
            <p style={{ fontSize: 18 }}>Caricamento prodotti...</p>
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
                          padding: "12px 14px",
                          borderRadius: 12,
                          border: "1px solid rgba(255,255,255,0.10)",
                          backgroundColor: "rgba(255,255,255,0.04)",
                        }}
                      >
                        <div
                          style={{
                            fontSize: 17,
                            fontWeight: 600,
                            color: "#f8fafc",
                            marginBottom: 10,
                          }}
                        >
                          {p.nome}
                        </div>

                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: 14,
                            flexWrap: "wrap",
                          }}
                        >
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
                              placeholder="QtÃ "
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
                                value={
                                  unitaSelezionate[p.id] || opzioniUnita[0]
                                }
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

                          <input
                            type="text"
                            value={noteProdotti[p.id] || ""}
                            onChange={(e) =>
                              aggiornaNotaProdotto(p.id, e.target.value)
                            }
                            placeholder="Nota per questo prodotto"
                            style={{
                              flex: 1,
                              minWidth: 260,
                              padding: "12px 12px",
                              borderRadius: 10,
                              border: "2px solid #475569",
                              backgroundColor: "#0f172a",
                              color: "#ffffff",
                              fontSize: 15,
                              outline: "none",
                            }}
                          />
                        </div>

                        {(righeAggiuntive[p.id] || []).map((rigaExtra, index) => (
                          <div
                            key={rigaExtra.rigaId}
                            style={{
                              marginTop: 10,
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              gap: 14,
                              flexWrap: "wrap",
                              paddingTop: 10,
                              borderTop: "1px solid rgba(255,255,255,0.08)",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                                flexWrap: "wrap",
                              }}
                            >
                              <div
                                style={{
                                  color: "#bae6fd",
                                  fontSize: 13,
                                  fontWeight: "bold",
                                  minWidth: 105,
                                }}
                              >
                                Altra quantitÃ  {index + 2}
                              </div>

                              <input
                                type="number"
                                step="0.1"
                                min="0"
                                value={rigaExtra.quantita}
                                onChange={(e) =>
                                  aggiornaRigaAggiuntiva(
                                    p.id,
                                    rigaExtra.rigaId,
                                    "quantita",
                                    e.target.value
                                  )
                                }
                                placeholder="QtÃ "
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
                                  value={rigaExtra.unita || opzioniUnita[0]}
                                  onChange={(e) =>
                                    aggiornaRigaAggiuntiva(
                                      p.id,
                                      rigaExtra.rigaId,
                                      "unita",
                                      e.target.value
                                    )
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

                            <input
                              type="text"
                              value={rigaExtra.note}
                              onChange={(e) =>
                                aggiornaRigaAggiuntiva(
                                  p.id,
                                  rigaExtra.rigaId,
                                  "note",
                                  e.target.value
                                )
                              }
                              placeholder="Nota per questa quantitÃ "
                              style={{
                                flex: 1,
                                minWidth: 220,
                                padding: "12px 12px",
                                borderRadius: 10,
                                border: "2px solid #475569",
                                backgroundColor: "#0f172a",
                                color: "#ffffff",
                                fontSize: 15,
                                outline: "none",
                              }}
                            />

                            <button
                              type="button"
                              onClick={() =>
                                rimuoviRigaAggiuntiva(p.id, rigaExtra.rigaId)
                              }
                              style={{
                                padding: "10px 12px",
                                borderRadius: 10,
                                border: "none",
                                backgroundColor: "#ef4444",
                                color: "#ffffff",
                                fontWeight: "bold",
                                cursor: "pointer",
                                fontSize: 13,
                              }}
                            >
                              X
                            </button>
                          </div>
                        ))}

                        <button
                          type="button"
                          onClick={() => aggiungiAltraQuantita(p)}
                          style={{
                            marginTop: 10,
                            padding: "10px 12px",
                            borderRadius: 10,
                            border: "1px solid rgba(125, 211, 252, 0.45)",
                            backgroundColor: "rgba(14, 165, 233, 0.12)",
                            color: "#7dd3fc",
                            fontWeight: "bold",
                            cursor: "pointer",
                            fontSize: 14,
                          }}
                        >
                          + Aggiungi altra quantitÃ 
                        </button>
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

          <div
            style={{
              marginTop: 24,
              borderRadius: 14,
              padding: 16,
              backgroundColor: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.10)",
            }}
          >
            <div
              style={{
                fontSize: 22,
                fontWeight: "bold",
                marginBottom: 8,
                color: "#7dd3fc",
              }}
            >
              Data consegna
            </div>

            <div
              style={{
                color: "#cbd5e1",
                fontSize: 14,
                marginBottom: 14,
              }}
            >
              Seleziona direttamente dal calendario il giorno in cui vuoi inserire l'ordine.
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
                disabled={meseCalendario <= getDataOperativa().slice(0, 7)}
                onClick={() =>
                  setMeseCalendario(cambiaMeseIso(meseCalendario, -1))
                }
                style={{
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.18)",
                  backgroundColor:
                    meseCalendario <= getDataOperativa().slice(0, 7)
                      ? "#334155"
                      : "#1e293b",
                  color: "#ffffff",
                  fontWeight: "bold",
                  cursor:
                    meseCalendario <= getDataOperativa().slice(0, 7)
                      ? "not-allowed"
                      : "pointer",
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
                onClick={() =>
                  setMeseCalendario(cambiaMeseIso(meseCalendario, 1))
                }
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

                const disabilitato = giorno.iso < getDataOperativa();
                const selezionato = giorno.iso === dataConsegna;

                return (
                  <button
                    type="button"
                    key={giorno.iso}
                    disabled={disabilitato}
                    onClick={() => setDataConsegna(giorno.iso)}
                    style={{
                      minHeight: 42,
                      borderRadius: 10,
                      border: selezionato
                        ? "2px solid #ffffff"
                        : "1px solid rgba(255,255,255,0.16)",
                      backgroundColor: disabilitato
                        ? "#334155"
                        : selezionato
                        ? "#0284c7"
                        : "#0f172a",
                      color: disabilitato ? "#94a3b8" : "#ffffff",
                      fontWeight: "bold",
                      fontSize: 15,
                      cursor: disabilitato ? "not-allowed" : "pointer",
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
              Data selezionata: <strong>{formatDataConsegna(dataConsegna)}</strong>
            </div>
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

            <div
              style={{
                marginBottom: 14,
                color: "#ffffff",
                fontSize: 15,
                backgroundColor: "rgba(14,165,233,0.14)",
                border: "1px solid rgba(125,211,252,0.35)",
                borderRadius: 10,
                padding: 12,
              }}
            >
              Consegna prevista: <strong>{formatDataConsegna(dataConsegna)}</strong>
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
                  <div key={riga.rigaId || riga.id} style={{ marginBottom: 8, fontSize: 16 }}>
                    - {riga.nome} â†’ {riga.quantita} {riga.unita}
                    {riga.note ? ` | Nota: ${riga.note}` : ""}
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
            {invioInCorso
              ? "Inserimento in corso..."
              : "Inserisci ordine manuale"}
          </button>
        </div>
      </div>
    </div>
  );
}