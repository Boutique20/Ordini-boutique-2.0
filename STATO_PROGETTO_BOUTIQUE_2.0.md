# STATO PROGETTO BOUTIQUE 2.0

Ultimo aggiornamento: 16/08/2026

## 1. PROGETTO

Nome:
Boutique 2.0 - Gestionale ordini

Percorso locale operativo:
C:\Users\lucia\ordini-pesce

Repository:
https://github.com/Boutique20/Ordini-boutique-2.0.git

Ramo principale:
main

Tecnologie principali:
- Next.js
- JavaScript
- Supabase / PostgreSQL
- Vercel
- PowerShell su Windows

## 2. STATO GIT ATTUALE

Ultimo commit pubblicato:
b9a261cff1f2f79b4f32a66c92be84feb0475583

Messaggio commit:
Corregge altezza griglia e unioni sicure Stampa Totale

Al termine della pubblicazione è stato verificato:
- HEAD locale = b9a261cff1f2f79b4f32a66c92be84feb0475583
- origin/main = b9a261cff1f2f79b4f32a66c92be84feb0475583
- GitHub main = b9a261cff1f2f79b4f32a66c92be84feb0475583
- nessuna modifica tracciata residua
- file TEST, backup e script non tracciati non eliminati e non inclusi nei commit

## 3. REGOLE OPERATIVE OBBLIGATORIE

Non modificare direttamente i file ufficiali.

Procedura obbligatoria:
1. controlli esclusivamente di lettura;
2. identificazione di TEST e ufficiale;
3. registrazione hash ufficiale;
4. modifica solo TEST;
5. verifica ufficiale non modificato;
6. diff esatto TEST;
7. prova nel browser locale;
8. conferma esplicita;
9. copia TEST su ufficiale;
10. verifica hash TEST = ufficiale;
11. staging del solo file autorizzato;
12. commit del solo file previsto;
13. push solo dopo conferma separata.

Comandi Git vietati:
- git add .
- git add -A
- git reset --hard
- git clean
- git push --force

Non eliminare TEST, backup o file non tracciati senza autorizzazione esplicita.

## 4. LOGICHE APPROVATE DA PRESERVARE

### Pagina cliente
- il cliente non vede e non sceglie la data;
- fino alle ore 05:00 comprese l'ordine appartiene al giorno corrente;
- dopo le ore 05:00 appartiene al giorno successivo;
- il cliente non vede e non sceglie la zona.

### Operatore
- può modificare la data operativa;
- può assegnare Zona 1, Zona 2, Zona 3 o Zona 4;
- gli ordini senza zona devono essere evidenziati.

### Zone
- servono solo per assegnazione iniziale e organizzazione automatica;
- non limitano mai il trascinamento manuale;
- qualsiasi ordine può essere spostato manualmente in qualsiasi cella;
- il posizionamento manuale ha priorità.

### Stampa Totale
- 8 colonne;
- 3 righe;
- 24 celle per pagina;
- 10 righe prodotto per cella;
- Zona 1 nella riga superiore;
- Zona 2 nella riga centrale;
- Zona 3 nella riga inferiore;
- Zona 4 in blocco separato;
- ordini senza zona nel blocco finale;
- layout salvato con priorità sulla disposizione automatica;
- pulsante "Riorganizza per zone";
- drag-and-drop libero;
- celle vuote persistenti;
- disposizione condivisa tramite Supabase.

### Unione clienti
- la posizione liberata resta una cella vuota;
- gli ordini successivi non scalano;
- un altro cliente può essere inserito manualmente nella cella libera;
- la separazione deve ripristinare correttamente i due clienti.

### Andrea e Raffaele
- rispettano l'ordine derivato dalla Stampa Totale;
- Raffaele separa Zona 1, Zona 2, Zona 3, Zona 4 e ordini senza zona;
- ogni zona di Raffaele inizia su un nuovo foglio.

## 5. ULTIMO INTERVENTO COMPLETATO - STAMPA TOTALE

