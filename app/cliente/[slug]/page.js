"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";

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

function getColoreStato(stato) {
  switch (stato) {
    case "bozza":
      return "#64748b";
    case "lavorazione":
      return "#f59e0b";
    case "pronto":
      return "#3b82f6";
    case "consegnato":
      return "#22c55e";
    default:
      return "#64748b";
  }
}

export default function SchedaClientePage() {
  const params = useParams();
  const slug = params?.slug;

  const [cliente, setCliente] = useState(null);
  const [ordini, setOrdini] = useState([]);
  const [caricamento, setCaricamento] = useState(true);

  useEffect(() => {
    if (slug) {
      caricaSchedaCliente();
    }
  }, [slug]);

  async function caricaSchedaCliente() {
    setCaricamento(true);

    const { data: clienteData, error: clienteError } = await supabase
      .from("clienti")
      .select("*")
      .eq("slug", slug)
      .single();

    if (clienteError || !clienteData) {
      console.error("Errore caricamento cliente:", clienteError);
      alert("Cliente non trovato");
      setCaricamento(false);
      return;
    }

    const { data: ordiniData, error: ordiniError } = await supabase
      .from("ordini")
      .select("*")
      .eq("cliente_id", clienteData.id)
      .order("id", { ascending: false });

    if (ordiniError) {
      console.error("Errore caricamento ordini:", ordiniError);
      alert(JSON.stringify(ordiniError, null, 2));
      setCaricamento(false);
      return;
    }

    const idsOrdini = (ordiniData || []).map((ordine) => ordine.id);

    let righeData = [];
    if (idsOrdini.length > 0) {
      const { data, error } = await supabase
        .from("righe_ordine")
        .select("*")
        .in("ordine_id", idsOrdini);

      if (error) {
        console.error("Errore caricamento righe ordine:", error);
        alert(JSON.stringify(error, null, 2));
        setCaricamento(false);
        return;
      }

      righeData = data || [];
    }

    const { data: prodottiData, error: prodottiError } = await supabase
      .from("prodotti_v2")
      .select("id, nome, stampa");

    if (prodottiError) {
      console.error("Errore caricamento prodotti:", prodottiError);
      alert(JSON.stringify(prodottiError, null, 2));
      setCaricamento(false);
      return;
    }

    const prodottiMap = {};
    for (const prodotto of prodottiData || []) {
      prodottiMap[prodotto.id] = prodotto;
    }

    const righePerOrdine = {};
    for (const riga of righeData || []) {
      if (!righePerOrdine[riga.ordine_id]) {
        righePerOrdine[riga.ordine_id] = [];
      }

      righePerOrdine[riga.ordine_id].push({
        ...riga,
        prodotto_nome:
          prodottiMap[riga.prodotto_id]?.nome || "Prodotto sconosciuto",
        stampa: prodottiMap[riga.prodotto_id]?.stampa || null,
      });
    }

    const ordiniFinali = (ordiniData || []).map((ordine) => ({
      ...ordine,
      righe: righePerOrdine[ordine.id] || [],
    }));

    setCliente(clienteData);
    setOrdini(ordiniFinali);
    setCaricamento(false);
  }

  const totaleOrdini = ordini.length;

  const ultimoOrdine = useMemo(() => {
    return ordini.length > 0 ? ordini[0] : null;
  }, [ordini]);

  return (
    <div
      style={{
        backgroundColor: "#0f172a",
        minHeight: "100vh",
        padding: 30,
        fontFamily: "Arial, sans-serif",
        color: "#ffffff",
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        {caricamento ? (
          <p>Caricamento scheda cliente...</p>
        ) : !cliente ? (
          <p>Cliente non trovato.</p>
        ) : (
          <>
            <div
              style={{
                backgroundColor: "#1e293b",
                border: "1px solid #334155",
                borderRadius: 14,
                padding: 20,
                marginBottom: 24,
              }}
            >
              <h1 style={{ marginTop: 0, marginBottom: 16 }}>
                Scheda Cliente
              </h1>

              <div style={{ marginBottom: 8 }}>
                <strong>Nome:</strong> {cliente.nome}
              </div>

              <div style={{ marginBottom: 8 }}>
                <strong>Slug:</strong> {cliente.slug}
              </div>

              <div style={{ marginBottom: 8 }}>
                <strong>Totale ordini:</strong> {totaleOrdini}
              </div>

              <div style={{ marginBottom: 8 }}>
                <strong>Ultimo ordine:</strong>{" "}
                {ultimoOrdine
                  ? formatDataOra(ultimoOrdine.created_at)
                  : "-"}
              </div>
            </div>

            <div
              style={{
                fontSize: 22,
                fontWeight: "bold",
                color: "#38bdf8",
                marginBottom: 16,
              }}
            >
              Storico ordini
            </div>

            {ordini.length === 0 ? (
              <p>Nessun ordine presente per questo cliente.</p>
            ) : (
              ordini.map((ordine) => (
                <div
                  key={ordine.id}
                  style={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #334155",
                    borderRadius: 14,
                    padding: 20,
                    marginBottom: 22,
                    boxShadow: "0 4px 14px rgba(0,0,0,0.25)",
                  }}
                >
                  <div style={{ marginBottom: 14 }}>
                    <div
                      style={{
                        fontSize: 22,
                        fontWeight: "bold",
                        color: "#38bdf8",
                        marginBottom: 10,
                      }}
                    >
                      Ordine #{ordine.id}
                    </div>

                    <div style={{ marginBottom: 6 }}>
                      <strong>Data invio:</strong>{" "}
                      {formatDataOra(ordine.created_at)}
                    </div>

                    <div style={{ marginBottom: 6 }}>
                      <strong>Data operativa:</strong>{" "}
                      {ordine.data_operativa || "-"}
                    </div>

                    <div style={{ marginBottom: 10 }}>
                      <strong>Stato:</strong>{" "}
                      <span
                        style={{
                          backgroundColor: getColoreStato(ordine.stato),
                          color: "#fff",
                          padding: "4px 8px",
                          borderRadius: 6,
                          fontWeight: "bold",
                          display: "inline-block",
                        }}
                      >
                        {(ordine.stato || "bozza").toUpperCase()}
                      </span>
                    </div>

                    <div style={{ marginBottom: 6 }}>
                      <strong>Note:</strong> {ordine.note_generali || "-"}
                    </div>
                  </div>

                  <div style={{ marginTop: 18 }}>
                    <div
                      style={{
                        fontWeight: "bold",
                        color: "#22c55e",
                        marginBottom: 8,
                        fontSize: 17,
                      }}
                    >
                      Prodotti ordinati
                    </div>

                    {ordine.righe.length === 0 ? (
                      <p style={{ margin: 0 }}>Nessuna riga ordine.</p>
                    ) : (
                      ordine.righe.map((riga) => (
                        <div key={riga.id} style={{ marginBottom: 6 }}>
                          - {riga.prodotto_nome} → {riga.quantita} {riga.unita}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
}