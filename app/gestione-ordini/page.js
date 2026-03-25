"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";

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

function getStileCard(stato) {
  switch (stato) {
    case "bozza":
      return {
        backgroundColor: "#1e293b",
        border: "1px solid #475569",
      };
    case "lavorazione":
      return {
        backgroundColor: "#3b2f12",
        border: "1px solid #f59e0b",
      };
    case "pronto":
      return {
        backgroundColor: "#132f52",
        border: "1px solid #3b82f6",
      };
    case "consegnato":
      return {
        backgroundColor: "#0f2f1f",
        border: "1px solid #22c55e",
      };
    default:
      return {
        backgroundColor: "#1e293b",
        border: "1px solid #334155",
      };
  }
}

function bottoneLink(backgroundColor) {
  return {
    padding: "10px 14px",
    border: "1px solid #334155",
    backgroundColor,
    color: "#ffffff",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: "bold",
    textDecoration: "none",
    display: "inline-block",
    textAlign: "center",
  };
}

export default function GestioneOrdiniPage() {
  const [ordini, setOrdini] = useState([]);
  const [caricamento, setCaricamento] = useState(true);

  const [clienteInput, setClienteInput] = useState("");
  const [dataInput, setDataInput] = useState("");
  const [statoInput, setStatoInput] = useState("");

  const [filtroCliente, setFiltroCliente] = useState("");
  const [filtroData, setFiltroData] = useState("");
  const [filtroStato, setFiltroStato] = useState("");

  useEffect(() => {
    caricaOrdini();
  }, []);

  async function caricaOrdini() {
    setCaricamento(true);

    const { data: ordiniData, error: ordiniError } = await supabase
      .from("ordini")
      .select("*")
      .order("id", { ascending: false });

    if (ordiniError) {
      console.error("Errore caricamento ordini:", ordiniError);
      alert(JSON.stringify(ordiniError, null, 2));
      setCaricamento(false);
      return;
    }

    const { data: clientiData, error: clientiError } = await supabase
      .from("clienti")
      .select("id, nome");

    if (clientiError) {
      console.error("Errore caricamento clienti:", clientiError);
      alert(JSON.stringify(clientiError, null, 2));
      setCaricamento(false);
      return;
    }

    const { data: righeData, error: righeError } = await supabase
      .from("righe_ordine")
      .select("*");

    if (righeError) {
      console.error("Errore caricamento righe:", righeError);
      alert(JSON.stringify(righeError, null, 2));
      setCaricamento(false);
      return;
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

    const clientiMap = {};
    for (const cliente of clientiData || []) {
      clientiMap[cliente.id] = cliente.nome;
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
      cliente_nome: clientiMap[ordine.cliente_id] || "Cliente sconosciuto",
      righe: righePerOrdine[ordine.id] || [],
    }));

    setOrdini(ordiniFinali);
    setCaricamento(false);
  }

  async function aggiornaStato(ordineId, nuovoStato) {
    const { error } = await supabase
      .from("ordini")
      .update({ stato: nuovoStato })
      .eq("id", ordineId);

    if (error) {
      console.error("Errore aggiornamento stato:", error);
      alert(JSON.stringify(error, null, 2));
      return;
    }

    caricaOrdini();
  }

  async function eliminaOrdine(ordineId) {
    const conferma = confirm(
      `Vuoi eliminare davvero l'ordine #${ordineId}? Questa azione non si può annullare.`
    );

    if (!conferma) return;

    const { error: righeError } = await supabase
      .from("righe_ordine")
      .delete()
      .eq("ordine_id", ordineId);

    if (righeError) {
      console.error("Errore eliminazione righe ordine:", righeError);
      alert(JSON.stringify(righeError, null, 2));
      return;
    }

    const { error: ordineError } = await supabase
      .from("ordini")
      .delete()
      .eq("id", ordineId);

    if (ordineError) {
      console.error("Errore eliminazione ordine:", ordineError);
      alert(JSON.stringify(ordineError, null, 2));
      return;
    }

    caricaOrdini();
  }

  function filtraRighePerStampa(righe, tipo) {
    return righe.filter((r) => r.stampa === tipo);
  }

  function applicaFiltri() {
    setFiltroCliente(clienteInput);
    setFiltroData(dataInput);
    setFiltroStato(statoInput);
  }

  function azzeraFiltri() {
    setClienteInput("");
    setDataInput("");
    setStatoInput("");
    setFiltroCliente("");
    setFiltroData("");
    setFiltroStato("");
  }

  const dataOperativaOggi = getDataOperativaOggi();

  const ordiniFiltrati = useMemo(() => {
    return ordini.filter((o) => {
      const matchCliente = filtroCliente
        ? (o.cliente_nome || "")
            .toLowerCase()
            .includes(filtroCliente.toLowerCase())
        : true;

      const matchData = filtroData ? o.data_operativa === filtroData : true;
      const matchStato = filtroStato ? (o.stato || "") === filtroStato : true;

      return matchCliente && matchData && matchStato;
    });
  }, [ordini, filtroCliente, filtroData, filtroStato]);

  const ordiniOggi = useMemo(() => {
    return ordiniFiltrati.filter((o) => o.data_operativa === dataOperativaOggi);
  }, [ordiniFiltrati, dataOperativaOggi]);

  const storicoOrdini = useMemo(() => {
    return ordiniFiltrati.filter((o) => o.data_operativa !== dataOperativaOggi);
  }, [ordiniFiltrati, dataOperativaOggi]);

  function renderOrdine(ordine) {
    const stileCard = getStileCard(ordine.stato);

    return (
      <div
        key={ordine.id}
        style={{
          ...stileCard,
          borderRadius: 14,
          padding: 20,
          marginBottom: 22,
          boxShadow: "0 4px 14px rgba(0,0,0,0.25)",
        }}
      >
        <div style={{ marginBottom: 14 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 12,
              flexWrap: "wrap",
              marginBottom: 10,
            }}
          >
            <div
              style={{
                fontSize: 22,
                fontWeight: "bold",
                color: "#38bdf8",
              }}
            >
              Ordine #{ordine.id}
            </div>

            <button
              onClick={() => eliminaOrdine(ordine.id)}
              style={{
                padding: "8px 12px",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                fontWeight: "bold",
                backgroundColor: "#dc2626",
                color: "#ffffff",
              }}
            >
              Elimina ordine
            </button>
          </div>

          <div style={{ marginBottom: 6 }}>
            <strong>Cliente:</strong> {ordine.cliente_nome}
          </div>

          <div style={{ marginBottom: 6 }}>
            <strong>Data invio:</strong> {formatDataOra(ordine.created_at)}
          </div>

          <div style={{ marginBottom: 6 }}>
            <strong>Data operativa:</strong> {ordine.data_operativa || "-"}
          </div>

          <div style={{ marginBottom: 10 }}>
            <strong>Stato attuale:</strong>{" "}
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

          <div
            style={{
              marginBottom: 12,
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            {["bozza", "lavorazione", "pronto", "consegnato"].map((stato) => (
              <button
                key={stato}
                onClick={() => aggiornaStato(ordine.id, stato)}
                style={{
                  padding: "8px 12px",
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontWeight: "bold",
                  backgroundColor:
                    ordine.stato === stato ? getColoreStato(stato) : "#334155",
                  color: "#fff",
                }}
              >
                {stato.toUpperCase()}
              </button>
            ))}
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
            Ordine completo
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

        <div style={{ marginTop: 18 }}>
          <div
            style={{
              fontWeight: "bold",
              color: "#facc15",
              marginBottom: 8,
              fontSize: 17,
            }}
          >
            Stampa Andrea
          </div>

          {filtraRighePerStampa(ordine.righe, "ANDREA").length === 0 ? (
            <p style={{ margin: 0 }}>Nessun prodotto Andrea.</p>
          ) : (
            filtraRighePerStampa(ordine.righe, "ANDREA").map((riga) => (
              <div key={`andrea-${riga.id}`} style={{ marginBottom: 6 }}>
                - {riga.prodotto_nome} → {riga.quantita} {riga.unita}
              </div>
            ))
          )}
        </div>

        <div style={{ marginTop: 18 }}>
          <div
            style={{
              fontWeight: "bold",
              color: "#fb923c",
              marginBottom: 8,
              fontSize: 17,
            }}
          >
            Stampa Raffaele
          </div>

          {filtraRighePerStampa(ordine.righe, "RAFFAELE").length === 0 ? (
            <p style={{ margin: 0 }}>Nessun prodotto Raffaele.</p>
          ) : (
            filtraRighePerStampa(ordine.righe, "RAFFAELE").map((riga) => (
              <div key={`raffaele-${riga.id}`} style={{ marginBottom: 6 }}>
                - {riga.prodotto_nome} → {riga.quantita} {riga.unita}
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

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
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 24,
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <h1 style={{ margin: 0, fontSize: 32 }}>Gestione Ordini</h1>

          <div
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <a href="/stampa/andrea" style={bottoneLink("#16a34a")}>
              Stampa Andrea
            </a>

            <a href="/stampa/raffaele" style={bottoneLink("#f97316")}>
              Stampa Raffaele
            </a>

            <a href="/stampa/totale" style={bottoneLink("#0ea5e9")}>
              Stampa Totale
            </a>

            <button
              onClick={caricaOrdini}
              style={{
                padding: "10px 14px",
                border: "1px solid #334155",
                backgroundColor: "#1e293b",
                color: "#ffffff",
                borderRadius: 8,
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              Aggiorna
            </button>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            marginBottom: 28,
          }}
        >
          <input
            type="text"
            placeholder="Cerca cliente..."
            value={clienteInput}
            onChange={(e) => setClienteInput(e.target.value)}
            style={{
              padding: "10px 12px",
              minWidth: 220,
              borderRadius: 8,
              border: "1px solid #334155",
              backgroundColor: "#1e293b",
              color: "#ffffff",
            }}
          />

          <input
            type="date"
            value={dataInput}
            onChange={(e) => setDataInput(e.target.value)}
            style={{
              padding: "10px 12px",
              borderRadius: 8,
              border: "1px solid #334155",
              backgroundColor: "#1e293b",
              color: "#ffffff",
            }}
          />

          <select
            value={statoInput}
            onChange={(e) => setStatoInput(e.target.value)}
            style={{
              padding: "10px 12px",
              borderRadius: 8,
              border: "1px solid #334155",
              backgroundColor: "#1e293b",
              color: "#ffffff",
              minWidth: 180,
            }}
          >
            <option value="">Tutti gli stati</option>
            <option value="bozza">BOZZA</option>
            <option value="lavorazione">LAVORAZIONE</option>
            <option value="pronto">PRONTO</option>
            <option value="consegnato">CONSEGNATO</option>
          </select>

          <button
            onClick={applicaFiltri}
            style={{
              padding: "10px 14px",
              border: "1px solid #334155",
              backgroundColor: "#2563eb",
              color: "#ffffff",
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            Cerca
          </button>

          <button
            onClick={azzeraFiltri}
            style={{
              padding: "10px 14px",
              border: "1px solid #334155",
              backgroundColor: "#1e293b",
              color: "#ffffff",
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            Azzera filtri
          </button>
        </div>

        <div style={{ marginBottom: 30 }}>
          <div
            style={{
              fontSize: 22,
              fontWeight: "bold",
              color: "#22c55e",
              marginBottom: 14,
            }}
          >
            Ordini di oggi (scadenza 05:00)
          </div>

          {caricamento ? (
            <p>Caricamento ordini...</p>
          ) : ordiniOggi.length === 0 ? (
            <p>Nessun ordine per la giornata operativa corrente.</p>
          ) : (
            ordiniOggi.map(renderOrdine)
          )}
        </div>

        <div style={{ marginTop: 40 }}>
          <div
            style={{
              fontSize: 22,
              fontWeight: "bold",
              color: "#94a3b8",
              marginBottom: 14,
            }}
          >
            Storico ordini
          </div>

          {caricamento ? null : storicoOrdini.length === 0 ? (
            <p>Nessun ordine storico.</p>
          ) : (
            storicoOrdini.map(renderOrdine)
          )}
        </div>
      </div>
    </div>
  );
}