File pubblicato:
app/stampa/totale/page.js

Hash SHA256 dopo l'ultimo intervento:
C154F194AA75A47843ED63B40B3D84D4F47AF3102CF31E40D981E2CC6435110F

Funzioni completate:
- corretto il problema strutturale che permetteva alle righe CSS della griglia di espandersi oltre l'altezza della pagina;
- aggiunto min-height: 0 alla griglia;
- righe impostate con minmax(0, 1fr);
- eliminato il taglio del cliente nella terza riga;
- reso affidabile il controllo fisico delle celle con contenuto tagliato;
- aggiunta "Unione Sicura";
- una nuova unione che non entra fisicamente nella cella viene automaticamente annullata;
- i due clienti vengono ripristinati separati;
- una nuova unione che entra correttamente rimane unita;
- le vecchie unioni già salvate e troppo grandi non vengono modificate automaticamente.

Test browser eseguiti:
- cliente lungo verificato in prima, seconda e terza riga;
- terza riga verificata completa;
- cella doppia troppo piena rilevata;
- nuova unione GIRONE + PASTORIZIA troppo grande annullata automaticamente;
- coppia piccola verificata come unione valida;
- prove ripetute sulla pagina ufficiale dopo la promozione.

Backup ufficiale creato prima della promozione:
backup-stampa-totale-ufficiale-prima-fix-griglia-unione-sicura-20260816-115218.js

## 6. CONTROLLO INTEGRITA STAMPA TOTALE

Il controllo già pubblicato confronta:
- numero ordini caricati;
- numero righe Supabase;
- righe uniche rappresentate nella griglia;
- celle fisicamente tagliate.

Sono già presenti protezioni per:
- righe mancanti;
- righe duplicate;
- prodotto sconosciuto;
- unioni salvate non più valide;
- celle con contenuto fisicamente tagliato.

Nota:
il controllo attuale opera sugli ordini caricati dalla Stampa Totale secondo i filtri esistenti.

## 7. PROSSIMO INTERVENTO - SALVATAGGIO ATOMICO ORDINI

Stato:
ANALISI IN CORSO.
NESSUNA MODIFICA DATABASE ANCORA ESEGUITA.

Problema verificato:
le pagine cliente e ordine manuale eseguono attualmente due operazioni separate:

1. INSERT nella tabella ordini;
2. INSERT successivo nella tabella righe_ordine.

Se il secondo INSERT fallisce dopo il primo, può rimanere un ordine incompleto.

File ufficiali protetti:
- app/ordine/[slug]/page.js
- app/ordine-manuale/page.js

File TEST individuati e verificati:
- app/ordine-data-test/[slug]/page.js
- app/ordine-manuale-test/page.js

Hash verificati il 16/08/2026:

Cliente ufficiale:
CA9BFD20030635CECBFD8438B7DCE7D961394CD1DB7D191E1FC0BE9B3B250D87

Cliente TEST:
CA9BFD20030635CECBFD8438B7DCE7D961394CD1DB7D191E1FC0BE9B3B250D87

Manuale ufficiale:
E217932D08055B4E993FEDACFEDED7353B4848ABD5826D34380F6666B67317DE

Manuale TEST:
E217932D08055B4E993FEDACFEDED7353B4848ABD5826D34380F6666B67317DE

I rispettivi TEST erano identici ai rispettivi ufficiali al momento del controllo.

Nei quattro file non risultavano chiamate .rpc().

## 8. ANALISI SUPABASE PER SALVATAGGIO ATOMICO

Analisi eseguita esclusivamente tramite SELECT.

Tabelle coinvolte:
- public.ordini
- public.righe_ordine

Informazioni verificate:
- struttura delle colonne;
- primary key;
- foreign key;
- indici;
- RLS;
- policy;
- trigger;
- funzioni schema public;
- privilegi di anon e authenticated;
- generazione degli ID.

