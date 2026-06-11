"use client";

import { Suspense, useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";

import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";

const COLONNE_PER_PAGINA = 8;
const RIGHE_PER_PAGINA = 3;
const CELLE_PER_PAGINA = COLONNE_PER_PAGINA * RIGHE_PER_PAGINA;
const RIGHE_PRODOTTO_PER_CELLA = 10;

function chunkArray(array, size) {
  const risultato = [];

  for (let i = 0; i < array.length; i += size) {
    risultato.push(array.slice(i, i + size));
  }

  return risultato;
}

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

function CellaOrdineSortable({ cella }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: cella.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.55 : 1,
    zIndex: isDragging ? 999 : "auto",
    position: "relative",
  };

  const righeVisuali = [...cella.prodotti];

  while (righeVisuali.length < RIGHE_PRODOTTO_PER_CELLA) {
    righeVisuali.push(null);
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="cella-ordine"
      {...attributes}
      {...listeners}
    >
      <div className="cliente">
        <div>{cella.cliente}</div>

        {cella.totaleParti > 1 ? (
          <div className="continua">continuazione {cella.parte}</div>
        ) : null}
      </div>

      <div className="lista-prodotti">
        {righeVisuali.map((p, i) =>
          p ? (
            <div className="riga-prodotto" key={`${cella.id}-${i}`}>
              <div className="quantita">
                {p.quantita} {p.unita}
              </div>

              <div className="prodotto">
                {p.nome}
                {p.note ? <div className="nota-riga">Nota: {p.note}</div> : null}
              </div>
            </div>
          ) : (
            <div
              className="riga-prodotto riga-prodotto-vuota"
              key={`${cella.id}-vuota-${i}`}
            >
              <div className="quantita">&nbsp;</div>
              <div className="prodotto">&nbsp;</div>
            </div>
          )
        )}
      </div>
    </div>
  );
}

