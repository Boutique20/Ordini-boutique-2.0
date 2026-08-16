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

function normalizzaZona(zona) {
  const valore = Number(zona);

  return [1, 2, 3, 4].includes(valore)
    ? valore
    : null;
}

function suddividiIdsPerZona(celle) {
  const gruppi = {
    1: [],
    2: [],
    3: [],
    4: [],
    senzaZona: [],
  };

  celle.forEach((cella) => {
    const zona = normalizzaZona(cella.zona);

    if (zona === null) {
      gruppi.senzaZona.push(cella.id);
      return;
    }

    gruppi[zona].push(cella.id);
  });

  return gruppi;
}

function calcolaPagineZone(gruppi) {
  const principali = Math.max(
    Math.ceil(gruppi[1].length / COLONNE_PER_PAGINA),
    Math.ceil(gruppi[2].length / COLONNE_PER_PAGINA),
    Math.ceil(gruppi[3].length / COLONNE_PER_PAGINA)
  );

  const zona4 = Math.ceil(
    gruppi[4].length / COLONNE_PER_PAGINA
  );

  const senzaZona = Math.ceil(
    gruppi.senzaZona.length / COLONNE_PER_PAGINA
  );

  return {
    principali,
    zona4,
    senzaZona,
    totali: Math.max(
      1,
      principali + zona4 + senzaZona
    ),
  };
}

function creaOrdineAutomaticoPerZone(
  gruppi,
  idsVuoti
) {
  const pagineZone = calcolaPagineZone(gruppi);
  const risultato = [];
  let indiceVuoto = 0;

  function prossimoVuoto() {
    const id = idsVuoti[indiceVuoto];
    indiceVuoto += 1;
    return id;
  }

  function aggiungiRiga(ids, numeroPagina) {
    const inizio =
      numeroPagina * COLONNE_PER_PAGINA;

    for (
      let indice = 0;
      indice < COLONNE_PER_PAGINA;
      indice += 1
    ) {
      risultato.push(
        ids[inizio + indice] || prossimoVuoto()
      );
    }
  }

  function aggiungiRigaVuota() {
    for (
      let indice = 0;
      indice < COLONNE_PER_PAGINA;
      indice += 1
    ) {
      risultato.push(prossimoVuoto());
    }
  }

  /*
   * Pagine principali:
   * riga superiore Zona 1
   * riga centrale Zona 2
   * riga inferiore Zona 3
   */
  for (
    let pagina = 0;
    pagina < pagineZone.principali;
    pagina += 1
  ) {
    aggiungiRiga(gruppi[1], pagina);
    aggiungiRiga(gruppi[2], pagina);
    aggiungiRiga(gruppi[3], pagina);
  }

  /*
   * Zona 4: pagina separata.
   * Si utilizza soltanto la prima riga.
   */
  for (
    let pagina = 0;
    pagina < pagineZone.zona4;
    pagina += 1
  ) {
    aggiungiRiga(gruppi[4], pagina);
    aggiungiRigaVuota();
    aggiungiRigaVuota();
  }

  /*
   * Ordini senza zona: blocco finale.
   */
  for (
    let pagina = 0;
    pagina < pagineZone.senzaZona;
    pagina += 1
  ) {
    aggiungiRiga(gruppi.senzaZona, pagina);
    aggiungiRigaVuota();
    aggiungiRigaVuota();
  }

  /*
   * Mantiene una pagina vuota nel caso
   * in cui non esistano celle.
   */
  if (risultato.length === 0) {
    for (
      let indice = 0;
      indice < CELLE_PER_PAGINA;
      indice += 1
    ) {
      risultato.push(prossimoVuoto());
    }
  }

  return risultato.filter(Boolean);
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
    transform: isDragging ? CSS.Transform.toString(transform) : undefined,
    transition: isDragging ? transition : "none",
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
      data-cella-id={cella.id}
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

function CellaDoppiaSortable({ cella, onSepara }) {
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
    transform: isDragging
      ? CSS.Transform.toString(transform)
      : undefined,
    transition: isDragging ? transition : "none",
    opacity: isDragging ? 0.55 : 1,
    zIndex: isDragging ? 999 : "auto",
    position: "relative",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="cella-ordine cella-doppia"
      data-cella-id={cella.id}
      {...attributes}
      {...listeners}
    >
      <button
        type="button"
        className="no-print"
        title="Separa i due clienti"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => {
          event.stopPropagation();
          onSepara?.(cella.id);
        }}
        style={{
          position: "absolute",
          top: 3,
          right: 3,
          border: "none",
          borderRadius: 4,
          padding: "3px 6px",
          backgroundColor: "#dc2626",
          color: "#ffffff",
          fontSize: 9,
          fontWeight: "bold",
          cursor: "pointer",
          zIndex: 5,
        }}
      >
        Separa
      </button>

      {cella.clienti.map((cliente, indexCliente) => (
        <div
          className="blocco-cliente-doppio"
          key={cliente.id}
        >
          <div className="cliente cliente-doppio">
            <div>{cliente.cliente}</div>
          </div>

          <div className="lista-prodotti lista-prodotti-doppia">
            {cliente.prodotti.map((p, indexProdotto) => (
              <div
                className="riga-prodotto"
                key={`${cliente.id}-${indexProdotto}`}
              >
                <div className="quantita">
                  {p.quantita} {p.unita}
                </div>

                <div className="prodotto">
                  {p.nome}
                  {p.note ? (
                    <div className="nota-riga">
                      Nota: {p.note}
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>

          {indexCliente === 0 ? (
            <div className="separatore-clienti-doppi" />
          ) : null}
        </div>
      ))}
    </div>
  );
}

function CellaVuotaSortable({ cella, onElimina }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({
    id: cella.id,
  });

  const style = {
    transform: isDragging
      ? CSS.Transform.toString(transform)
      : undefined,
    transition: isDragging ? transition : "none",
    backgroundColor: isOver ? "#f3f4f6" : "#ffffff",
    opacity: isDragging ? 0.55 : 1,
    position: "relative",
    cursor: cella.manuale ? "grab" : "default",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="cella-vuota cella-vuota-sortable"
      {...(cella.manuale ? attributes : {})}
      {...(cella.manuale ? listeners : {})}
    >
      {cella.manuale ? (
        <>
          <div
            className="no-print"
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#6b7280",
              fontSize: 11,
              fontWeight: "bold",
              pointerEvents: "none",
            }}
          >
            SPAZIO VUOTO
          </div>

          <button
            type="button"
            className="no-print"
            title="Elimina spazio vuoto"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation();
              onElimina?.(cella.id);
            }}
            style={{
              position: "absolute",
              top: 4,
              right: 4,
              width: 24,
              height: 24,
              border: "none",
              borderRadius: 4,
              backgroundColor: "#dc2626",
              color: "#ffffff",
              fontWeight: "bold",
              cursor: "pointer",
              zIndex: 5,
            }}
          >
            {"\u00d7"}
          </button>
        </>
      ) : null}
    </div>
  );
}