Vincoli rilevanti:
- righe_ordine.ordine_id è collegato a ordini.id;
- righe_ordine.prodotto_id è collegato a prodotti_v2.id.

RLS:
- disattivato su ordini;
- disattivato su righe_ordine.

Policy:
- nessuna policy RLS rilevata sulle due tabelle.

Trigger:
- nessun trigger rilevato sulle due tabelle.

Funzioni public:
- nessuna funzione preesistente rilevata durante il controllo effettuato.

ID:
ordini.id:
- bigint
- GENERATED ALWAYS AS IDENTITY
- sequenza public.ordini_id_seq

righe_ordine.id:
- bigint
- GENERATED ALWAYS AS IDENTITY
- sequenza public.righe_ordine_id_seq

I ruoli anon e authenticated risultano avere USAGE sulle sequenze necessarie.

Soluzione prevista:
creare una funzione PostgreSQL transazionale, indicativamente denominata
crea_ordine_atomico,
richiamata tramite supabase.rpc().

Obiettivo:
- ordine e tutte le righe vengono salvati insieme;
- se una parte fallisce, l'intera operazione fallisce;
- non deve restare un ordine parziale.

La funzione non è ancora stata creata.

## 9. FUNZIONI DA NON ALTERARE NEL SALVATAGGIO ATOMICO

La modifica futura non deve cambiare:
- cutoff delle ore 05:00;
- data_operativa;
- selezione data dell'ordine manuale;
- nome cliente registrato;
- nome cliente manuale;
- quantità;
- KG/PZ;
- note generali;
- note prodotto;
- righe duplicate dell'ordine manuale;
- stato bozza attualmente usato dalle stampe;
- zona;
- grafica;
- storico ordini;
- drag-and-drop;
- Stampa Totale;
- Andrea;
- Raffaele.

Telegram è presente nel codice ma non deve essere modificato durante l'intervento sul salvataggio atomico.

## 10. ROLLBACK PREVISTO PER IL SALVATAGGIO ATOMICO

Prima di qualsiasi modifica database dovranno essere preparati:
- SQL di creazione della funzione;
- SQL esatto di rollback;
- verifica funzione assente prima della creazione;
- controllo privilegi EXECUTE;
- prova controllata.

Il rollback previsto comprende:
- eliminazione esclusivamente della nuova funzione RPC;
- ripristino dei file TEST alle versioni precedenti;
- nessuna modifica strutturale alle tabelle ordini e righe_ordine.

## 11. INTERVENTI SUCCESSIVI ANCORA APERTI

Dopo il salvataggio atomico, tra gli interventi ancora previsti:

- gestione ordini filtrata per data operativa;
- storico indicativamente di circa 30 giorni senza caricare inutilmente tutto lo storico;
- progressiva rimozione della dipendenza UI dagli stati, senza romperne prima l'uso nelle stampe;
- etichette descrittive delle zone mantenendo i valori database numerici;
- controllo integrità anche per Stampa Andrea;
- controllo integrità anche per Stampa Raffaele;
- apprendimento della posizione abituale dei clienti;
- analisi e classificazione dei numerosi file TEST, backup e script non tracciati;
- rimozione futura della funzione/API Telegram, solo dopo analisi separata e autorizzazione.

Etichette zone già definite per un intervento futuro:
- Zona 1 - ALTAMURA/GIOVINAZZO
- Zona 2 - BAT
- Zona 3 - BARI/POGGIOFRANCO
- Zona 4 - PALESE/SANTO SPIRITO

I valori database delle zone dovranno restare numerici.

## 12. REGOLA PER I PROSSIMI AGGIORNAMENTI DEL DOCUMENTO

Dopo ogni modifica completata e pubblicata aggiungere:
- data;
- commit;
- file modificati;
- funzione completata;
- test eseguiti;
- problemi ancora aperti;
- prossimo intervento.

Non riportare come completato ciò che non è stato verificato da output, hash, diff, browser o database.