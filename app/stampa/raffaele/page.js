"use client";

import { useEffect, useState } from "react";
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

export default function StampaRaffaelePage() {
  const [dati, setDati] = useState({});
  const [caricamento, setCaricamento] = useState(true);

  useEffect(() => {
    caricaDati();
  }, []);

  async function caricaDati() {
    setCaricamento(true);

    const dataOggi = getDataOperativaOggi();

    const { data: ordini, error: ordiniError } = await supabase
      .from("ordini")
      .select("*")
      .eq("data_operativa", dataOggi)
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

    const { data: righe, error: righeError } = await supabase
      .from("righe_ordine")
      .select("*");

    if (righeError) {
      console.error("Errore righe ordine:", righeError);
      alert("Errore nel caricamento righe ordine");
      setCaricamento(false);
      return;
    }

    const { data: prodotti, error: prodottiError } = await supabase
      .from("prodotti_v2")
      .select("id, nome, stampa");

    if (prodottiError) {
      console.error("Errore prodotti:", prodottiError);
      alert("Errore nel caricamento prodotti");
      setCaricamento(false);
      return;
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
      const clienteNome = clientiMap[ordine.cliente_id] || "Cliente sconosciuto";

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

        risultato[clienteNome].sort((a, b) => a.nome.localeCompare(b.nome, "it"));
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

  return (
    <div
      style={{
        padding: 30,
        fontFamily: "Arial, sans-serif",
        backgroundColor: "#ffffff",
        color: "#000000",
        minHeight: "100vh",
      }}
    >
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 24,
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <h1 style={{ margin: 0 }}>Stampa Raffaele</h1>

          <button
            onClick={stampaPagina}
            style={{
              padding: "10px 16px",
              border: "none",
              borderRadius: 8,
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
          <p>Nessun dato per Raffaele nella giornata operativa corrente.</p>
        ) : (
          Object.entries(dati).map(([cliente, prodotti]) => (
            <div
              key={cliente}
              style={{
                marginBottom: 28,
                paddingBottom: 18,
                borderBottom: "1px solid #d1d5db",
              }}
            >
              <h2 style={{ marginBottom: 12 }}>{cliente}</h2>

              {prodotti.map((p, i) => (
                <div key={`${cliente}-${i}`} style={{ marginBottom: 6 }}>
                  - {p.nome} → {p.quantita} {p.unita}
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}