function StampaTotaleContent() {
  const [dati, setDati] = useState({});
  const [zoneClienti, setZoneClienti] = useState({});
  const [caricamento, setCaricamento] = useState(true);
  const [ordineCelle, setOrdineCelle] = useState([]);
  const [dataOperativa, setDataOperativa] = useState(getDataOperativa());
  const [meseCalendario, setMeseCalendario] = useState(getDataOperativa().slice(0, 7));
  const [celleDoppie, setCelleDoppie] = useState({});
  const [clienteUnioneA, setClienteUnioneA] = useState("");
  const [clienteUnioneB, setClienteUnioneB] = useState("");
  const [celleVuoteManuali, setCelleVuoteManuali] = useState([]);
  const [layoutCaricato, setLayoutCaricato] = useState(false);
  const [integritaOrigine, setIntegritaOrigine] = useState({
    numeroOrdini: 0,
    numeroRighe: 0,
    ordiniSenzaRighe: [],
    righeProdottoSconosciuto: [],
  });
  const [celleTagliate, setCelleTagliate] = useState([]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  useEffect(() => {
    caricaDati(dataOperativa);
  }, [dataOperativa]);

  async function caricaLayoutSalvato(dataOrdini) {
    const { data, error } = await supabase
      .from("stampa_totale_layout")
      .select("layout, ordine_andrea")
      .eq("data_operativa", dataOrdini)
      .maybeSingle();

    if (error) {
      console.error("Errore caricamento layout:", error);
      setOrdineCelle([]);
      setCelleDoppie({});
      setCelleVuoteManuali([]);
      setLayoutCaricato(true);
      return;
    }

    const layout =
      data?.layout &&
      typeof data.layout === "object" &&
      !Array.isArray(data.layout)
        ? data.layout
        : {};

    setOrdineCelle(
      Array.isArray(layout.ordineCelle) ? layout.ordineCelle : []
    );
    setCelleDoppie(
      layout.celleDoppie && typeof layout.celleDoppie === "object"
        ? layout.celleDoppie
        : {}
    );
    setCelleVuoteManuali(
      Array.isArray(layout.celleVuoteManuali)
        ? layout.celleVuoteManuali
        : []
    );
    setLayoutCaricato(true);
  }

  async function caricaDati(dataSelezionata = dataOperativa) {
    setCaricamento(true);
    setIntegritaOrigine({
      numeroOrdini: 0,
      numeroRighe: 0,
      ordiniSenzaRighe: [],
      righeProdottoSconosciuto: [],
    });

    const { data: ordini, error: ordiniError } = await supabase
      .from("ordini")
      .select("*")
      .eq("stato", "bozza")
      .eq("data_operativa", dataSelezionata)
      .order("id", { ascending: true });

    if (ordiniError) {
      console.error("Errore ordini:", ordiniError);
      alert("Errore nel caricamento ordini");
      setCaricamento(false);
      return;
    }

    const dataOrdini = dataSelezionata;

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
    const zonePerCliente = {};
    const ordiniSenzaRighe = [];
    const righeProdottoSconosciuto = [];

    (ordini || []).forEach((ordine) => {
      const clienteNome =
        ordine.cliente_nome_manuale ||
        clientiMap[ordine.cliente_id] ||
        "Cliente sconosciuto";

      const zonaOrdine = normalizzaZona(
        ordine.zona
      );

      if (
        !Object.prototype.hasOwnProperty.call(
          zonePerCliente,
          clienteNome
        )
      ) {
        zonePerCliente[clienteNome] = zonaOrdine;
      } else if (
        zonePerCliente[clienteNome] !== zonaOrdine
      ) {
        /*
         * Se due ordini con lo stesso nome hanno
         * zone differenti, vengono considerati
         * senza una zona univoca.
         */
        zonePerCliente[clienteNome] = null;
      }

      const righeOrdine = (righe || []).filter(
        (r) => r.ordine_id === ordine.id
      );

      if (righeOrdine.length === 0) {
        ordiniSenzaRighe.push({
          ordineId: ordine.id,
          cliente: clienteNome,
        });
      }

      if (righeOrdine.length > 0) {
        if (!risultato[clienteNome]) {
          risultato[clienteNome] = [];
        }

        righeOrdine.forEach((r) => {
          if (!prodottiMap[r.prodotto_id]) {
            righeProdottoSconosciuto.push({
              rigaId: r.id,
              ordineId: ordine.id,
              cliente: clienteNome,
              prodottoId: r.prodotto_id,
            });
          }

          risultato[clienteNome].push({
            riga_id: r.id,
            ordine_id: ordine.id,
            prodotto_id: r.prodotto_id,
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

    setIntegritaOrigine({
      numeroOrdini: (ordini || []).length,
      numeroRighe: (righe || []).length,
      ordiniSenzaRighe,
      righeProdottoSconosciuto,
    });

    setZoneClienti(zonePerCliente);
    setDati(risultatoOrdinato);
    await caricaLayoutSalvato(dataOrdini);
    setCaricamento(false);
  }

  function aggiungiCellaVuota() {
    const nuovoId = `__vuota__manuale_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 8)}`;

    setCelleVuoteManuali((precedenti) => [
      ...precedenti,
      nuovoId,
    ]);

    setOrdineCelle((ordinePrecedente) => {
      const ordineAttuale =
        ordinePrecedente.length > 0
          ? [...ordinePrecedente]
          : [...idsBase];

      return [...ordineAttuale, nuovoId];
    });
  }

  function eliminaCellaVuota(idCella) {
    const collegataAUnione = Object.values(celleDoppie).some(
      (gruppo) => gruppo?.idCellaVuota === idCella
    );

    if (collegataAUnione) {
      alert(
        "Questa cella vuota mantiene libera la posizione di un cliente unito. Separa prima i clienti."
      );
      return;
    }

    setCelleVuoteManuali((precedenti) =>
      precedenti.filter((id) => id !== idCella)
    );

    setOrdineCelle((ordinePrecedente) =>
      ordinePrecedente.filter((id) => id !== idCella)
    );
  }

  async function salvaOrdineStampe() {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dataOperativa)) {
      alert("Data operativa non valida: impossibile salvare la disposizione.");
      return;
    }

    const ordineDaSalvare = [...idsOrdinati];

    const ordineAndrea = [];

    ordineDaSalvare.forEach((id) => {
      const idTesto = String(id);

      if (idTesto.startsWith("__vuota__")) {
        return;
      }

      if (idTesto.startsWith("__doppia__")) {
        const clientiDellaCella = Array.isArray(
          celleDoppie[idTesto]?.ids
        )
          ? celleDoppie[idTesto].ids
          : [];

        clientiDellaCella.forEach((idCliente) => {
          ordineAndrea.push(
            String(idCliente).split("__parte__")[0]
          );
        });

        return;
      }

      ordineAndrea.push(idTesto.split("__parte__")[0]);
    });

    const clientiUniciAndrea = [...new Set(ordineAndrea)];

    const layoutDaSalvare = {
      ordineCelle: ordineDaSalvare,
      celleDoppie,
      celleVuoteManuali,
    };

    const { error } = await supabase
      .from("stampa_totale_layout")
      .upsert(
        {
          data_operativa: dataOperativa,
          layout: layoutDaSalvare,
          ordine_andrea: clientiUniciAndrea,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "data_operativa",
        }
      );

    if (error) {
      console.error("Errore salvataggio disposizione:", error);
      alert("Errore durante il salvataggio della disposizione.");
      return;
    }

    localStorage.setItem(
      `ordine-stampe-${dataOperativa}`,
      JSON.stringify(clientiUniciAndrea)
    );

    localStorage.setItem(
      "ordine-stampe-ultimo",
      JSON.stringify(clientiUniciAndrea)
    );

    alert(
      "Disposizione della Stampa Totale e ordine Andrea salvati correttamente."
    );
  }

  function unisciClienti() {
    if (!clienteUnioneA || !clienteUnioneB) {
      alert("Seleziona entrambi i clienti da unire.");
      return;
    }

    if (clienteUnioneA === clienteUnioneB) {
      alert("Devi selezionare due clienti diversi.");
      return;
    }

    const cellaA = celleOrdiniMap.get(clienteUnioneA);
    const cellaB = celleOrdiniMap.get(clienteUnioneB);

    if (!cellaA || !cellaB) {
      alert("Una delle due celle non è più disponibile.");
      return;
    }

    if (cellaA.totaleParti !== 1 || cellaB.totaleParti !== 1) {
      alert("Puoi unire soltanto clienti contenuti in una singola cella.");
      return;
    }

    const nuovoId = `__doppia__${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 8)}`;

    const idCellaVuota = `__vuota__manuale_unione_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 8)}`;

    setCelleDoppie((precedenti) => ({
      ...precedenti,
      [nuovoId]: {
        ids: [clienteUnioneA, clienteUnioneB],
        idCellaVuota,
      },
    }));

    setCelleVuoteManuali((precedenti) => [
      ...precedenti,
      idCellaVuota,
    ]);

    setOrdineCelle((ordinePrecedente) => {
      const ordineAttuale =
        ordinePrecedente.length > 0
          ? [...ordinePrecedente]
          : [...idsBase];

      const indiceA = ordineAttuale.indexOf(clienteUnioneA);
      const indiceB = ordineAttuale.indexOf(clienteUnioneB);

      if (indiceA === -1 || indiceB === -1) {
        return ordinePrecedente;
      }

      const primoIndice = Math.min(indiceA, indiceB);
      const secondoIndice = Math.max(indiceA, indiceB);
      const nuovoOrdine = [...ordineAttuale];

      nuovoOrdine[primoIndice] = nuovoId;
      nuovoOrdine[secondoIndice] = idCellaVuota;

      return nuovoOrdine;
    });

    setClienteUnioneA("");
    setClienteUnioneB("");
  }

  function separaClienti(idCellaDoppia) {
    const gruppo = celleDoppie[idCellaDoppia];

    if (!gruppo || !Array.isArray(gruppo.ids)) {
      return;
    }

    const idCellaVuota =
      typeof gruppo.idCellaVuota === "string"
        ? gruppo.idCellaVuota
        : "";

    setOrdineCelle((ordinePrecedente) => {
      const ordineAttuale =
        ordinePrecedente.length > 0
          ? [...ordinePrecedente]
          : [...idsBase];

      const indiceDoppia = ordineAttuale.indexOf(idCellaDoppia);

      if (indiceDoppia === -1) {
        return ordinePrecedente;
      }

      const idClienteA = gruppo.ids[0];
      const idClienteB = gruppo.ids[1];
      const nuovoOrdine = [...ordineAttuale];

      nuovoOrdine[indiceDoppia] = idClienteA;

      const indiceVuota = idCellaVuota
        ? nuovoOrdine.indexOf(idCellaVuota)
        : -1;

      if (indiceVuota !== -1) {
        nuovoOrdine[indiceVuota] = idClienteB;
      } else {
        nuovoOrdine.splice(indiceDoppia + 1, 0, idClienteB);
      }

      return nuovoOrdine;
    });

    if (idCellaVuota) {
      setCelleVuoteManuali((precedenti) =>
        precedenti.filter((id) => id !== idCellaVuota)
      );
    }

    setCelleDoppie((precedenti) => {
      const aggiornate = { ...precedenti };
      delete aggiornate[idCellaDoppia];
      return aggiornate;
    });
  }


  function stampaPagina() {
    window.print();
  }

  const clientiArray = Object.entries(dati).map(
    ([cliente, prodotti]) => ({
      cliente,
      prodotti,
      zona: normalizzaZona(zoneClienti[cliente]),
    })
  );

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
        zona: blocco.zona,
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
        zona: blocco.zona,
        vuota: false,
      });
    });
  });

  const celleOrdiniMap = new Map(
    celleOrdini.map((cella) => [cella.id, cella])
  );

  const idsClientiInCelleDoppie = new Set(
    Object.values(celleDoppie).flatMap((gruppo) => {
      const ids = Array.isArray(gruppo?.ids) ? gruppo.ids : [];

      const unioneValida =
        ids.length === 2 &&
        ids.every((idCliente) => celleOrdiniMap.has(idCliente));

      return unioneValida ? ids : [];
    })
  );

  const celleOrdiniSingole = celleOrdini.filter(
    (cella) => !idsClientiInCelleDoppie.has(cella.id)
  );

  const celleDoppieOggetti = Object.entries(celleDoppie)
    .map(([id, gruppo]) => {
      const clienti = (Array.isArray(gruppo?.ids) ? gruppo.ids : [])
        .map((idCliente) => celleOrdiniMap.get(idCliente))
        .filter(Boolean);

      const zoneDellaCella = clienti.map(
        (cliente) => normalizzaZona(cliente.zona)
      );

      const zonaComune =
        zoneDellaCella.length === 2 &&
        zoneDellaCella[0] !== null &&
        zoneDellaCella[0] === zoneDellaCella[1]
          ? zoneDellaCella[0]
          : null;

      return {
        id,
        doppia: true,
        vuota: false,
        zona: zonaComune,
        clienti,
      };
    })
    .filter((cella) => cella.clienti.length === 2);

  const celleVuoteManualiOggetti = celleVuoteManuali.map((id) => ({
    id,
    vuota: true,
    manuale: true,
  }));

  const celleSenzaRiempimento = [
    ...celleOrdiniSingole,
    ...celleDoppieOggetti,
    ...celleVuoteManualiOggetti,
  ];

  const idsOrdini = celleSenzaRiempimento.map(
    (cella) => cella.id
  );

  const gruppiZone = suddividiIdsPerZona(
    celleSenzaRiempimento
  );

  const pagineZone = calcolaPagineZone(
    gruppiZone
  );

  const numeroSlotTotali =
    pagineZone.totali * CELLE_PER_PAGINA;

  const numeroCelleVuote =
    numeroSlotTotali - idsOrdini.length;

  const celleVuote = Array.from({
    length: numeroCelleVuote,
  }).map((_, index) => ({
    id: `__vuota__auto_${index}`,
    vuota: true,
    manuale: false,
    zona: null,
  }));

  const tutteLeCelleBase = [
    ...celleSenzaRiempimento,
    ...celleVuote,
  ];

  const celleMap = new Map(
    tutteLeCelleBase.map((cella) => [
      cella.id,
      cella,
    ])
  );

  const idsAutomaticiPerZone =
    creaOrdineAutomaticoPerZone(
      gruppiZone,
      celleVuote.map((cella) => cella.id)
    );

  /*
   * idsBase viene utilizzato anche dal drag-and-drop.
   * In questo modo il primo trascinamento parte
   * dalla disposizione automatica per zone.
   */
  const idsBase = idsAutomaticiPerZone;

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

  const righeAttese = clientiArray.flatMap((bloccoCliente) =>
    bloccoCliente.prodotti.map((prodotto) => ({
      ...prodotto,
      cliente: bloccoCliente.cliente,
    }))
  );

  const righeVisualizzate = celleOrdinate.flatMap((cella) => {
    if (cella.vuota) {
      return [];
    }

    if (cella.doppia) {
      return cella.clienti.flatMap((cliente) =>
        cliente.prodotti.map((prodotto) => ({
          ...prodotto,
          cliente: cliente.cliente,
        }))
      );
    }

    return cella.prodotti.map((prodotto) => ({
      ...prodotto,
      cliente: cella.cliente,
    }));
  });

  const conteggioRigheVisualizzate = new Map();

  righeVisualizzate.forEach((riga) => {
    if (riga.riga_id === null || riga.riga_id === undefined) {
      return;
    }

    const idRiga = String(riga.riga_id);

    conteggioRigheVisualizzate.set(
      idRiga,
      (conteggioRigheVisualizzate.get(idRiga) || 0) + 1
    );
  });

  const righeMancanti = righeAttese.filter((riga) => {
    if (riga.riga_id === null || riga.riga_id === undefined) {
      return false;
    }

    return !conteggioRigheVisualizzate.has(String(riga.riga_id));
  });

  const righeDuplicate = Array.from(
    conteggioRigheVisualizzate.entries()
  )
    .filter(([, numero]) => numero > 1)
    .map(([idRiga, numero]) => ({
      idRiga,
      numero,
      riga: righeVisualizzate.find(
        (elemento) => String(elemento.riga_id) === idRiga
      ),
    }));

  const numeroRigheRappresentateUniche = new Set(
    righeVisualizzate
      .map((riga) =>
        riga.riga_id === null || riga.riga_id === undefined
          ? null
          : String(riga.riga_id)
      )
      .filter(Boolean)
  ).size;

  const differenzaConteggioOrigine =
    integritaOrigine.numeroRighe !== righeAttese.length;

  const numeroAnomalieIntegrita =
    integritaOrigine.ordiniSenzaRighe.length +
    integritaOrigine.righeProdottoSconosciuto.length +
    righeMancanti.length +
    righeDuplicate.length +
    celleTagliate.length +
    (differenzaConteggioOrigine ? 1 : 0);

  const celleTagliateDettaglio = celleTagliate.map((idCella) => {
    const cella = celleMap.get(idCella);

    if (!cella) {
      return { id: idCella, nome: idCella };
    }

    if (cella.doppia) {
      return {
        id: idCella,
        nome: cella.clienti
          .map((cliente) => cliente.cliente)
          .join(" + "),
      };
    }

    return {
      id: idCella,
      nome:
        cella.totaleParti > 1
          ? `${cella.cliente} - parte ${cella.parte}`
          : cella.cliente,
    };
  });

  const pagine = chunkArray(celleOrdinate, CELLE_PER_PAGINA);

  const clientiUnibili = celleOrdiniSingole.filter(
    (cella) => cella.totaleParti === 1
  );

  function riorganizzaPerZone() {
    const conferma = window.confirm(
      "Riorganizzare la griglia in base alle zone? " +
      "Gli spostamenti manuali non ancora salvati " +
      "verranno sostituiti."
    );

    if (!conferma) {
      return;
    }

    setOrdineCelle([...idsAutomaticiPerZone]);
  }

function gestisciFineDrag(event) {
  const { active, over } = event;

  if (!over || active.id === over.id) {
    return;
  }

  setOrdineCelle((ordinePrecedente) => {
    const ordineAttuale =
      ordinePrecedente.length > 0
        ? [
            ...ordinePrecedente.filter((id) => idsBase.includes(id)),
            ...idsBase.filter((id) => !ordinePrecedente.includes(id)),
          ]
        : [...idsBase];

    const indiceVecchio = ordineAttuale.indexOf(active.id);
    const indiceNuovo = ordineAttuale.indexOf(over.id);

    if (indiceVecchio === -1 || indiceNuovo === -1) {
      return ordinePrecedente;
    }

    const nuovoOrdine = [...ordineAttuale];

    const cellaOrigine = nuovoOrdine[indiceVecchio];
    const cellaDestinazione = nuovoOrdine[indiceNuovo];

    nuovoOrdine[indiceNuovo] = cellaOrigine;
    nuovoOrdine[indiceVecchio] = cellaDestinazione;

    return nuovoOrdine;
  });
}

  useEffect(() => {
    if (caricamento) {
      return;
    }

    const timer = window.setTimeout(() => {
      const elementi = Array.from(
        document.querySelectorAll("[data-cella-id]")
      );

      const nuoviIds = [...new Set(
        elementi
          .filter((elemento) =>
            elemento.scrollHeight > elemento.clientHeight + 1
          )
          .map((elemento) => elemento.getAttribute("data-cella-id"))
          .filter(Boolean)
      )].sort();

      setCelleTagliate((precedenti) => {
        const vecchiIds = [...precedenti].sort();

        if (
          vecchiIds.length === nuoviIds.length &&
          vecchiIds.every((id, index) => id === nuoviIds[index])
        ) {
          return precedenti;
        }

        return nuoviIds;
      });
    }, 120);

    return () => window.clearTimeout(timer);
  }, [
    caricamento,
    dataOperativa,
    dati,
    ordineCelle,
    celleDoppie,
    celleVuoteManuali,
  ]);

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

        .separatore-clienti-doppi {
          width: 100%;
          border-top: 2px solid #000000;
          margin: 2mm 0;
          flex: 0 0 auto;
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
            Stampa Totale - Griglia Orizzontale
          </h1>

          <button
            type="button"
            onClick={aggiungiCellaVuota}
            style={{
              padding: "8px 14px",
              border: "none",
              borderRadius: 6,
              backgroundColor: "#2563eb",
              color: "#ffffff",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            Aggiungi cella vuota
          </button>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              flexWrap: "wrap",
            }}
          >
            <select
              value={clienteUnioneA}
              onChange={(event) =>
                setClienteUnioneA(event.target.value)
              }
              style={{
                padding: "7px 8px",
                border: "1px solid #9ca3af",
                borderRadius: 6,
                backgroundColor: "#ffffff",
              }}
            >
              <option value="">Cliente sopra</option>
              {clientiUnibili.map((cella) => (
                <option
                  key={`a-${cella.id}`}
                  value={cella.id}
                  disabled={cella.id === clienteUnioneB}
                >
                  {cella.cliente}
                </option>
              ))}
            </select>

            <select
              value={clienteUnioneB}
              onChange={(event) =>
                setClienteUnioneB(event.target.value)
              }
              style={{
                padding: "7px 8px",
                border: "1px solid #9ca3af",
                borderRadius: 6,
                backgroundColor: "#ffffff",
              }}
            >
              <option value="">Cliente sotto</option>
              {clientiUnibili.map((cella) => (
                <option
                  key={`b-${cella.id}`}
                  value={cella.id}
                  disabled={cella.id === clienteUnioneA}
                >
                  {cella.cliente}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={unisciClienti}
              style={{
                padding: "8px 12px",
                border: "none",
                borderRadius: 6,
                backgroundColor: "#7c3aed",
                color: "#ffffff",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              Unisci clienti
            </button>
          </div>

          <button
            type="button"
            onClick={riorganizzaPerZone}
            style={{
              padding: "8px 14px",
              border: "none",
              borderRadius: 6,
              backgroundColor: "#d97706",
              color: "#ffffff",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            Riorganizza per zone
          </button>

          <button
            onClick={salvaOrdineStampe}
            style={{
              padding: "8px 14px",
              border: "none",
              borderRadius: 6,
              backgroundColor: "#047857",
              color: "#ffffff",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            Salva disposizione
          </button>

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

      <div
        className="no-print"
        style={{
          marginBottom: 18,
          borderRadius: 14,
          padding: 16,
          backgroundColor: "rgba(15, 23, 42, 0.92)",
          border: "1px solid rgba(125,211,252,0.35)",
          color: "#ffffff",
        }}
      >
        <div
          style={{
            fontSize: 20,
            fontWeight: "bold",
            marginBottom: 8,
            color: "#7dd3fc",
          }}
        >
          Seleziona data ordini da visualizzare
        </div>

        <div
          style={{
            fontSize: 14,
            color: "#cbd5e1",
            marginBottom: 14,
          }}
        >
          La griglia, le celle unite, le celle vuote e l'ordine di stampa vengono caricati separatamente per ogni data.
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 10,
            marginBottom: 14,
          }}
        >
          <button
            type="button"
            onClick={() => setMeseCalendario(cambiaMeseIso(meseCalendario, -1))}
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.18)",
              backgroundColor: "#1e293b",
              color: "#ffffff",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
                          {"\u2192"}
          </button>

          <div
            style={{
              flex: 1,
              textAlign: "center",
              fontSize: 18,
              fontWeight: "bold",
              color: "#ffffff",
              textTransform: "capitalize",
            }}
          >
            {formatMeseCalendario(meseCalendario)}
          </div>

          <button
            type="button"
            onClick={() => setMeseCalendario(cambiaMeseIso(meseCalendario, 1))}
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.18)",
              backgroundColor: "#1e293b",
              color: "#ffffff",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            {"\u2192"}
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: 6,
            marginBottom: 8,
          }}
        >
          {["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"].map(
            (giorno) => (
              <div
                key={giorno}
                style={{
                  textAlign: "center",
                  fontSize: 13,
                  fontWeight: "bold",
                  color: "#7dd3fc",
                }}
              >
                {giorno}
              </div>
            )
          )}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: 6,
          }}
        >
          {getGiorniCalendario(meseCalendario).map((giorno, indice) => {
            if (!giorno) {
              return <div key={`vuoto-${indice}`} />;
            }

            const selezionato = giorno.iso === dataOperativa;

            return (
              <button
                type="button"
                key={giorno.iso}
                onClick={() => setDataOperativa(giorno.iso)}
                style={{
                  minHeight: 42,
                  borderRadius: 10,
                  border: selezionato
                    ? "2px solid #ffffff"
                    : "1px solid rgba(255,255,255,0.16)",
                  backgroundColor: selezionato ? "#0284c7" : "#0f172a",
                  color: "#ffffff",
                  fontWeight: "bold",
                  fontSize: 15,
                  cursor: "pointer",
                }}
              >
                {giorno.giorno}
              </button>
            );
          })}
        </div>

        <div
          style={{
            marginTop: 14,
            color: "#ffffff",
            fontSize: 15,
            backgroundColor: "rgba(14,165,233,0.14)",
            border: "1px solid rgba(125,211,252,0.35)",
            borderRadius: 10,
            padding: 12,
          }}
        >
          Data visualizzata: <strong>{formatDataConsegna(dataOperativa)}</strong>
        </div>
      </div>

      {!caricamento ? (
        <div
          className="no-print"
          style={{
            marginBottom: 18,
            padding: 16,
            borderRadius: 12,
            border:
              numeroAnomalieIntegrita === 0
                ? "2px solid #16a34a"
                : "2px solid #dc2626",
            backgroundColor:
              numeroAnomalieIntegrita === 0
                ? "#ecfdf5"
                : "#fef2f2",
            color: "#111827",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 10,
              flexWrap: "wrap",
              marginBottom: 10,
            }}
          >
            <strong style={{ fontSize: 18 }}>
              Controllo integrità - {formatDataConsegna(dataOperativa)}
            </strong>

            <strong
              style={{
                color:
                  numeroAnomalieIntegrita === 0
                    ? "#15803d"
                    : "#b91c1c",
              }}
            >
              {numeroAnomalieIntegrita === 0
                ? "INTEGRITÀ OK"
                : `${numeroAnomalieIntegrita} ANOMALIE`}
            </strong>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 8,
              marginBottom: numeroAnomalieIntegrita > 0 ? 12 : 0,
            }}
          >
            <div>
              Ordini caricati:{" "}
              <strong>{integritaOrigine.numeroOrdini}</strong>
            </div>
            <div>
              Righe Supabase:{" "}
              <strong>{integritaOrigine.numeroRighe}</strong>
            </div>
            <div>
              Righe uniche nella griglia:{" "}
              <strong>{numeroRigheRappresentateUniche}</strong>
            </div>
            <div>
              Celle con contenuto tagliato:{" "}
              <strong>{celleTagliate.length}</strong>
            </div>
          </div>

          {numeroAnomalieIntegrita > 0 ? (
            <div
              style={{
                borderTop: "1px solid #fecaca",
                paddingTop: 10,
                fontSize: 13,
                lineHeight: 1.55,
              }}
            >
              {integritaOrigine.ordiniSenzaRighe.map((anomalia) => (
                <div key={`senza-righe-${anomalia.ordineId}`}>
                  ORDINE SENZA RIGHE: #{anomalia.ordineId} -{" "}
                  {anomalia.cliente}
                </div>
              ))}

              {integritaOrigine.righeProdottoSconosciuto.map(
                (anomalia) => (
                  <div key={`prodotto-${anomalia.rigaId}`}>
                    PRODOTTO NON RICONOSCIUTO: ordine #
                    {anomalia.ordineId} - {anomalia.cliente} - prodotto ID{" "}
                    {anomalia.prodottoId}
                  </div>
                )
              )}

              {righeMancanti.map((riga) => (
                <div key={`mancante-${riga.riga_id}`}>
                  RIGA ASSENTE DALLA GRIGLIA: ordine #{riga.ordine_id} -{" "}
                  {riga.cliente} - {riga.nome}
                </div>
              ))}

              {righeDuplicate.map((anomalia) => (
                <div key={`duplicata-${anomalia.idRiga}`}>
                  RIGA DUPLICATA NELLA GRIGLIA: ID {anomalia.idRiga} -{" "}
                  {anomalia.riga?.cliente || "cliente non identificato"} -{" "}
                  presente {anomalia.numero} volte
                </div>
              ))}

              {celleTagliateDettaglio.map((cella) => (
                <div key={`tagliata-${cella.id}`}>
                  CELLA TROPPO PIENA / CONTENUTO TAGLIATO: {cella.nome}
                </div>
              ))}

              {differenzaConteggioOrigine ? (
                <div>
                  CONTEGGIO INCOERENTE: Supabase contiene{" "}
                  {integritaOrigine.numeroRighe} righe, ma la preparazione dati
                  ne ha elaborate {righeAttese.length}.
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      {caricamento ? (
        <p>Caricamento dati...</p>
      ) : celleOrdini.length === 0 ? (
        <p>Nessun ordine in bozza per la data selezionata.</p>
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
                    <div>STAMPA TOTALE - ORDINI IN BOZZA</div>
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
    <CellaVuotaSortable
      cella={cella}
      key={cella.id}
      onElimina={eliminaCellaVuota}
    />
  ) : cella.doppia ? (
    <CellaDoppiaSortable
      cella={cella}
      key={cella.id}
      onSepara={separaClienti}
    />
  ) : (
    <CellaOrdineSortable
      cella={cella}
      key={cella.id}
    />
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