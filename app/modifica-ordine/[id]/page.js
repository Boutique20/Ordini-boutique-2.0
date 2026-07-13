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

function bottone(backgroundColor) {
  return {
    padding: "12px 16px",
    border: "none",
    borderRadius: 10,
    backgroundColor,
    color: "#ffffff",
    fontWeight: "bold",
    cursor: "pointer",
    fontSize: 15,
  };
}

export default function ModificaOrdineTestPage() {
  const params = useParams();
  const ordineId = params?.id;

  const [ordine, setOrdine] = useState(null);
  const [righe, setRighe] = useState([]);
  const [prodotti, setProdotti] = useState([]);
  const [unitaProdotti, setUnitaProdotti] = useState({});
  const [caricamento, setCaricamento] = useState(true);
  const [salvataggio, setSalvataggio] = useState(false);
  const [dataOperativaOriginale, setDataOperativaOriginale] = useState("");

  const [prodottoDaAggiungere, setProdottoDaAggiungere] = useState("");
  const [quantitaNuova, setQuantitaNuova] = useState("");
  const [unitaNuova, setUnitaNuova] = useState("KG");
  const [notaNuova, setNotaNuova] = useState("");

  useEffect(() => {
    if (ordineId) {
      caricaDati();
    }
  }, [ordineId]);

  async function caricaDati() {
    setCaricamento(true);

    const { data: ordineData, error: ordineError } = await supabase
      .from("ordini")
      .select("*")
      .eq("id", ordineId)
      .single();

    if (ordineError || !ordineData) {
      console.error("Errore caricamento ordine:", ordineError);
      alert("Ordine non trovato");
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

    const { data: prodottiData, error: prodottiError } = await supabase
      .from("prodotti_v2")
      .select("id, nome, categoria, unita_vendita, ordine_visualizzazione")
      .neq("categoria", "ARCHIVIO")
      .order("categoria", { ascending: true })
      .order("ordine_visualizzazione", { ascending: true, nullsFirst: false })
      .order("nome", { ascending: true });

    if (prodottiError) {
      console.error("Errore caricamento prodotti:", prodottiError);
      alert(JSON.stringify(prodottiError, null, 2));
      setCaricamento(false);
      return;
    }

    const { data: unitaData, error: unitaError } = await supabase
      .from("prodotti_unita")
      .select("prodotto_id, unita");

    if (unitaError) {
      console.error("Errore caricamento unità:", unitaError);
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

    for (const prodotto of prodottiData || []) {
      if (!mappaUnita[prodotto.id] || mappaUnita[prodotto.id].length === 0) {
        mappaUnita[prodotto.id] = [prodotto.unita_vendita || "KG"];
      }
    }

    const { data: righeData, error: righeError } = await supabase
      .from("righe_ordine")
      .select("*")
      .eq("ordine_id", ordineId)
      .order("id", { ascending: true });

    if (righeError) {
      console.error("Errore caricamento righe:", righeError);
      alert(JSON.stringify(righeError, null, 2));
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

    const righeFinali = (righeData || []).map((riga) => ({
      ...riga,
      prodotto_nome:
        prodottiMap[riga.prodotto_id]?.nome || "Prodotto sconosciuto",
      quantita: String(riga.quantita ?? ""),
      unita: riga.unita || "KG",
      note: riga.note || "",
      nuova: false,
      eliminata: false,
    }));

    const clienteNome =
      ordineData.cliente_nome_manuale ||
      clientiMap[ordineData.cliente_id] ||
      "Cliente sconosciuto";

    setOrdine({
      ...ordineData,
      cliente_nome_visuale: clienteNome,
      note_generali: ordineData.note_generali || "",
      cliente_nome_manuale: ordineData.cliente_nome_manuale || "",
    });

    setDataOperativaOriginale(ordineData.data_operativa || "");
    setRighe(righeFinali);
    setProdotti(prodottiData || []);
    setUnitaProdotti(mappaUnita);

    const primoProdotto = (prodottiData || [])[0];

    if (primoProdotto) {
      setProdottoDaAggiungere(String(primoProdotto.id));
      setUnitaNuova((mappaUnita[primoProdotto.id] || ["KG"])[0]);
    }

    setCaricamento(false);
  }

  function aggiornaOrdine(campo, valore) {
    setOrdine((prev) => ({
      ...prev,
      [campo]: valore,
    }));
  }

  function aggiornaRiga(rigaId, campo, valore) {
    setRighe((prev) =>
      prev.map((riga) =>
        riga.id === rigaId ? { ...riga, [campo]: valore } : riga
      )
    );
  }

  function eliminaRiga(rigaId) {
    const conferma = confirm("Vuoi eliminare questa riga dall'ordine?");
    if (!conferma) return;

    setRighe((prev) =>
      prev.map((riga) =>
        riga.id === rigaId ? { ...riga, eliminata: true } : riga
      )
    );
  }

  function ripristinaRiga(rigaId) {
    setRighe((prev) =>
      prev.map((riga) =>
        riga.id === rigaId ? { ...riga, eliminata: false } : riga
      )
    );
  }

  function cambiaProdottoDaAggiungere(prodottoId) {
    setProdottoDaAggiungere(prodottoId);

    const idNumerico = Number(prodottoId);
    const opzioni = unitaProdotti[idNumerico] || ["KG"];
    setUnitaNuova(opzioni[0] || "KG");
  }

  function aggiungiProdotto() {
    if (!prodottoDaAggiungere) {
      alert("Seleziona un prodotto da aggiungere");
      return;
    }

    if (
      quantitaNuova === undefined ||
      quantitaNuova === "" ||
      Number(quantitaNuova) <= 0
    ) {
      alert("Inserisci una quantità valida");
      return;
    }

    const prodottoId = Number(prodottoDaAggiungere);
    const prodotto = prodotti.find((p) => p.id === prodottoId);

    if (!prodotto) {
      alert("Prodotto non trovato");
      return;
    }

    const nuovaRiga = {
      id: `nuova-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      ordine_id: Number(ordineId),
      prodotto_id: prodottoId,
      prodotto_nome: prodotto.nome,
      quantita: String(quantitaNuova),
      unita: unitaNuova || "KG",
      note: notaNuova || "",
      nuova: true,
      eliminata: false,
    };

    setRighe((prev) => [...prev, nuovaRiga]);

    setQuantitaNuova("");
    setNotaNuova("");
  }

  const righeVisibili = useMemo(() => {
    return righe.filter((riga) => !riga.eliminata);
  }, [righe]);

  const ordineManuale = ordine
    ? !ordine.cliente_id || ordine.cliente_nome_manuale
    : false;

  async function salvaModifiche() {
    if (!ordine) return;

    const righeDaSalvare = righe.filter((riga) => !riga.eliminata);

    if (righeDaSalvare.length === 0) {
      alert("L'ordine deve avere almeno una riga prodotto.");
      return;
    }

    for (const riga of righeDaSalvare) {
      if (
        riga.quantita === undefined ||
        riga.quantita === "" ||
        Number(riga.quantita) <= 0
      ) {
        alert(`Quantità non valida per: ${riga.prodotto_nome}`);
        return;
      }
    }

    if (ordineManuale && !ordine.cliente_nome_manuale.trim()) {
      alert("Inserisci il nome cliente per l'ordine manuale.");
      return;
    }

    const conferma = confirm("Confermi il salvataggio delle modifiche?");
    if (!conferma) return;

    setSalvataggio(true);

    const dataOperativa = (ordine.data_operativa || "").trim();

    if (!/^\d{4}-\d{2}-\d{2}$/.test(dataOperativa)) {
      alert("Inserisci una data esecuzione valida.");
      setSalvataggio(false);
      return;
    }

    if (dataOperativa !== dataOperativaOriginale) {
      const confermaSpostamento = confirm(
        `Stai spostando l'ordine dalla data ${dataOperativaOriginale || "-"} alla data ${dataOperativa}. Confermi?`
      );

      if (!confermaSpostamento) {
        setSalvataggio(false);
        return;
      }
    }

    const datiOrdineDaAggiornare = {
      note_generali: ordine.note_generali || null,
      data_operativa: dataOperativa,
    };

    if (ordineManuale) {
      datiOrdineDaAggiornare.cliente_nome_manuale =
        ordine.cliente_nome_manuale.trim();
    }

    const { error: ordineError } = await supabase
      .from("ordini")
      .update(datiOrdineDaAggiornare)
      .eq("id", ordine.id);

    if (ordineError) {
      console.error("Errore aggiornamento ordine:", ordineError);
      alert(JSON.stringify(ordineError, null, 2));
      setSalvataggio(false);
      return;
    }

    const righeDaEliminare = righe.filter(
      (riga) => riga.eliminata && !riga.nuova
    );

    if (righeDaEliminare.length > 0) {
      const idsDaEliminare = righeDaEliminare.map((riga) => riga.id);

      const { error: eliminaError } = await supabase
        .from("righe_ordine")
        .delete()
        .in("id", idsDaEliminare);

      if (eliminaError) {
        console.error("Errore eliminazione righe:", eliminaError);
        alert(JSON.stringify(eliminaError, null, 2));
        setSalvataggio(false);
        return;
      }
    }

    const righeEsistentiDaAggiornare = righe.filter(
      (riga) => !riga.eliminata && !riga.nuova
    );

    for (const riga of righeEsistentiDaAggiornare) {
      const { error: updateRigaError } = await supabase
        .from("righe_ordine")
        .update({
          quantita: Number(riga.quantita),
          unita: riga.unita || "KG",
          note: riga.note || null,
        })
        .eq("id", riga.id);

      if (updateRigaError) {
        console.error("Errore aggiornamento riga:", updateRigaError);
        alert(JSON.stringify(updateRigaError, null, 2));
        setSalvataggio(false);
        return;
      }
    }

    const righeNuoveDaInserire = righe.filter(
      (riga) => !riga.eliminata && riga.nuova
    );

    if (righeNuoveDaInserire.length > 0) {
      const righeInsert = righeNuoveDaInserire.map((riga) => ({
        ordine_id: ordine.id,
        prodotto_id: riga.prodotto_id,
        quantita: Number(riga.quantita),
        unita: riga.unita || "KG",
        note: riga.note || null,
      }));

      const { error: insertError } = await supabase
        .from("righe_ordine")
        .insert(righeInsert);

      if (insertError) {
        console.error("Errore inserimento nuove righe:", insertError);
        alert(JSON.stringify(insertError, null, 2));
        setSalvataggio(false);
        return;
      }
    }

    alert("Ordine modificato correttamente.");

    window.location.href = "/gestione-ordini";
  }

  if (caricamento) {
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
        Caricamento ordine...
      </div>
    );
  }

  if (!ordine) {
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
        Ordine non trovato.
      </div>
    );
  }

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
            <h1 style={{ margin: 0, fontSize: 30 }}>
              Modifica ordine #{ordine.id}
            </h1>
            <div style={{ marginTop: 8, color: "#cbd5e1" }}>
              Data invio: {formatDataOra(ordine.created_at)}
            </div>
          </div>

          <a
            href="/gestione-ordini"
            style={{
              ...bottone("#334155"),
              textDecoration: "none",
              display: "inline-block",
            }}
          >
            Torna a Gestione Ordini TEST
          </a>
        </div>

        <div
          style={{
            backgroundColor: "#111827",
            border: "1px solid #334155",
            borderRadius: 14,
            padding: 20,
            marginBottom: 22,
          }}
        >
          <div style={{ marginBottom: 16 }}>
            <strong>Tipo ordine:</strong>{" "}
            {ordineManuale ? "Ordine manuale" : "Ordine cliente"}
          </div>

          {ordineManuale ? (
            <div style={{ marginBottom: 16 }}>
              <div
                style={{
                  fontWeight: "bold",
                  marginBottom: 8,
                  color: "#7dd3fc",
                }}
              >
                Nome cliente manuale
              </div>

              <input
                type="text"
                value={ordine.cliente_nome_manuale}
                onChange={(e) =>
                  aggiornaOrdine("cliente_nome_manuale", e.target.value)
                }
                style={{
                  width: "100%",
                  padding: 12,
                  borderRadius: 10,
                  border: "1px solid #475569",
                  backgroundColor: "#1e293b",
                  color: "#ffffff",
                  fontSize: 16,
                  boxSizing: "border-box",
                }}
              />
            </div>
          ) : (
            <div style={{ marginBottom: 16 }}>
              <strong>Cliente:</strong> {ordine.cliente_nome_visuale}
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <strong>Stato:</strong> {(ordine.stato || "bozza").toUpperCase()}
          </div>

          <div style={{ marginBottom: 16 }}>
            <div
              style={{
                fontWeight: "bold",
                marginBottom: 8,
                color: "#7dd3fc",
              }}
            >
              Data esecuzione ordine
            </div>

            <input
              type="date"
              value={ordine.data_operativa || ""}
              onChange={(e) =>
                aggiornaOrdine("data_operativa", e.target.value)
              }
              style={{
                width: "100%",
                maxWidth: 320,
                padding: 12,
                borderRadius: 10,
                border: "1px solid #475569",
                backgroundColor: "#0f172a",
                color: "#ffffff",
                fontSize: 16,
                boxSizing: "border-box",
              }}
            />

            <div
              style={{
                marginTop: 8,
                color: "#cbd5e1",
                fontSize: 13,
              }}
            >
              Questa data determina la giornata in cui l'ordine sarà lavorato e
              visualizzato nelle stampe.
            </div>
          </div>

          <div>
            <div
              style={{
                fontWeight: "bold",
                marginBottom: 8,
                color: "#7dd3fc",
              }}
            >
              Note generali ordine
            </div>

            <textarea
              rows="3"
              value={ordine.note_generali || ""}
              onChange={(e) => aggiornaOrdine("note_generali", e.target.value)}
              placeholder="Note generali ordine"
              style={{
                width: "100%",
                padding: 12,
                borderRadius: 10,
                border: "1px solid #475569",
                backgroundColor: "#1e293b",
                color: "#ffffff",
                fontSize: 15,
                boxSizing: "border-box",
                resize: "vertical",
              }}
            />
          </div>
        </div>

        <div
          style={{
            backgroundColor: "#111827",
            border: "1px solid #334155",
            borderRadius: 14,
            padding: 20,
            marginBottom: 22,
          }}
        >
          <h2 style={{ marginTop: 0, color: "#22c55e" }}>
            Righe ordine
          </h2>

          {righe.length === 0 ? (
            <p>Nessuna riga ordine.</p>
          ) : (
            righe.map((riga) => {
              const opzioniUnita = unitaProdotti[riga.prodotto_id] || [
                riga.unita || "KG",
              ];

              return (
                <div
                  key={riga.id}
                  style={{
                    opacity: riga.eliminata ? 0.45 : 1,
                    backgroundColor: riga.eliminata ? "#3f1d1d" : "#1e293b",
                    border: riga.eliminata
                      ? "1px solid #ef4444"
                      : "1px solid #334155",
                    borderRadius: 12,
                    padding: 14,
                    marginBottom: 12,
                  }}
                >
                  <div
                    style={{
                      fontWeight: "bold",
                      color: "#f8fafc",
                      marginBottom: 10,
                    }}
                  >
                    {riga.prodotto_nome}
                    {riga.nuova ? (
                      <span
                        style={{
                          marginLeft: 8,
                          color: "#7dd3fc",
                          fontSize: 12,
                        }}
                      >
                        NUOVO
                      </span>
                    ) : null}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: 10,
                      flexWrap: "wrap",
                      alignItems: "center",
                    }}
                  >
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={riga.quantita}
                      disabled={riga.eliminata}
                      onChange={(e) =>
                        aggiornaRiga(riga.id, "quantita", e.target.value)
                      }
                      placeholder="Qtà"
                      style={{
                        width: 100,
                        padding: 10,
                        borderRadius: 8,
                        border: "1px solid #475569",
                        backgroundColor: "#0f172a",
                        color: "#ffffff",
                        fontSize: 15,
                        textAlign: "center",
                      }}
                    />

                    <select
                      value={riga.unita || opzioniUnita[0]}
                      disabled={riga.eliminata}
                      onChange={(e) =>
                        aggiornaRiga(riga.id, "unita", e.target.value)
                      }
                      style={{
                        minWidth: 95,
                        padding: 10,
                        borderRadius: 8,
                        border: "1px solid #475569",
                        backgroundColor: "#0f172a",
                        color: "#ffffff",
                        fontSize: 15,
                        fontWeight: "bold",
                      }}
                    >
                      {opzioniUnita.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>

                    <input
                      type="text"
                      value={riga.note || ""}
                      disabled={riga.eliminata}
                      onChange={(e) =>
                        aggiornaRiga(riga.id, "note", e.target.value)
                      }
                      placeholder="Nota riga"
                      style={{
                        flex: 1,
                        minWidth: 250,
                        padding: 10,
                        borderRadius: 8,
                        border: "1px solid #475569",
                        backgroundColor: "#0f172a",
                        color: "#ffffff",
                        fontSize: 15,
                      }}
                    />

                    {riga.eliminata ? (
                      <button
                        type="button"
                        onClick={() => ripristinaRiga(riga.id)}
                        style={bottone("#16a34a")}
                      >
                        Ripristina
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => eliminaRiga(riga.id)}
                        style={bottone("#dc2626")}
                      >
                        Elimina riga
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div
          style={{
            backgroundColor: "#111827",
            border: "1px solid #334155",
            borderRadius: 14,
            padding: 20,
            marginBottom: 22,
          }}
        >
          <h2 style={{ marginTop: 0, color: "#7dd3fc" }}>
            Aggiungi prodotto
          </h2>

          <div
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <select
              value={prodottoDaAggiungere}
              onChange={(e) => cambiaProdottoDaAggiungere(e.target.value)}
              style={{
                flex: 1,
                minWidth: 260,
                padding: 10,
                borderRadius: 8,
                border: "1px solid #475569",
                backgroundColor: "#0f172a",
                color: "#ffffff",
                fontSize: 15,
              }}
            >
              {prodotti.map((prodotto) => (
                <option key={prodotto.id} value={prodotto.id}>
                  {prodotto.nome}
                </option>
              ))}
            </select>

            <input
              type="number"
              step="0.1"
              min="0"
              value={quantitaNuova}
              onChange={(e) => setQuantitaNuova(e.target.value)}
              placeholder="Qtà"
              style={{
                width: 100,
                padding: 10,
                borderRadius: 8,
                border: "1px solid #475569",
                backgroundColor: "#0f172a",
                color: "#ffffff",
                fontSize: 15,
                textAlign: "center",
              }}
            />

            <select
              value={unitaNuova}
              onChange={(e) => setUnitaNuova(e.target.value)}
              style={{
                minWidth: 95,
                padding: 10,
                borderRadius: 8,
                border: "1px solid #475569",
                backgroundColor: "#0f172a",
                color: "#ffffff",
                fontSize: 15,
                fontWeight: "bold",
              }}
            >
              {(unitaProdotti[Number(prodottoDaAggiungere)] || ["KG"]).map(
                (u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                )
              )}
            </select>

            <input
              type="text"
              value={notaNuova}
              onChange={(e) => setNotaNuova(e.target.value)}
              placeholder="Nota prodotto"
              style={{
                flex: 1,
                minWidth: 220,
                padding: 10,
                borderRadius: 8,
                border: "1px solid #475569",
                backgroundColor: "#0f172a",
                color: "#ffffff",
                fontSize: 15,
              }}
            />

            <button type="button" onClick={aggiungiProdotto} style={bottone("#0ea5e9")}>
              + Aggiungi
            </button>
          </div>
        </div>

        <div
          style={{
            backgroundColor: "#111827",
            border: "1px solid #334155",
            borderRadius: 14,
            padding: 20,
            marginBottom: 22,
          }}
        >
          <h2 style={{ marginTop: 0, color: "#facc15" }}>
            Riepilogo modifiche
          </h2>

          {righeVisibili.length === 0 ? (
            <p>Nessuna riga attiva.</p>
          ) : (
            righeVisibili.map((riga) => (
              <div key={`riepilogo-${riga.id}`} style={{ marginBottom: 6 }}>
                - {riga.prodotto_nome} → {riga.quantita} {riga.unita}
                {riga.note ? ` | Nota: ${riga.note}` : ""}
              </div>
            ))
          )}
        </div>

        <div
          style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <a
            href="/gestione-ordini"
            style={{
              ...bottone("#334155"),
              textDecoration: "none",
              display: "inline-block",
            }}
          >
            Annulla
          </a>

          <button
            type="button"
            onClick={salvaModifiche}
            disabled={salvataggio}
            style={{
              ...bottone(salvataggio ? "#64748b" : "#22c55e"),
              minWidth: 220,
            }}
          >
            {salvataggio ? "Salvataggio..." : "Salva modifiche ordine"}
          </button>
        </div>
      </div>
    </div>
  );
}

