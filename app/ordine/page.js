"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";

const CATEGORY_LABELS = {
  P: "Pesce fresco",
  "P/L": "Pesce fresco lavorato",
  FDM: "Frutti di mare",
  "FDM/L": "Frutti di mare lavorati",
  C: "Congelato",
  OST: "Ostriche",
};

export default function OrdinePage() {
  const [prodotti, setProdotti] = useState([]);
  const [clienti, setClienti] = useState([]);
  const [clienteId, setClienteId] = useState("");
  const [quantita, setQuantita] = useState({});
  const [noteGenerali, setNoteGenerali] = useState("");
  const [caricamento, setCaricamento] = useState(true);
  const [invioInCorso, setInvioInCorso] = useState(false);

  useEffect(() => {
    caricaDati();
  }, []);

  async function caricaDati() {
    setCaricamento(true);

    const { data: prodottiData, error: prodottiError } = await supabase
      .from("prodotti_v2")
      .select("id, nome, categoria, stampa, unita_vendita")
      .order("categoria", { ascending: true })
      .order("nome", { ascending: true });

    if (prodottiError) {
      console.error("Errore caricamento prodotti:", prodottiError);
      alert(JSON.stringify(prodottiError, null, 2));
      setCaricamento(false);
      return;
    }

    const { data: clientiData, error: clientiError } = await supabase
      .from("clienti")
      .select("id, nome, slug")
      .eq("attivo", true)
      .order("nome", { ascending: true });

    if (clientiError) {
      console.error("Errore caricamento clienti:", clientiError);
      alert(JSON.stringify(clientiError, null, 2));
      setCaricamento(false);
      return;
    }

    setProdotti(prodottiData || []);
    setClienti(clientiData || []);
    setCaricamento(false);
  }

  function aggiornaQuantita(prodottoId, valore) {
    setQuantita((prev) => ({
      ...prev,
      [prodottoId]: valore,
    }));
  }

  const prodottiPerCategoria = useMemo(() => {
    const gruppi = {};

    for (const prodotto of prodotti) {
      const codice = prodotto.categoria || "ALTRO";

      if (!gruppi[codice]) {
        gruppi[codice] = [];
      }

      gruppi[codice].push(prodotto);
    }

    return gruppi;
  }, [prodotti]);

  async function inviaOrdine() {
    if (!clienteId) {
      alert("Seleziona un cliente");
      return;
    }

    const righeDaInviare = prodotti
      .filter((p) => {
        const valore = quantita[p.id];

        if (valore === undefined || valore === null) return false;
        if (String(valore).trim() === "") return false;

        const numero = parseFloat(valore);
        return !isNaN(numero) && numero > 0;
      })
      .map((p) => ({
        prodotto_id: Number(p.id),
        quantita: parseFloat(quantita[p.id]),
        unita: p.unita_vendita || "KG",
        note: null,
      }));

    if (righeDaInviare.length === 0) {
      alert("Inserisci almeno una quantità");
      return;
    }

    setInvioInCorso(true);

    try {
      const { data: ordineCreato, error: erroreOrdine } = await supabase
        .from("ordini")
        .insert({
          cliente_id: Number(clienteId),
          note_generali: noteGenerali || null,
          stato: "bozza",
        })
        .select()
        .single();

      if (erroreOrdine) {
        throw erroreOrdine;
      }

      const righeFinali = righeDaInviare.map((riga) => ({
        ordine_id: Number(ordineCreato.id),
        prodotto_id: Number(riga.prodotto_id),
        quantita: Number(riga.quantita),
        unita: riga.unita,
        note: null,
      }));

      const { error: erroreRighe } = await supabase
        .from("righe_ordine")
        .insert(righeFinali);

      if (erroreRighe) {
        throw erroreRighe;
      }

      alert("Ordine salvato correttamente");

      setClienteId("");
      setQuantita({});
      setNoteGenerali("");
    } catch (errore) {
      console.error("Errore invio ordine:", errore);
      alert(JSON.stringify(errore, null, 2));
    } finally {
      setInvioInCorso(false);
    }
  }

  return (
    <div
      style={{
        padding: "24px",
        maxWidth: "900px",
        margin: "0 auto",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1 style={{ marginBottom: "8px" }}>Ordine Pescheria</h1>
      <p style={{ marginBottom: "24px" }}>
        Inserisci le quantità solo nei prodotti che vuoi ordinare.
      </p>

      <div style={{ marginBottom: "24px" }}>
        <label
          htmlFor="cliente"
          style={{
            display: "block",
            marginBottom: "8px",
            fontWeight: "bold",
          }}
        >
          Cliente
        </label>

        <select
          id="cliente"
          value={clienteId}
          onChange={(e) => setClienteId(e.target.value)}
          style={{
            width: "100%",
            maxWidth: "400px",
            padding: "10px",
            borderRadius: "6px",
          }}
        >
          <option value="">Seleziona cliente</option>
          {clienti.map((cliente) => (
            <option key={cliente.id} value={cliente.id}>
              {cliente.nome}
            </option>
          ))}
        </select>
      </div>

      {caricamento ? (
        <p>Caricamento dati...</p>
      ) : (
        Object.keys(prodottiPerCategoria).map((categoriaCodice) => (
          <div key={categoriaCodice} style={{ marginBottom: "28px" }}>
            <h2
              style={{
                marginBottom: "12px",
                borderBottom: "1px solid #ddd",
                paddingBottom: "6px",
              }}
            >
              {CATEGORY_LABELS[categoriaCodice] || categoriaCodice}
            </h2>

            {prodottiPerCategoria[categoriaCodice].map((prodotto) => (
              <div
                key={prodotto.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "12px",
                  padding: "8px 0",
                  borderBottom: "1px solid #f0f0f0",
                }}
              >
                <div>
                  <strong>{prodotto.nome}</strong>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={quantita[prodotto.id] || ""}
                    onChange={(e) =>
                      aggiornaQuantita(prodotto.id, e.target.value)
                    }
                    style={{ width: "90px", padding: "6px" }}
                  />
                  <span>{prodotto.unita_vendita || "KG"}</span>
                </div>
              </div>
            ))}
          </div>
        ))
      )}

      <div style={{ marginTop: "32px" }}>
        <h2>Note finali</h2>
        <textarea
          rows="5"
          value={noteGenerali}
          onChange={(e) => setNoteGenerali(e.target.value)}
          style={{ width: "100%", padding: "10px", marginTop: "8px" }}
          placeholder="Scrivi qui eventuali note generali per l'ordine"
        />
      </div>

      <div style={{ marginTop: "24px" }}>
        <button
          onClick={inviaOrdine}
          disabled={invioInCorso}
          style={{
            padding: "12px 18px",
            border: "none",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          {invioInCorso ? "Invio in corso..." : "Invia ordine"}
        </button>
      </div>
    </div>
  );
}