function CellaVuotaSortable({ cella }) {
  const { setNodeRef, transform, transition, isOver } = useSortable({
    id: cella.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    backgroundColor: isOver ? "#f3f4f6" : "#ffffff",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="cella-vuota cella-vuota-sortable"
    />
  );
}

function StampaTotaleContent() {
  const [dati, setDati] = useState({});
  const [caricamento, setCaricamento] = useState(true);
  const [ordineCelle, setOrdineCelle] = useState([]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  useEffect(() => {
    caricaDati();
  }, []);

  async function caricaDati() {
    setCaricamento(true);

    const { data: ordini, error: ordiniError } = await supabase
      .from("ordini")
      .select("*")
      .eq("stato", "bozza")
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

    const idsOrdini = (ordini || []).map((o) => o.id);

    let righe = [];

    if (idsOrdini.length > 0) {
      const response = await supabase
        .from("righe_ordine")
        .select("*")
        .in("ordine_id", idsOrdini);

      if (response.error) {
        console.error("Errore righe ordine:", response.error);
        alert("Errore nel caricamento righe ordine");
        setCaricamento(false);
        return;
      }

      righe = response.data || [];
    }

    const idsProdotti = [...new Set(righe.map((r) => r.prodotto_id))];

    let prodotti = [];

    if (idsProdotti.length > 0) {
      const response = await supabase
        .from("prodotti_v2")
        .select("id, nome, ordine_visualizzazione")
        .in("id", idsProdotti);

      if (response.error) {
        console.error("Errore prodotti:", response.error);
        alert("Errore nel caricamento prodotti");
        setCaricamento(false);
        return;
      }

      prodotti = response.data || [];
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
      const clienteNome =
        ordine.cliente_nome_manuale ||
        clientiMap[ordine.cliente_id] ||
        "Cliente sconosciuto";

      const righeOrdine = (righe || []).filter(
        (r) => r.ordine_id === ordine.id
      );

      if (righeOrdine.length > 0) {
        if (!risultato[clienteNome]) {
          risultato[clienteNome] = [];
        }

        righeOrdine.forEach((r) => {
          risultato[clienteNome].push({
            nome: prodottiMap[r.prodotto_id]?.nome || "Prodotto sconosciuto",
            ordine_visualizzazione:
              prodottiMap[r.prodotto_id]?.ordine_visualizzazione ?? 9999,
            quantita: r.quantita,
            unita: r.unita,
            note: r.note || "",
          });
        });

        risultato[clienteNome].sort(
          (a, b) =>
            a.ordine_visualizzazione - b.ordine_visualizzazione ||
            a.nome.localeCompare(b.nome, "it")
        );
      }
    });

    const risultatoOrdinato = Object.fromEntries(
      Object.entries(risultato).sort((a, b) =>
        a[0].localeCompare(b[0], "it")
      )
    );

    setDati(risultatoOrdinato);
    setOrdineCelle([]);
    setCaricamento(false);
  }

  function stampaPagina() {
    window.print();
  }

  const clientiArray = Object.entries(dati).map(([cliente, prodotti]) => ({
    cliente,
    prodotti,
  }));

  const celleOrdini = [];

  clientiArray.forEach((blocco) => {
    const partiProdotti = chunkArray(
      blocco.prodotti,
      RIGHE_PRODOTTO_PER_CELLA
    );

    if (partiProdotti.length === 0) {
      celleOrdini.push({
        id: `${blocco.cliente}__parte__1`,
        cliente: blocco.cliente,
        prodotti: [],
        parte: 1,
        totaleParti: 1,
        vuota: false,
      });

      return;
    }

    partiProdotti.forEach((prodotti, index) => {
      celleOrdini.push({
        id: `${blocco.cliente}__parte__${index + 1}`,
        cliente: blocco.cliente,
        prodotti,
        parte: index + 1,
        totaleParti: partiProdotti.length,
        vuota: false,
      });
    });
  });

  const idsOrdini = celleOrdini.map((cella) => cella.id);

  const numeroSlotTotali = Math.max(
    CELLE_PER_PAGINA,
    Math.ceil(idsOrdini.length / CELLE_PER_PAGINA) * CELLE_PER_PAGINA
  );

  const numeroCelleVuote = numeroSlotTotali - idsOrdini.length;

  const celleVuote = Array.from({ length: numeroCelleVuote }).map(
    (_, index) => ({
      id: `__vuota__${index}`,
      vuota: true,
    })
  );

  const tutteLeCelleBase = [...celleOrdini, ...celleVuote];

  const celleMap = new Map(tutteLeCelleBase.map((cella) => [cella.id, cella]));
  const idsBase = tutteLeCelleBase.map((cella) => cella.id);

  const idsOrdinati =
    ordineCelle.length > 0
      ? [
          ...ordineCelle.filter((id) => celleMap.has(id)),
          ...idsBase.filter((id) => !ordineCelle.includes(id)),
        ]
      : idsBase;

  const celleOrdinate = idsOrdinati
    .map((id) => celleMap.get(id))
    .filter((cella) => Boolean(cella));

  const pagine = chunkArray(celleOrdinate, CELLE_PER_PAGINA);

  function gestisciFineDrag(event) {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    setOrdineCelle((ordinePrecedente) => {
      const ordineAttuale =
        ordinePrecedente.length > 0 ? ordinePrecedente : idsBase;

      const indiceVecchio = ordineAttuale.indexOf(active.id);
      const indiceNuovo = ordineAttuale.indexOf(over.id);

      if (indiceVecchio === -1 || indiceNuovo === -1) {
        return ordinePrecedente;
      }

      return arrayMove(ordineAttuale, indiceVecchio, indiceNuovo);
    });
  }

  return (
    <div
      style={{
        padding: 10,
        fontFamily: "Arial, sans-serif",
        backgroundColor: "#ffffff",
        color: "#000000",
        minHeight: "100vh",
      }}
    >
      <style>{`
        @page {
          size: A4 landscape;
          margin: 5mm;
        }

        @media print {
          button,
          .no-print {
            display: none !important;
          }

          html,
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
          }

          .pagina-stampa {
            width: 287mm;
            height: 200mm;
            margin: 0 auto 0 auto;
            background: #ffffff;
            box-sizing: border-box;
            border: 1px solid #000000;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            page-break-inside: avoid;
            break-inside: avoid;
          }

          .pagina-stampa:last-child {
            page-break-after: auto;
            break-after: auto;
          }

          .cella-ordine,
          .cella-vuota-sortable {
            cursor: default !important;
            touch-action: auto !important;
          }
        }

        .pagina-stampa {
          width: 287mm;
          height: 200mm;
          margin: 0 auto 0 auto;
          background: #ffffff;
          box-sizing: border-box;
          border: 1px solid #000000;
          display: flex;
          flex-direction: column;
        }

        .intestazione-stampa {
          display: none !important;
          height: 0 !important;
          padding: 0 !important;
          margin: 0 !important;
          border: none !important;
        }

        .griglia-stampa {
          flex: 1;
          display: grid;
          grid-template-columns: repeat(${COLONNE_PER_PAGINA}, 1fr);
          grid-template-rows: repeat(${RIGHE_PER_PAGINA}, 1fr);
        }

        .cella-ordine,
        .cella-vuota {
          border-right: 1px solid #000000;
          border-bottom: 1px solid #000000;
          box-sizing: border-box;
        }

        .cella-ordine:nth-child(${COLONNE_PER_PAGINA}n),
        .cella-vuota:nth-child(${COLONNE_PER_PAGINA}n) {
          border-right: none;
        }

        .cella-ordine {
          padding: 2.5mm;
          overflow: hidden;
          font-size: 9.2px;
          line-height: 1.15;
          cursor: grab;
          touch-action: none;
          user-select: none;
          background: #ffffff;
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        .cella-ordine:active {
          cursor: grabbing;
        }

        .cella-vuota-sortable {
          cursor: default;
          touch-action: none;
          user-select: none;
          background: #ffffff;
        }

        .cliente {
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          border-bottom: 1px solid #000000;
          padding-bottom: 1.5mm;
          margin-bottom: 1.2mm;
          min-height: 8mm;
          display: flex;
          flex-direction: column;
          justify-content: center;
          word-break: break-word;
          flex: 0 0 auto;
        }

        .continua {
          display: none !important;
        }

        .lista-prodotti {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.25mm;
          min-height: 0;
          justify-content: flex-start;
        }

        .riga-prodotto {
          display: flex;
          align-items: flex-start;
          gap: 0.8mm;
          border-bottom: none !important;
          padding: 0;
          min-height: 2.4mm;
          line-height: 1.02;
          overflow: hidden;
        }

        .riga-prodotto-vuota {
          display: none;
        }

        .quantita {
          font-weight: bold;
          white-space: nowrap;
        }

        .prodotto {
          word-break: break-word;
        }

        .nota-riga {
          font-style: italic;
          font-size: 7.5px;
          line-height: 1;
        }
      `}</style>

      <div className="no-print" style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 10,
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <h1 style={{ margin: 0, fontSize: 20 }}>
            Stampa Totale - Griglia Orizzontale TEST
          </h1>

          <button
            onClick={stampaPagina}
            style={{
              padding: "8px 14px",
              border: "none",
              borderRadius: 6,
              backgroundColor: "#111827",
              color: "#ffffff",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            Stampa
          </button>
        </div>
      </div>

      {caricamento ? (
        <p>Caricamento dati...</p>
      ) : celleOrdini.length === 0 ? (
        <p>Nessun ordine in bozza.</p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={gestisciFineDrag}
        >
          <SortableContext items={idsOrdinati} strategy={rectSortingStrategy}>
            {pagine.map((pagina, indexPagina) => {
              return (
                <div className="pagina-stampa" key={`pagina-${indexPagina}`}>
                  <div className="intestazione-stampa">
                    <div>STAMPA TOTALE — ORDINI IN BOZZA</div>
                    <div>
                      Generata: {formatDataOra(new Date().toISOString())}
                    </div>
                    <div>
                      Pagina {indexPagina + 1} di {pagine.length}
                    </div>
                  </div>

                  <div className="griglia-stampa">
                    {pagina.map((cella) =>
                      cella.vuota ? (
                        <CellaVuotaSortable cella={cella} key={cella.id} />
                      ) : (
                        <CellaOrdineSortable cella={cella} key={cella.id} />
                      )
                    )}
                  </div>
                </div>
              );
            })}
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}

export default function StampaTotalePage() {
  return (
    <Suspense fallback={<p>Caricamento...</p>}>
      <StampaTotaleContent />
    </Suspense>
  );
}