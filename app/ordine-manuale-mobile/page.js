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
  const [categoriaAperta, setCategoriaAperta] = useState(null);

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
        console.error("Errore unit\u00e0:", unitaError);
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
      alert("Inserisci almeno una quantit\u00e0.");
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

    const righeFinali = riepilogoOrdine.map((r) => ({
      prodotto_id: r.id,
      quantita: r.quantita,
      unita: r.unita,
      note: r.note || null,
    }));

    const { error: ordineError } = await supabase.rpc(
      "crea_ordine_atomico",
      {
        p_cliente_id: null,
        p_cliente_nome_manuale: nomeManuale,
        p_note_generali: note || null,
        p_data_operativa: dataOperativa,
        p_righe: righeFinali,
      }
    );

    if (ordineError) {
      console.error("Errore ordine:", ordineError);
      alert(JSON.stringify(ordineError, null, 2));
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
        padding: "10px 10px 110px",
        fontFamily: "Arial, sans-serif",
        color: "#ffffff",
      }}
    >
      <div style={{ maxWidth: 760, margin: "0 auto" }}>

        <div
          style={{
            background: "linear-gradient(90deg, #0ea5e9 0%, #0284c7 100%)",
            borderRadius: 14,
            padding: 10,
            marginBottom: 10,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <img
              src="/logo-boutique.jpg"
              alt="Logo Boutique dei Frutti di Mare"
              style={{
                width: 52,
                height: 52,
                objectFit: "contain",
                borderRadius: 9,
                backgroundColor: "#ffffff",
                padding: 4,
              }}
            />

            <div>
              <div
                style={{
                  fontSize: 21,
                  fontWeight: "bold",
                  lineHeight: 1.05,
                }}
              >
                Ordine rapido
              </div>

              <div
                style={{
                  marginTop: 3,
                  fontSize: 13,
                  color: "#e0f2fe",
                }}
              >
                Inserimento da cellulare
              </div>
            </div>
          </div>
        </div>


        <div
          style={{
            padding: 11,
            marginBottom: 10,
            borderRadius: 13,
            backgroundColor: "rgba(15,23,42,0.72)",
            border: "1px solid rgba(255,255,255,0.10)",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(155px,1fr))",
              gap: 9,
            }}
          >
            <div>
              <div
                style={{
                  marginBottom: 5,
                  fontSize: 12,
                  fontWeight: "bold",
                  color: "#7dd3fc",
                }}
              >
                CLIENTE
              </div>

              <input
                type="text"
                value={clienteNomeManuale}
                onChange={(e) => setClienteNomeManuale(e.target.value)}
                placeholder="Nome cliente"
                autoComplete="off"
                style={{
                  width: "100%",
                  height: 46,
                  padding: "0 11px",
                  borderRadius: 9,
                  border: "2px solid #475569",
                  backgroundColor: "#0f172a",
                  color: "#ffffff",
                  fontSize: 17,
                  boxSizing: "border-box",
                  outline: "none",
                }}
              />
            </div>

            <div>
              <div
                style={{
                  marginBottom: 5,
                  fontSize: 12,
                  fontWeight: "bold",
                  color: "#7dd3fc",
                }}
              >
                CONSEGNA
              </div>

              <input
                type="date"
                value={dataConsegna}
                min={getDataOperativa()}
                onChange={(e) => setDataConsegna(e.target.value)}
                style={{
                  width: "100%",
                  height: 46,
                  padding: "0 9px",
                  borderRadius: 9,
                  border: "2px solid #475569",
                  backgroundColor: "#0f172a",
                  color: "#ffffff",
                  fontSize: 16,
                  boxSizing: "border-box",
                  outline: "none",
                  colorScheme: "dark",
                }}
              />
            </div>
          </div>
        </div>


        <div
          style={{
            position: "sticky",
            top: 0,
            zIndex: 20,
            marginBottom: 10,
            padding: 9,
            borderRadius: 13,
            backgroundColor: "#0b2d3b",
            border: "1px solid rgba(125,211,252,0.35)",
            boxShadow: "0 6px 18px rgba(0,0,0,0.30)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
              marginBottom: 6,
            }}
          >
            <strong
              style={{
                fontSize: 13,
                color: "#7dd3fc",
              }}
            >
              CERCA PRODOTTO
            </strong>

            <span
              style={{
                padding: "3px 8px",
                borderRadius: 999,
                backgroundColor:
                  riepilogoOrdine.length > 0
                    ? "#16a34a"
                    : "#334155",
                fontSize: 12,
                fontWeight: "bold",
              }}
            >
              {riepilogoOrdine.length} inseriti
            </span>
          </div>

          <div style={{ display: "flex", gap: 6 }}>
            <input
              type="search"
              value={ricerca}
              onChange={(e) => setRicerca(e.target.value)}
              onFocus={(e) => e.target.select()}
              placeholder="Es. spigola, cozza, scampo..."
              autoComplete="off"
              enterKeyHint="search"
              style={{
                flex: 1,
                minWidth: 0,
                height: 48,
                padding: "0 11px",
                borderRadius: 9,
                border: "2px solid #0ea5e9",
                backgroundColor: "#ffffff",
                color: "#0f172a",
                fontSize: 17,
                fontWeight: 600,
                boxSizing: "border-box",
                outline: "none",
              }}
            />

            {ricerca ? (
              <button
                type="button"
                onClick={() => setRicerca("")}
                style={{
                  width: 46,
                  height: 46,
                  border: "none",
                  borderRadius: 9,
                  backgroundColor: "#334155",
                  color: "#ffffff",
                  fontSize: 22,
                  cursor: "pointer",
                }}
              >
                ×
              </button>
            ) : null}
          </div>
        </div>


        {caricamento ? (
          <div
            style={{
              padding: 15,
              textAlign: "center",
              color: "#cbd5e1",
            }}
          >
            Caricamento prodotti...
          </div>
        ) : Object.keys(prodottiPerCategoria).length === 0 ? (
          <div
            style={{
              padding: 15,
              textAlign: "center",
              color: "#cbd5e1",
            }}
          >
            Nessun prodotto trovato.
          </div>
        ) : (
          <div>
            <div
              style={{
                marginBottom: 8,
                padding: "7px 9px",
                borderRadius: 9,
                backgroundColor: "rgba(255,255,255,0.04)",
                color: "#cbd5e1",
                fontSize: 12,
                lineHeight: 1.35,
              }}
            >
              {ricerca.trim()
                ? `${prodottiFiltrati.length} risultati trovati`
                : "Scegli una categoria. Una sola resta aperta alla volta."}
            </div>

            {Object.keys(prodottiPerCategoria).map((categoria) => {
              const prodottiCategoria =
                prodottiPerCategoria[categoria];

              const ricercaAttiva =
                ricerca.trim().length > 0;

              const aperta =
                ricercaAttiva ||
                categoriaAperta === categoria;

              const inseritiCategoria =
                prodottiCategoria.filter(
                  (p) =>
                    Number(quantita[p.id]) > 0 ||
                    (righeAggiuntive[p.id] || []).some(
                      (riga) =>
                        Number(riga.quantita) > 0
                    )
                ).length;

              return (
                <div
                  key={categoria}
                  style={{
                    marginBottom: 7,
                    borderRadius: 11,
                    overflow: "hidden",
                    border: aperta
                      ? "1px solid rgba(125,211,252,0.48)"
                      : "1px solid rgba(255,255,255,0.10)",
                    backgroundColor:
                      "rgba(255,255,255,0.035)",
                  }}
                >
                  <button
                    type="button"
                    aria-expanded={aperta}
                    onClick={() => {
                      if (ricercaAttiva) return;

                      setCategoriaAperta((attuale) =>
                        attuale === categoria
                          ? null
                          : categoria
                      );
                    }}
                    style={{
                      width: "100%",
                      minHeight: 52,
                      padding: "8px 10px",
                      border: "none",
                      backgroundColor: aperta
                        ? "rgba(14,165,233,0.18)"
                        : "rgba(15,23,42,0.60)",
                      color: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 8,
                      cursor: ricercaAttiva
                        ? "default"
                        : "pointer",
                      textAlign: "left",
                    }}
                  >
                    <div
                      style={{
                        flex: 1,
                        minWidth: 0,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 15,
                          fontWeight: "bold",
                          lineHeight: 1.15,
                        }}
                      >
                        {CATEGORY_LABELS[categoria] ||
                          categoria}
                      </div>

                      <div
                        style={{
                          marginTop: 3,
                          fontSize: 11,
                          color: "#bae6fd",
                        }}
                      >
                        {prodottiCategoria.length} prodotti
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 7,
                        flexShrink: 0,
                      }}
                    >
                      {inseritiCategoria > 0 ? (
                        <span
                          style={{
                            padding: "4px 8px",
                            borderRadius: 999,
                            backgroundColor: "#16a34a",
                            color: "#ffffff",
                            fontSize: 12,
                            fontWeight: "bold",
                          }}
                        >
                          {inseritiCategoria} ✓
                        </span>
                      ) : null}

                      {!ricercaAttiva ? (
                        <span
                          style={{
                            width: 26,
                            height: 26,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            borderRadius: 999,
                            backgroundColor:
                              "rgba(255,255,255,0.08)",
                            fontSize: 17,
                            fontWeight: "bold",
                          }}
                        >
                          {aperta ? "−" : "+"}
                        </span>
                      ) : null}
                    </div>
                  </button>

                  {aperta ? (
                    <div
                      style={{
                        padding: 7,
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                      }}
                    >
                      {prodottiCategoria.map((p) => {
                        const nomeNorm =
                          normalizeName(p.nome);

                        const opzioniUnita =
                          unitaProdotti[p.id] ||
                          UNITA_FALLBACK[nomeNorm] ||
                          [
                            p.unita_vendita ||
                              "KG",
                          ];

                        const prodottoInserito =
                          Number(quantita[p.id]) > 0 ||
                          (
                            righeAggiuntive[p.id] ||
                            []
                          ).some(
                            (riga) =>
                              Number(
                                riga.quantita
                              ) > 0
                          );

                        return (
                          <div
                            key={p.id}
                            style={{
                              padding: "8px 9px",
                              borderRadius: 10,
                              border:
                                prodottoInserito
                                  ? "2px solid #22c55e"
                                  : "1px solid rgba(255,255,255,0.12)",
                              backgroundColor:
                                prodottoInserito
                                  ? "rgba(34,197,94,0.10)"
                                  : "rgba(255,255,255,0.04)",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                justifyContent:
                                  "space-between",
                                alignItems:
                                  "center",
                                gap: 6,
                                marginBottom: 6,
                              }}
                            >
                              <div
                                style={{
                                  fontSize: 16,
                                  fontWeight:
                                    "bold",
                                  lineHeight: 1.15,
                                }}
                              >
                                {p.nome}
                              </div>

                              {prodottoInserito ? (
                                <span
                                  style={{
                                    width: 24,
                                    height: 24,
                                    flexShrink: 0,
                                    display: "flex",
                                    alignItems:
                                      "center",
                                    justifyContent:
                                      "center",
                                    borderRadius:
                                      999,
                                    backgroundColor:
                                      "#16a34a",
                                    fontWeight:
                                      "bold",
                                  }}
                                >
                                  ✓
                                </span>
                              ) : null}
                            </div>

                            <div
                              style={{
                                display: "flex",
                                alignItems:
                                  "stretch",
                                gap: 6,
                              }}
                            >
                              <input
                                type="number"
                                inputMode="decimal"
                                step="0.1"
                                min="0"
                                value={
                                  quantita[p.id] ||
                                  ""
                                }
                                onChange={(e) =>
                                  aggiornaQuantita(
                                    p.id,
                                    e.target.value
                                  )
                                }
                                onFocus={(e) =>
                                  e.target.select()
                                }
                                placeholder="Quantità"
                                style={{
                                  flex: 1,
                                  minWidth: 0,
                                  height: 48,
                                  padding:
                                    "0 8px",
                                  borderRadius: 8,
                                  border:
                                    prodottoInserito
                                      ? "2px solid #22c55e"
                                      : "2px solid #475569",
                                  backgroundColor:
                                    "#0f172a",
                                  color:
                                    "#ffffff",
                                  fontSize: 20,
                                  fontWeight:
                                    "bold",
                                  textAlign:
                                    "center",
                                  outline: "none",
                                  boxSizing:
                                    "border-box",
                                }}
                              />

                              {opzioniUnita.length ===
                              1 ? (
                                <div
                                  style={{
                                    minWidth: 76,
                                    height: 48,
                                    padding:
                                      "0 7px",
                                    borderRadius: 8,
                                    border:
                                      "2px solid #334155",
                                    backgroundColor:
                                      "#1e293b",
                                    display: "flex",
                                    alignItems:
                                      "center",
                                    justifyContent:
                                      "center",
                                    fontWeight:
                                      "bold",
                                    boxSizing:
                                      "border-box",
                                  }}
                                >
                                  {
                                    opzioniUnita[0]
                                  }
                                </div>
                              ) : (
                                <select
                                  value={
                                    unitaSelezionate[
                                      p.id
                                    ] ||
                                    opzioniUnita[0]
                                  }
                                  onChange={(e) =>
                                    aggiornaUnita(
                                      p.id,
                                      e.target.value
                                    )
                                  }
                                  style={{
                                    minWidth: 88,
                                    height: 48,
                                    padding:
                                      "0 6px",
                                    borderRadius: 8,
                                    border:
                                      "2px solid #475569",
                                    backgroundColor:
                                      "#0f172a",
                                    color:
                                      "#ffffff",
                                    fontSize: 15,
                                    fontWeight:
                                      "bold",
                                    outline: "none",
                                  }}
                                >
                                  {opzioniUnita.map(
                                    (u) => (
                                      <option
                                        key={u}
                                        value={u}
                                      >
                                        {u}
                                      </option>
                                    )
                                  )}
                                </select>
                              )}
                            </div>

                            <details
                              style={{
                                marginTop: 6,
                                paddingTop: 5,
                                borderTop:
                                  "1px solid rgba(255,255,255,0.08)",
                              }}
                            >
                              <summary
                                style={{
                                  cursor:
                                    "pointer",
                                  fontSize: 13,
                                  fontWeight:
                                    "bold",
                                  color:
                                    noteProdotti[
                                      p.id
                                    ] ||
                                    (
                                      righeAggiuntive[
                                        p.id
                                      ] || []
                                    ).length > 0
                                      ? "#86efac"
                                      : "#7dd3fc",
                                }}
                              >
                                Note / altra quantità
                                {noteProdotti[
                                  p.id
                                ] ||
                                (
                                  righeAggiuntive[
                                    p.id
                                  ] || []
                                ).length > 0
                                  ? " ✓"
                                  : ""}
                              </summary>

                              <div
                                style={{
                                  marginTop: 8,
                                }}
                              >
                                <input
                                  type="text"
                                  value={
                                    noteProdotti[
                                      p.id
                                    ] || ""
                                  }
                                  onChange={(e) =>
                                    aggiornaNotaProdotto(
                                      p.id,
                                      e.target
                                        .value
                                    )
                                  }
                                  placeholder="Nota prodotto"
                                  style={{
                                    width: "100%",
                                    height: 41,
                                    padding:
                                      "0 9px",
                                    borderRadius: 8,
                                    border:
                                      "2px solid #475569",
                                    backgroundColor:
                                      "#0f172a",
                                    color:
                                      "#ffffff",
                                    fontSize: 14,
                                    boxSizing:
                                      "border-box",
                                    outline: "none",
                                  }}
                                />

                                {(
                                  righeAggiuntive[
                                    p.id
                                  ] || []
                                ).map(
                                  (
                                    rigaExtra,
                                    index
                                  ) => (
                                    <div
                                      key={
                                        rigaExtra.rigaId
                                      }
                                      style={{
                                        marginTop: 8,
                                        paddingTop: 8,
                                        borderTop:
                                          "1px solid rgba(255,255,255,0.08)",
                                      }}
                                    >
                                      <div
                                        style={{
                                          marginBottom: 5,
                                          fontSize: 12,
                                          fontWeight:
                                            "bold",
                                          color:
                                            "#bae6fd",
                                        }}
                                      >
                                        Quantità
                                        aggiuntiva{" "}
                                        {index + 2}
                                      </div>

                                      <div
                                        style={{
                                          display:
                                            "flex",
                                          gap: 5,
                                        }}
                                      >
                                        <input
                                          type="number"
                                          inputMode="decimal"
                                          step="0.1"
                                          min="0"
                                          value={
                                            rigaExtra.quantita
                                          }
                                          onChange={(
                                            e
                                          ) =>
                                            aggiornaRigaAggiuntiva(
                                              p.id,
                                              rigaExtra.rigaId,
                                              "quantita",
                                              e
                                                .target
                                                .value
                                            )
                                          }
                                          onFocus={(
                                            e
                                          ) =>
                                            e.target.select()
                                          }
                                          placeholder="Quantità"
                                          style={{
                                            flex: 1,
                                            minWidth: 0,
                                            height: 44,
                                            padding:
                                              "0 7px",
                                            borderRadius: 8,
                                            border:
                                              "2px solid #475569",
                                            backgroundColor:
                                              "#0f172a",
                                            color:
                                              "#ffffff",
                                            fontSize: 17,
                                            fontWeight:
                                              "bold",
                                            textAlign:
                                              "center",
                                            outline:
                                              "none",
                                            boxSizing:
                                              "border-box",
                                          }}
                                        />

                                        {opzioniUnita.length ===
                                        1 ? (
                                          <div
                                            style={{
                                              minWidth: 70,
                                              height: 44,
                                              borderRadius: 8,
                                              border:
                                                "2px solid #334155",
                                              backgroundColor:
                                                "#1e293b",
                                              display:
                                                "flex",
                                              alignItems:
                                                "center",
                                              justifyContent:
                                                "center",
                                              fontWeight:
                                                "bold",
                                            }}
                                          >
                                            {
                                              opzioniUnita[0]
                                            }
                                          </div>
                                        ) : (
                                          <select
                                            value={
                                              rigaExtra.unita ||
                                              opzioniUnita[0]
                                            }
                                            onChange={(
                                              e
                                            ) =>
                                              aggiornaRigaAggiuntiva(
                                                p.id,
                                                rigaExtra.rigaId,
                                                "unita",
                                                e
                                                  .target
                                                  .value
                                              )
                                            }
                                            style={{
                                              minWidth: 80,
                                              height: 44,
                                              borderRadius: 8,
                                              border:
                                                "2px solid #475569",
                                              backgroundColor:
                                                "#0f172a",
                                              color:
                                                "#ffffff",
                                              fontWeight:
                                                "bold",
                                            }}
                                          >
                                            {opzioniUnita.map(
                                              (u) => (
                                                <option
                                                  key={
                                                    u
                                                  }
                                                  value={
                                                    u
                                                  }
                                                >
                                                  {
                                                    u
                                                  }
                                                </option>
                                              )
                                            )}
                                          </select>
                                        )}

                                        <button
                                          type="button"
                                          onClick={() =>
                                            rimuoviRigaAggiuntiva(
                                              p.id,
                                              rigaExtra.rigaId
                                            )
                                          }
                                          style={{
                                            width: 42,
                                            height: 44,
                                            flexShrink: 0,
                                            border:
                                              "none",
                                            borderRadius: 8,
                                            backgroundColor:
                                              "#ef4444",
                                            color:
                                              "#ffffff",
                                            fontWeight:
                                              "bold",
                                          }}
                                        >
                                          X
                                        </button>
                                      </div>

                                      <input
                                        type="text"
                                        value={
                                          rigaExtra.note
                                        }
                                        onChange={(
                                          e
                                        ) =>
                                          aggiornaRigaAggiuntiva(
                                            p.id,
                                            rigaExtra.rigaId,
                                            "note",
                                            e.target
                                              .value
                                          )
                                        }
                                        placeholder="Nota per questa quantità"
                                        style={{
                                          width: "100%",
                                          height: 39,
                                          marginTop: 5,
                                          padding:
                                            "0 8px",
                                          borderRadius: 8,
                                          border:
                                            "2px solid #475569",
                                          backgroundColor:
                                            "#0f172a",
                                          color:
                                            "#ffffff",
                                          fontSize: 13,
                                          boxSizing:
                                            "border-box",
                                          outline:
                                            "none",
                                        }}
                                      />
                                    </div>
                                  )
                                )}

                                <button
                                  type="button"
                                  onClick={() =>
                                    aggiungiAltraQuantita(
                                      p
                                    )
                                  }
                                  style={{
                                    width: "100%",
                                    minHeight: 39,
                                    marginTop: 8,
                                    borderRadius: 8,
                                    border:
                                      "1px solid rgba(125,211,252,0.45)",
                                    backgroundColor:
                                      "rgba(14,165,233,0.12)",
                                    color:
                                      "#7dd3fc",
                                    fontWeight:
                                      "bold",
                                  }}
                                >
                                  + Aggiungi altra
                                  quantità
                                </button>
                              </div>
                            </details>
                          </div>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
        <details
          style={{
            marginTop: 12,
            padding: 9,
            borderRadius: 10,
            backgroundColor: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.10)",
          }}
        >
          <summary
            style={{
              cursor: "pointer",
              color: "#7dd3fc",
              fontSize: 13,
              fontWeight: "bold",
            }}
          >
            Note generali
            {note ? " ✓" : ""}
          </summary>

          <textarea
            rows="3"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Eventuali note generali"
            style={{
              width: "100%",
              marginTop: 8,
              padding: 9,
              borderRadius: 8,
              border: "2px solid #475569",
              backgroundColor: "#0f172a",
              color: "#ffffff",
              boxSizing: "border-box",
            }}
          />
        </details>


        <details
          style={{
            marginTop: 9,
            padding: 9,
            borderRadius: 10,
            backgroundColor: "rgba(14,165,233,0.10)",
            border: "1px solid rgba(125,211,252,0.30)",
          }}
        >
          <summary
            style={{
              cursor: "pointer",
              color: "#ffffff",
              fontSize: 13,
              fontWeight: "bold",
            }}
          >
            Riepilogo · {riepilogoOrdine.length} prodotti
          </summary>

          <div
            style={{
              marginTop: 8,
              color: "#bae6fd",
              fontSize: 12,
            }}
          >
            Consegna:{" "}
            <strong>
              {formatDataConsegna(dataConsegna)}
            </strong>
          </div>

          {riepilogoOrdine.map((riga) => (
            <div
              key={riga.rigaId || riga.id}
              style={{
                padding: "5px 0",
                borderBottom:
                  "1px solid rgba(255,255,255,0.07)",
                fontSize: 13,
              }}
            >
              <strong>{riga.nome}</strong>
              {" · "}
              {riga.quantita} {riga.unita}
              {riga.note ? ` · ${riga.note}` : ""}
            </div>
          ))}
        </details>


        <div
          style={{
            position: "fixed",
            left: "50%",
            bottom: 8,
            transform: "translateX(-50%)",
            width: "calc(100% - 20px)",
            maxWidth: 760,
            zIndex: 40,
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: 8,
            borderRadius: 13,
            backgroundColor: "rgba(15,23,42,0.97)",
            border: "1px solid rgba(125,211,252,0.35)",
            boxShadow: "0 8px 28px rgba(0,0,0,0.45)",
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              flex: 1,
              minWidth: 0,
            }}
          >
            <div
              style={{
                fontSize: 15,
                fontWeight: "bold",
                color:
                  riepilogoOrdine.length > 0
                    ? "#86efac"
                    : "#ffffff",
              }}
            >
              {riepilogoOrdine.length} prodotti
            </div>

            <div
              style={{
                marginTop: 2,
                fontSize: 11,
                color: "#cbd5e1",
                overflow: "hidden",
                whiteSpace: "nowrap",
                textOverflow: "ellipsis",
              }}
            >
              {clienteNomeManuale.trim() ||
                "Cliente non inserito"}
            </div>
          </div>

          <button
            type="button"
            onClick={inviaOrdine}
            disabled={invioInCorso}
            style={{
              minWidth: 145,
              height: 49,
              padding: "0 12px",
              border: "none",
              borderRadius: 9,
              background: invioInCorso
                ? "#64748b"
                : "linear-gradient(90deg,#22c55e,#16a34a)",
              color: "#ffffff",
              fontSize: 15,
              fontWeight: "bold",
              cursor: invioInCorso
                ? "not-allowed"
                : "pointer",
            }}
          >
            {invioInCorso
              ? "Salvataggio..."
              : "Conferma ordine"}
          </button>
        </div>

      </div>
    </div>
  );
}