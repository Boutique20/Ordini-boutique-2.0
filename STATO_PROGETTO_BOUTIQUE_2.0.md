# STATO PROGETTO BOUTIQUE 2.0

Ultimo aggiornamento: 19/08/2026

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

## 2. ULTIMO INTERVENTO FUNZIONALE PUBBLICATO

Commit funzionale pubblicato:
3a2e533bfb77f483158f8eb1b6a5ed711eded3e4

Messaggio commit:
Rende atomico il salvataggio ordini cliente

File pubblicato:
app/ordine/[slug]/page.js

Hash SHA256 ufficiale:
0A40C58D025593629A12DC3ABF3963991929BF05B420EA4E7443D698200AEC77

Al termine della pubblicazione è stato verificato:
- HEAD locale = 3a2e533bfb77f483158f8eb1b6a5ed711eded3e4
- origin/main = 3a2e533bfb77f483158f8eb1b6a5ed711eded3e4
- GitHub main = 3a2e533bfb77f483158f8eb1b6a5ed711eded3e4
- il commit contiene esclusivamente app/ordine/[slug]/page.js
- nessuna modifica tracciata residua
- staging vuoto
- file TEST, backup e script non tracciati non eliminati e non inclusi nel commit

Nota: eventuali commit esclusivamente documentali di aggiornamento di questo file possono essere successivi al commit funzionale sopra indicato.

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

## 7. SALVATAGGIO ATOMICO ORDINI - STATO ATTUALE

Stato:
PAGINA CLIENTE COMPLETATA, TESTATA E PUBBLICATA.
ORDINE MANUALE ANCORA DA CONVERTIRE ALLA RPC.

Problema originariamente verificato:
le pagine cliente e ordine manuale eseguivano due operazioni separate:

1. INSERT nella tabella ordini;
2. INSERT successivo nella tabella righe_ordine.

In caso di errore sul secondo INSERT poteva rimanere una testata ordine senza tutte le relative righe.

Soluzione realizzata:
- creata la funzione PostgreSQL public.crea_ordine_atomico;
- ordine e righe vengono gestiti nella stessa chiamata RPC;
- se una riga fallisce, non deve rimanere la testata dell'ordine;
- la pagina cliente ufficiale utilizza ora supabase.rpc("crea_ordine_atomico", ...).

Pagina cliente:
- TEST: app/ordine-data-test/[slug]/page.js
- ufficiale: app/ordine/[slug]/page.js
- hash TEST e ufficiale dopo promozione:
  0A40C58D025593629A12DC3ABF3963991929BF05B420EA4E7443D698200AEC77
- commit pubblicato:
  3a2e533bfb77f483158f8eb1b6a5ed711eded3e4

Ordine manuale:
- TEST: app/ordine-manuale-test/page.js
- ufficiale protetto: app/ordine-manuale/page.js
- hash verificato prima dell'intervento:
  E217932D08055B4E993FEDACFEDED7353B4848ABD5826D34380F6666B67317DE
- il file ufficiale dell'ordine manuale non è stato ancora modificato per usare la RPC.

## 8. SUPABASE - RPC SALVATAGGIO ATOMICO

Funzione creata:
public.crea_ordine_atomico(bigint, text, text, date, jsonb)

Caratteristiche verificate:
- ritorno bigint;
- SECURITY INVOKER;
- EXECUTE consentito a anon;
- EXECUTE consentito a authenticated;
- nessuna modifica a tabelle, colonne, foreign key, RLS o policy;
- nessun ID viene passato manualmente alle colonne GENERATED ALWAYS AS IDENTITY.

Test di atomicità eseguito:
- è stato usato intenzionalmente un prodotto inesistente;
- PostgreSQL ha generato foreign_key_violation;
- SQLSTATE rilevato: 23503;
- evento rilevato: ERRORE_FK_ATTESO;
- ordini residui dopo il fallimento: 0;
- righe residue dopo il fallimento: 0;
- risultato: OK - ATOMICITA CONFERMATA.

Test browser sulla pagina TEST cliente:
- cliente Bolina;
- prodotto SCAMPO 0/5;
- quantità 1 KG;
- ordine creato con id 3158;
- riga creata con id 15464;
- data_operativa verificata: 2026-08-17;
- stato verificato: bozza;
- ordine e riga di prova successivamente eliminati.

Test browser sulla pagina ufficiale cliente:
- cliente Bolina;
- prodotto SCAMPO 0/5;
- quantità 1 KG;
- ordine creato con id 3159;
- riga creata con id 15465;
- data_operativa verificata: 2026-08-17;
- stato verificato: bozza;
- ordine e riga di prova successivamente eliminati.

Logiche cliente confermate dopo la modifica:
- il cliente non vede e non seleziona la data;
- cutoff delle ore 05:00 invariato;
- il cliente non vede e non seleziona la zona;
- quantità, KG/PZ e note restano gestiti come prima;
- Telegram resta dopo il salvataggio riuscito;
- grafica e caricamento prodotti invariati.

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

## 10. ROLLBACK SALVATAGGIO ATOMICO

La pagina cliente ufficiale utilizza ora public.crea_ordine_atomico.

Per questo motivo NON eliminare la RPC come primo passaggio di rollback.

Procedura corretta di rollback della pagina cliente:
1. controllare repository, hash e stato Git;
2. ripristinare prima esclusivamente un file TEST cliente dalla versione precedente;
3. provarlo nel browser;
4. dopo conferma esplicita copiare il TEST ripristinato sull'ufficiale;
5. verificare hash, diff e funzionamento;
6. commit e push separati secondo la procedura ordinaria;
7. soltanto quando nessun file ufficiale utilizza più crea_ordine_atomico valutare la rimozione della funzione Supabase.

Backup ufficiale cliente precedente alla RPC:
backup-ufficiale-cliente-prima-rpc-atomica-20260816-131533.js

Hash della precedente versione cliente:
CA9BFD20030635CECBFD8438B7DCE7D961394CD1DB7D191E1FC0BE9B3B250D87

Rollback database, solo dopo aver eliminato tutte le dipendenze applicative dalla RPC:
DROP FUNCTION IF EXISTS public.crea_ordine_atomico(bigint, text, text, date, jsonb);

Non sono state introdotte modifiche strutturali alle tabelle ordini e righe_ordine da ripristinare.

## 11. INTERVENTI SUCCESSIVI ANCORA APERTI

Prossimo intervento immediato:
- rendere atomico anche l'ordine manuale;
- modificare inizialmente esclusivamente app/ordine-manuale-test/page.js;
- preservare scelta della data operativa;
- preservare nome cliente manuale;
- preservare righe duplicate dello stesso prodotto;
- preservare quantità, KG/PZ, note e Telegram;
- non modificare app/ordine-manuale/page.js prima del test browser e della conferma esplicita.

Interventi successivi ancora previsti:
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
