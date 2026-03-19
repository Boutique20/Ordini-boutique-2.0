"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";

const CATEGORY_LABELS = {
  P: "Pesce fresco",
  "P/L": "Pesce fresco lavorato",
  FDM: "Frutti di mare",
  "FDM/L": "Frutti di mare lavorati",
  C: "Congelato",
  OST: "Ostriche",
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

export default function OrdineClientePage() {
  const params = useParams();
  const slug = params?.slug;

  const [cliente, setCliente] = useState(null);
  const [prodotti, setProdotti] = useState([]);
  const [note, setNote] = useState("");
  const [caricamento, setCaricamento] = useState(true);
  const [invioInCorso, setInvioInCorso] = useState(false);

  const [quantita, setQuantita] = useState({});
  const [unitaProdotti, setUnitaProdotti] = useState({});
  const [unitaSelezionate, setUnitaSelezionate] = useState({});

  useEffect(() => {
    if (slug) {
      caricaDati();
    }
  }, [slug]);

  async function caricaDati() {
    setCaricamento(true);

    const { data: clienteData, error: clienteError } = await supabase
      .from("clienti")
      .select("*")
      .eq("slug", slug)
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
      .order("nome", { ascending: true });

    if (prodottiError) {
      console.error("Errore prodotti:", prodottiError);
      alert(JSON.stringify(prodottiError, null, 2));
      setCaricamento(false);
      return;
    }

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
    for (const prodotto of prodottiData || []) {
      const opzioni = mappaUnita[prodotto.id] || [prodotto.unita_vendita || "KG"];
      defaultUnita[prodotto.id] = opzioni[0];
    }

    setCliente(clienteData);
    setProdotti(prodottiData || []);
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

  const prodottiPerCategoria = useMemo(() => {
    const gruppi = {};

    for (const prodotto of prodotti) {
      const codice = prodotto.categoria || "ALTRO";
      if (!gruppi[codice]) gruppi[codice] = [];
      gruppi[codice].push(prodotto);
    }

    return gruppi;
  }, [prodotti]);

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

    alert("Ordine ricevuto ✅ Stiamo verificando la disponibilità e procediamo con la preparazione.");

    setQuantita({});
    setNote("");

    const resetUnita = {};
    for (const prodotto of prodotti) {
      const opzioni =
        unitaProdotti[prodotto.id] || [prodotto.unita_vendita || "KG"];
      resetUnita[prodotto.id] = opzioni[0];
    }
    setUnitaSelezionate(resetUnita);

    setInvioInCorso(false);
  }

  return (
    <div style={{ padding: 20, maxWidth: 900, margin: "0 auto", fontFamily: "Arial, sans-serif" }}>
      <h1>Selezione giornaliera Boutique 2.0</h1>

      {cliente && <h2 style={{ marginBottom: 20 }}>{cliente.nome}</h2>}

      {caricamento ? (
        <p>Caricamento...</p>
      ) : (
        Object.keys(prodottiPerCategoria).map((categoria) => (
          <div key={categoria} style={{ marginBottom: 30 }}>
            <h3>{CATEGORY_LABELS[categoria] || categoria}</h3>

            {prodottiPerCategoria[categoria].map((p) => {
              const opzioniUnita =
                unitaProdotti[p.id] || [p.unita_vendita || "KG"];

              return (
                <div
                  key={p.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 0",
                    borderBottom: "1px solid #ddd",
                    gap: 12,
                  }}
                >
                  <span style={{ flex: 1 }}>{p.nome}</span>

                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={quantita[p.id] || ""}
                      onChange={(e) => aggiornaQuantita(p.id, e.target.value)}
                      style={{ width: 90, padding: 8 }}
                    />

                    {opzioniUnita.length === 1 ? (
                      <span style={{ minWidth: 50 }}>{opzioniUnita[0]}</span>
                    ) : (
                      <select
                        value={unitaSelezionate[p.id] || opzioniUnita[0]}
                        onChange={(e) => aggiornaUnita(p.id, e.target.value)}
                        style={{ minWidth: 90, padding: 8 }}
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
        ))
      )}

      <div style={{ marginTop: 30 }}>
        <h3>Note finali</h3>
        <textarea
          rows="4"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          style={{ width: "100%", padding: 10 }}
          placeholder="Scrivi qui eventuali note generali"
        />
      </div>

      <div style={{ marginTop: 30 }}>
        <h3>Riepilogo ordine</h3>

        {riepilogoOrdine.length === 0 ? (
          <p>Nessun prodotto selezionato.</p>
        ) : (
          riepilogoOrdine.map((riga) => (
            <div key={riga.id} style={{ marginBottom: 6 }}>
              - {riga.nome} → {riga.quantita} {riga.unita}
            </div>
          ))
        )}
      </div>

      <button
        onClick={inviaOrdine}
        disabled={invioInCorso}
        style={{
          marginTop: 25,
          padding: "14px 20px",
          border: "none",
          cursor: "pointer",
          fontWeight: "bold",
          fontSize: 16,
        }}
      >
        {invioInCorso ? "Invio in corso..." : "Invia ordine"}
      </button>
    </div>
  );
}