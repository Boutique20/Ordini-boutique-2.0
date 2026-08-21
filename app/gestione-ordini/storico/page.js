"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../lib/supabase";

function formatDataOra(dataString) {
  if (!dataString) return "-";

  return new Date(dataString).toLocaleString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDataInput(data) {
  const anno = data.getFullYear();
  const mese = String(data.getMonth() + 1).padStart(2, "0");
  const giorno = String(data.getDate()).padStart(2, "0");

  return `${anno}-${mese}-${giorno}`;
}

function getUltimi30Giorni() {
  const oggi = new Date();
  const inizio = new Date(oggi);

  inizio.setDate(inizio.getDate() - 59);

  return {
    da: formatDataInput(inizio),
    a: formatDataInput(oggi),
  };
}

function dividiInBlocchi(array, dimensione = 200) {
  const blocchi = [];

  for (let i = 0; i < array.length; i += dimensione) {
    blocchi.push(array.slice(i, i + dimensione));
  }

  return blocchi;
}

function getColoreStato(stato) {
  switch (stato) {
    case "bozza":
      return "#64748b";
    case "lavorazione":
      return "#2563eb";
    case "pronto":
      return "#16a34a";
    case "consegnato":
      return "#7c3aed";
    default:
      return "#475569";
  }
}

const ETICHETTE_ZONE = {
  1: "ALTAMURA/GIOVINAZZO",
  2: "BAT",
  3: "BARI/POGGIOFRANCO",
  4: "PALESE/S.SPIRITO/BARI SUD",
};

function getEtichettaZona(zona) {
  const numeroZona = Number(zona);
  const descrizione = ETICHETTE_ZONE[numeroZona];

  if (!descrizione) {
    return `Zona ${zona}`;
  }

  return `Zona ${numeroZona} - ${descrizione}`;
}

export default function StoricoOrdiniTestPage() {
  const intervalloIniziale = useMemo(() => {
    const oggi = formatDataInput(new Date());

    return {
      da: oggi,
      a: oggi,
    };
  }, []);

  const [dataDa, setDataDa] = useState(intervalloIniziale.da);
  const [dataA, setDataA] = useState(intervalloIniziale.a);

  const [cliente, setCliente] = useState("");
  const [tipo, setTipo] = useState("");

  const [ordini, setOrdini] = useState([]);
  const [caricamento, setCaricamento] = useState(false);
  const [errore, setErrore] = useState("");

  useEffect(() => {
    caricaStorico(intervalloIniziale.da, intervalloIniziale.a);
  }, [intervalloIniziale]);

  async function caricaStorico(da = dataDa, a = dataA) {
    if (!da || !a) {
      setErrore("Seleziona entrambe le date.");
      return;
    }

    if (da > a) {
      setErrore("La data iniziale non può essere successiva alla data finale.");
      return;
    }

    setErrore("");
    setCaricamento(true);

    try {
      const dimensionePagina = 500;
      let ordiniCaricati = [];
      let daRiga = 0;

      while (true) {
        const { data: paginaOrdini, error: ordiniError } = await supabase
          .from("ordini")
          .select(
            "id, cliente_id, cliente_nome_manuale, note_generali, stato, data_operativa, zona, created_at"
          )
          .gte("data_operativa", da)
          .lte("data_operativa", a)
          .order("data_operativa", { ascending: false })
          .order("id", { ascending: false })
          .range(
            daRiga,
            daRiga + dimensionePagina - 1
          );

        if (ordiniError) {
          throw ordiniError;
        }

        const pagina = paginaOrdini || [];

        ordiniCaricati.push(...pagina);

        if (pagina.length < dimensionePagina) {
          break;
        }

        daRiga += dimensionePagina;
      }
      const idsOrdini = ordiniCaricati.map((ordine) => ordine.id);

      const risultatiRighe = await Promise.all(
        dividiInBlocchi(idsOrdini).map(async (blocco) => {
          const { data, error } = await supabase
            .from("righe_ordine")
            .select("id, ordine_id, prodotto_id, quantita, unita, note")
            .in("ordine_id", blocco);

          if (error) {
            throw error;
          }

          return data || [];
        })
      );

      const righeData = risultatiRighe.flat();

      const idsClienti = [
        ...new Set(
          ordiniCaricati
            .map((ordine) => ordine.cliente_id)
            .filter((id) => id !== null && id !== undefined)
        ),
      ];

      const risultatiClienti = await Promise.all(
        dividiInBlocchi(idsClienti).map(async (blocco) => {
          const { data, error } = await supabase
            .from("clienti")
            .select("id, nome")
            .in("id", blocco);

          if (error) {
            throw error;
          }

          return data || [];
        })
      );

      const clientiData = risultatiClienti.flat();

      const idsProdotti = [
        ...new Set(
          righeData
            .map((riga) => riga.prodotto_id)
            .filter((id) => id !== null && id !== undefined)
        ),
      ];

      const risultatiProdotti = await Promise.all(
        dividiInBlocchi(idsProdotti).map(async (blocco) => {
          const { data, error } = await supabase
            .from("prodotti_v2")
            .select("id, nome")
            .in("id", blocco);

          if (error) {
            throw error;
          }

          return data || [];
        })
      );

      const prodottiData = risultatiProdotti.flat();

      const clientiMap = {};

      for (const clienteItem of clientiData) {
        clientiMap[clienteItem.id] = clienteItem.nome;
      }

      const prodottiMap = {};

      for (const prodotto of prodottiData) {
        prodottiMap[prodotto.id] = prodotto.nome;
      }

      const righePerOrdine = {};

      for (const riga of righeData) {
        if (!righePerOrdine[riga.ordine_id]) {
          righePerOrdine[riga.ordine_id] = [];
        }

        righePerOrdine[riga.ordine_id].push({
          ...riga,
          prodotto_nome:
            prodottiMap[riga.prodotto_id] || "Prodotto sconosciuto",
        });
      }

      const ordiniFinali = ordiniCaricati.map((ordine) => ({
        ...ordine,

        tipo_ordine:
          ordine.cliente_id !== null && ordine.cliente_id !== undefined
            ? "cliente"
            : "manuale",

        cliente_nome:
          ordine.cliente_nome_manuale ||
          clientiMap[ordine.cliente_id] ||
          "Cliente sconosciuto",

        righe: righePerOrdine[ordine.id] || [],
      }));

      setOrdini(ordiniFinali);
    } catch (error) {
      console.error("Errore caricamento storico ordini:", error);

      setErrore(
        error?.message ||
          "Errore durante il caricamento dello storico ordini."
      );

      setOrdini([]);
    } finally {
      setCaricamento(false);
    }
  }

  function ultimi30Giorni() {
    const intervallo = getUltimi30Giorni();

    setDataDa(intervallo.da);
    setDataA(intervallo.a);
    setCliente("");
    setTipo("");

    caricaStorico(intervallo.da, intervallo.a);
  }

  const ordiniFiltrati = useMemo(() => {
    const testoCliente = cliente.trim().toLowerCase();

    return ordini.filter((ordine) => {
      const matchCliente = testoCliente
        ? (ordine.cliente_nome || "")
            .toLowerCase()
            .includes(testoCliente)
        : true;

      const matchTipo = tipo
        ? ordine.tipo_ordine === tipo
        : true;

      return matchCliente && matchTipo;
    });
  }, [ordini, cliente, tipo]);

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#0f172a",
        color: "#ffffff",
        padding: 30,
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
            marginBottom: 24,
          }}
        >
          <div>
            <h1 style={{ margin: 0, fontSize: 32 }}>
              Storico Ordini
            </h1>

            <div style={{ color: "#94a3b8", marginTop: 6 }}>
              Clienti e ordini manuali - sola lettura
            </div>
          </div>

          <a
            href="/gestione-ordini"
            style={{
              padding: "10px 14px",
              borderRadius: 8,
              backgroundColor: "#334155",
              color: "#ffffff",
              textDecoration: "none",
              fontWeight: "bold",
            }}
          >
            Torna a Gestione Ordini
          </a>
        </div>

        <div
          style={{
            backgroundColor: "#111827",
            border: "1px solid #334155",
            borderRadius: 12,
            padding: 16,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
              alignItems: "flex-end",
            }}
          >
            <label>
              <div style={{ marginBottom: 5 }}>Dal</div>

              <input
                type="date"
                value={dataDa}
                onChange={(e) => setDataDa(e.target.value)}
                style={{
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: "1px solid #475569",
                  backgroundColor: "#1e293b",
                  color: "#ffffff",
                }}
              />
            </label>

            <label>
              <div style={{ marginBottom: 5 }}>Al</div>

              <input
                type="date"
                value={dataA}
                onChange={(e) => setDataA(e.target.value)}
                style={{
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: "1px solid #475569",
                  backgroundColor: "#1e293b",
                  color: "#ffffff",
                }}
              />
            </label>

            <button
              type="button"
              onClick={() => caricaStorico()}
              disabled={caricamento}
              style={{
                padding: "10px 14px",
                borderRadius: 8,
                border: "none",
                backgroundColor: "#2563eb",
                color: "#ffffff",
                fontWeight: "bold",
                cursor: caricamento ? "default" : "pointer",
              }}
            >
              {caricamento ? "Caricamento..." : "Carica intervallo"}
            </button>

            <button
              type="button"
              onClick={ultimi30Giorni}
              disabled={caricamento}
              style={{
                padding: "10px 14px",
                borderRadius: 8,
                border: "1px solid #475569",
                backgroundColor: "#1e293b",
                color: "#ffffff",
                fontWeight: "bold",
                cursor: caricamento ? "default" : "pointer",
              }}
            >
              Ultimi 60 giorni
            </button>
          </div>

          <div
            style={{
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
              marginTop: 16,
            }}
          >
            <input
              type="text"
              placeholder="Cerca cliente..."
              value={cliente}
              onChange={(e) => setCliente(e.target.value)}
              style={{
                padding: "10px 12px",
                minWidth: 220,
                borderRadius: 8,
                border: "1px solid #475569",
                backgroundColor: "#1e293b",
                color: "#ffffff",
              }}
            />

            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              style={{
                padding: "10px 12px",
                borderRadius: 8,
                border: "1px solid #475569",
                backgroundColor: "#1e293b",
                color: "#ffffff",
                minWidth: 190,
              }}
            >
              <option value="">Tutti gli ordini</option>
              <option value="cliente">Clienti registrati</option>
              <option value="manuale">Ordini manuali</option>
            </select>
          </div>
        </div>

        {errore ? (
          <div
            style={{
              backgroundColor: "rgba(220,38,38,0.18)",
              border: "1px solid #ef4444",
              borderRadius: 10,
              padding: 14,
              marginBottom: 20,
            }}
          >
            {errore}
          </div>
        ) : null}

        <div
          style={{
            marginBottom: 18,
            color: "#cbd5e1",
            fontWeight: "bold",
          }}
        >
          Ordini visualizzati: {ordiniFiltrati.length}
        </div>

        {caricamento ? (
          <p>Caricamento storico ordini...</p>
        ) : ordiniFiltrati.length === 0 ? (
          <p>Nessun ordine trovato nell'intervallo selezionato.</p>
        ) : (
          ordiniFiltrati.map((ordine) => (
            <div
              key={ordine.id}
              style={{
                backgroundColor: "#111827",
                border: "1px solid #334155",
                borderRadius: 14,
                padding: 20,
                marginBottom: 20,
                boxShadow: "0 4px 14px rgba(0,0,0,0.25)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 12,
                  flexWrap: "wrap",
                  marginBottom: 14,
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 22,
                      fontWeight: "bold",
                      color: "#38bdf8",
                    }}
                  >
                    Ordine #{ordine.id}
                  </div>

                  <div style={{ marginTop: 5, color: "#cbd5e1" }}>
                    {ordine.tipo_ordine === "manuale"
                      ? "ORDINE MANUALE"
                      : "CLIENTE REGISTRATO"}
                  </div>
                </div>

                <span
                  style={{
                    backgroundColor: getColoreStato(ordine.stato),
                    color: "#ffffff",
                    padding: "6px 9px",
                    borderRadius: 7,
                    fontWeight: "bold",
                  }}
                >
                  {(ordine.stato || "bozza").toUpperCase()}
                </span>
              </div>

              <div style={{ marginBottom: 6 }}>
                <strong>Cliente:</strong> {ordine.cliente_nome}
              </div>

              <div style={{ marginBottom: 6 }}>
                <strong>Data operativa:</strong>{" "}
                {ordine.data_operativa || "-"}
              </div>

              <div style={{ marginBottom: 6 }}>
                <strong>Data invio:</strong>{" "}
                {formatDataOra(ordine.created_at)}
              </div>

              <div style={{ marginBottom: 6 }}>
                <strong>Zona:</strong>{" "}
                {ordine.zona === null || ordine.zona === undefined
                  ? "DA ASSEGNARE"
                  : getEtichettaZona(ordine.zona).toUpperCase()}
              </div>

              <div style={{ marginBottom: 14 }}>
                <strong>Note ordine:</strong>{" "}
                {ordine.note_generali || "-"}
              </div>

              <div
                style={{
                  borderTop: "1px solid #334155",
                  paddingTop: 14,
                }}
              >
                <div
                  style={{
                    fontWeight: "bold",
                    color: "#22c55e",
                    marginBottom: 10,
                  }}
                >
                  Prodotti
                </div>

                {ordine.righe.length === 0 ? (
                  <div>Nessuna riga ordine.</div>
                ) : (
                  ordine.righe.map((riga) => (
                    <div
                      key={riga.id}
                      style={{
                        marginBottom: 9,
                        paddingBottom: 9,
                        borderBottom: "1px solid #1e293b",
                      }}
                    >
                      <div>
                        {riga.prodotto_nome} - {riga.quantita}{" "}
                        {riga.unita}
                      </div>

                      {riga.note ? (
                        <div
                          style={{
                            color: "#cbd5e1",
                            marginTop: 3,
                            fontSize: 14,
                          }}
                        >
                          Nota: {riga.note}
                        </div>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}