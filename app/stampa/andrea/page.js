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

export default function StampaAndreaPage() {
  const [dati, setDati] = useState([]);

  useEffect(() => {
    caricaDati();
  }, []);

  async function caricaDati() {
    const dataOggi = getDataOperativaOggi();

    const { data: ordini } = await supabase
      .from("ordini")
      .select("*")
      .eq("data_operativa", dataOggi);

    const { data: clienti } = await supabase
      .from("clienti")
      .select("id, nome");

    const { data: righe } = await supabase
      .from("righe_ordine")
      .select("*");

    const { data: prodotti } = await supabase
      .from("prodotti_v2")
      .select("id, nome, stampa");

    const clientiMap = {};
    clienti.forEach((c) => {
      clientiMap[c.id] = c.nome;
    });

    const prodottiMap = {};
    prodotti.forEach((p) => {
      prodottiMap[p.id] = p;
    });

    const risultato = {};

    ordini.forEach((ordine) => {
      const clienteNome = clientiMap[ordine.cliente_id] || "Cliente";

      const righeOrdine = righe.filter(
        (r) => r.ordine_id === ordine.id
      );

      const righeAndrea = righeOrdine.filter(
        (r) => prodottiMap[r.prodotto_id]?.stampa === "ANDREA"
      );

      if (righeAndrea.length > 0) {
        if (!risultato[clienteNome]) {
          risultato[clienteNome] = [];
        }

        righeAndrea.forEach((r) => {
          risultato[clienteNome].push({
            nome: prodottiMap[r.prodotto_id]?.nome,
            quantita: r.quantita,
            unita: r.unita,
          });
        });
      }
    });

    setDati(risultato);
  }

  useEffect(() => {
    setTimeout(() => {
      window.print();
    }, 500);
  }, [dati]);

  return (
    <div style={{ padding: 30, fontFamily: "Arial" }}>
      <h1 style={{ marginBottom: 20 }}>Stampa Andrea</h1>

      {Object.keys(dati).length === 0 ? (
        <p>Nessun dato</p>
      ) : (
        Object.entries(dati).map(([cliente, prodotti]) => (
          <div key={cliente} style={{ marginBottom: 20 }}>
            <h2>{cliente}</h2>

            {prodotti.map((p, i) => (
              <div key={i}>
                - {p.nome} → {p.quantita} {p.unita}
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  );
}