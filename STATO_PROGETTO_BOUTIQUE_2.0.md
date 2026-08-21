# STATO PROGETTO BOUTIQUE 2.0

Ultimo aggiornamento: 21/08/2026

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

Data:
21/08/2026

Commit funzionale pubblicato:
86d6676b737bf65c33273cba821ad9d9a0a8bb0d

Messaggio commit:
Rimuove filtro stato dalle stampe

File pubblicati:
- app/stampa/totale/page.js
- app/stampa/andrea/page.js
- app/stampa/raffaele/page.js

Hash SHA256 ufficiali:
- Stampa Totale:
  828A43280A58DC1CC1A99A27075D52CA52D35D63EFAD6B556511E1FDB9D29084
- Stampa Andrea:
  98EAF5CB48786E172140DFC94AFE625C50A5E90B6ECFC34741D1FD69FA9E87BB
- Stampa Raffaele:
  13D0973C7FD977BC30BBD5301F61742BFAB599874C6BEF6E5339C78B58E06194

Funzione completata:
- Stampa Totale, Stampa Andrea e Stampa Raffaele caricano ora tutti gli ordini della data_operativa selezionata indipendentemente dal valore del campo stato;
- rimosso esclusivamente dalle tre query il filtro .eq("stato", "bozza");
- mantenuto invariato il filtro .eq("data_operativa", dataSelezionata);
- mantenuto invariato l'ordinamento crescente per id;
- aggiornate esclusivamente le diciture che indicavano erroneamente "ordini in bozza";
- nessuna modifica alla logica di assegnazione zone;
- nessuna modifica a drag-and-drop, celle vuote, unioni, layout salvato o persistenza Supabase della Stampa Totale;
- nessuna modifica all'ordine Andrea/Raffaele derivato dalla Stampa Totale;
- nessuna modifica alla separazione per zone della Stampa Raffaele;
- nessuna modifica al campo stato nel database;
- nessuna modifica a tabelle, colonne, policy, funzioni SQL o dati Supabase.

Test eseguiti e verificati:
- creati TEST dedicati partendo esattamente dai tre ufficiali;
- Stampa Totale TEST verificata sulla data 20/08/2026;
- verificata la presenza dell'ordine ILSA anche con stato diverso da BOZZA;
- verificata in anteprima di stampa la dicitura "STAMPA TOTALE - ORDINI DELLA DATA";
- Stampa Andrea TEST verificata con prodotto Andrea appartenente a un ordine non BOZZA;
- Stampa Raffaele TEST verificata con ordine non BOZZA;
- dopo la promozione, ciascun ufficiale è stato verificato identico per hash al relativo TEST;
- git diff --check verificato senza errori;
- commit verificato contenente esclusivamente i tre file ufficiali previsti.

Al termine della pubblicazione è stato verificato:
- HEAD locale = 86d6676b737bf65c33273cba821ad9d9a0a8bb0d
- origin/main = 86d6676b737bf65c33273cba821ad9d9a0a8bb0d
- GitHub main = 86d6676b737bf65c33273cba821ad9d9a0a8bb0d
- nessuna modifica tracciata residua
- staging vuoto
- file TEST, backup e script non tracciati preservati

Problemi ancora aperti:
- i quattro pulsanti di azione BOZZA / LAVORAZIONE / PRONTO / CONSEGNATO sono ancora presenti nella pagina Gestione Ordini;
- le tre pagine di stampa non dipendono più dal filtro stato = bozza, quindi la rimozione dei pulsanti può essere affrontata nel prossimo intervento senza alterare le stampe;
- il campo stato rimane nel database e non viene rimosso in questa fase;
- la RPC crea_ordine_atomico è presente in Supabase ma non è ancora versionata nel repository come migrazione SQL;
- RLS resta disabilitato su ordini e righe_ordine e gli accessi diretti anon devono essere affrontati con un intervento di sicurezza separato;
- la route /ordine-manuale resta fuori dalla protezione middleware e deve essere affrontata separatamente.

Prossimo intervento:
- ripetere un controllo esclusivamente di lettura sul file reale app/gestione-ordini/page.js prima di qualsiasi modifica;
- verificare nuovamente la funzione aggiornaStato e tutti i suoi utilizzi;
- creare o riallineare un TEST dedicato alla rimozione dei pulsanti stato partendo dall'ufficiale corrente;
- rimuovere nel TEST esclusivamente i quattro pulsanti BOZZA / LAVORAZIONE / PRONTO / CONSEGNATO e, soltanto se il nuovo audit lo conferma, la funzione aggiornaStato rimasta senza utilizzi;
- mantenere invariati il campo stato nel database, la visualizzazione dello stato attuale, il filtro stato e le altre logiche della pagina;
- non modificare nello stesso intervento Stampa Totale, Stampa Andrea, Stampa Raffaele, Supabase o schema database.

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
- per la data selezionata vengono inclusi tutti gli ordini indipendentemente dal valore stato.

### Unione clienti
- la posizione liberata resta una cella vuota;
- gli ordini successivi non scalano;
- un altro cliente può essere inserito manualmente nella cella libera;
- la separazione deve ripristinare correttamente i due clienti.

### Andrea e Raffaele
- rispettano l'ordine derivato dalla Stampa Totale;
- Raffaele separa Zona 1, Zona 2, Zona 3, Zona 4 e ordini senza zona;
- ogni zona di Raffaele inizia su un nuovo foglio.
- per la data selezionata Andrea e Raffaele includono gli ordini indipendentemente dal valore stato.

## 5. ULTIMO INTERVENTO COMPLETATO - STAMPA TOTALE

File pubblicato:
app/stampa/totale/page.js

Hash SHA256 al termine dell'intervento griglia/unione:
C154F194AA75A47843ED63B40B3D84D4F47AF3102CF31E40D981E2CC6435110F

Hash SHA256 attuale dopo la rimozione del filtro stato (commit 86d6676b737bf65c33273cba821ad9d9a0a8bb0d):
828A43280A58DC1CC1A99A27075D52CA52D35D63EFAD6B556511E1FDB9D29084

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
il controllo attuale opera su tutti gli ordini della data_operativa selezionata; la Stampa Totale non applica più il filtro stato = bozza.

## 7. SALVATAGGIO ATOMICO ORDINI - STATO ATTUALE

Stato:
PAGINA CLIENTE COMPLETATA, TESTATA E PUBBLICATA.
ORDINE MANUALE COMPLETATO, TESTATO E PUBBLICATO.

Problema originariamente verificato:
le pagine cliente e ordine manuale eseguivano due operazioni separate:

1. INSERT nella tabella ordini;
2. INSERT successivo nella tabella righe_ordine.

In caso di errore sul secondo INSERT poteva rimanere una testata ordine senza tutte le relative righe.

Soluzione realizzata:
- creata la funzione PostgreSQL public.crea_ordine_atomico;
- ordine e righe vengono gestiti nella stessa chiamata RPC;
- se una riga fallisce, non deve rimanere la testata dell'ordine;
- la pagina cliente ufficiale utilizza supabase.rpc("crea_ordine_atomico", ...);
- la pagina ordine manuale ufficiale utilizza supabase.rpc("crea_ordine_atomico", ...).

Pagina cliente:
- TEST: app/ordine-data-test/[slug]/page.js
- ufficiale: app/ordine/[slug]/page.js
- hash TEST e ufficiale:
  0A40C58D025593629A12DC3ABF3963991929BF05B420EA4E7443D698200AEC77
- commit pubblicato:
  3a2e533bfb77f483158f8eb1b6a5ed711eded3e4

Ordine manuale:
- TEST: app/ordine-manuale-test/page.js
- ufficiale: app/ordine-manuale/page.js
- hash TEST e ufficiale:
  875C0AD8324A76E43FD7267C8D147612C78A3EF69A6C85EEC8665FCC929C8FFE
- commit pubblicato:
  56e4d62cffabe2039232b3485d6c297d26a3d82c
- backup ufficiale precedente:
  backup-ordine-manuale-ufficiale-prima-rpc-atomica-20260819-095940.js
- hash versione precedente:
  E217932D08055B4E993FEDACFEDED7353B4848ABD5826D34380F6666B67317DE

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

Test browser e database sulla pagina TEST ordine manuale:
- cliente manuale: TEST RPC MANUALE 19082026 0928;
- cliente_id verificato: NULL;
- data_operativa scelta e verificata: 2026-08-21;
- stato verificato: bozza;
- zona verificata: NULL;
- note_generali: NULL, coerente con il test eseguito;
- ordine creato con id 3298;
- riga id 16064: SCAMPO 0/5, quantità 1 KG, nota RIGA 1 TEST RPC;
- riga id 16065: SCAMPO 0/5, quantità 2 KG, nota RIGA 2 TEST RPC;
- entrambe le righe duplicate appartenevano allo stesso ordine 3298;
- ordine e righe di prova successivamente eliminati;
- verifica finale pulizia: ordini_residui = 0, righe_residue = 0.

Dopo la promozione:
- app/ordine-manuale/page.js e app/ordine-manuale-test/page.js avevano lo stesso SHA256;
- la route locale ufficiale /ordine-manuale è stata aperta correttamente;
- non è stato creato un secondo ordine reale dall'ufficiale perché il file ufficiale era identico per hash alla versione TEST già verificata.

Logiche cliente confermate dopo la modifica:
- il cliente non vede e non seleziona la data;
- cutoff delle ore 05:00 invariato;
- il cliente non vede e non seleziona la zona;
- quantità, KG/PZ e note restano gestiti come prima;
- il blocco Telegram e il reset non sono stati modificati dal diff;
- grafica e caricamento prodotti invariati.

Logiche ordine manuale confermate:
- scelta della data operativa preservata;
- nome cliente manuale preservato;
- righe duplicate dello stesso prodotto preservate;
- quantità, KG/PZ e note prodotto preservati;
- blocco Telegram e reset non modificati dal diff;
- grafica, calendario e caricamento prodotti non modificati.

Questioni aperte separate:
- la funzione public.crea_ordine_atomico è stata creata direttamente in Supabase e non risulta ancora versionata nel repository tramite una migrazione SQL;
- RLS risulta disattivato su public.ordini e public.righe_ordine;
- i privilegi diretti di anon/authenticated sulle tabelle restano un tema di sicurezza separato: l'uso della RPC nelle pagine applicative garantisce l'atomicità di quei percorsi, ma non impedisce eventuali scritture dirette tramite Data API.

## 9. FUNZIONI DA NON ALTERARE NEL SALVATAGGIO ATOMICO

Il salvataggio atomico non deve alterare:
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
- valore stato iniziale bozza creato dalla RPC;
- zona;
- grafica;
- storico ordini;
- drag-and-drop;
- Stampa Totale;
- Andrea;
- Raffaele.

Telegram è presente nel codice e non è stato modificato durante l'intervento sul salvataggio atomico.

## 10. ROLLBACK SALVATAGGIO ATOMICO

Le pagine ufficiali cliente e ordine manuale utilizzano ora public.crea_ordine_atomico.

Per questo motivo NON eliminare la RPC come primo passaggio di rollback.

Procedura corretta:
1. controllare repository, hash e stato Git;
2. ripristinare prima esclusivamente il relativo file TEST dalla versione precedente;
3. provarlo nel browser;
4. dopo conferma esplicita copiare il TEST ripristinato sull'ufficiale;
5. verificare hash, diff e funzionamento;
6. creare commit e push separati secondo la procedura ordinaria;
7. ripetere la procedura per ogni pagina ufficiale che utilizza la RPC;
8. soltanto quando nessun file ufficiale utilizza più crea_ordine_atomico valutare la rimozione della funzione Supabase.

Backup ufficiale cliente precedente alla RPC:
backup-ufficiale-cliente-prima-rpc-atomica-20260816-131533.js

Hash precedente pagina cliente:
CA9BFD20030635CECBFD8438B7DCE7D961394CD1DB7D191E1FC0BE9B3B250D87

Backup ufficiale ordine manuale precedente alla RPC:
backup-ordine-manuale-ufficiale-prima-rpc-atomica-20260819-095940.js

Hash precedente ordine manuale:
E217932D08055B4E993FEDACFEDED7353B4848ABD5826D34380F6666B67317DE

Rollback database, solo dopo aver eliminato tutte le dipendenze applicative dalla RPC:
DROP FUNCTION IF EXISTS public.crea_ordine_atomico(bigint, text, text, date, jsonb);

Non sono state introdotte modifiche strutturali alle tabelle ordini e righe_ordine da ripristinare.

## 11. INTERVENTI SUCCESSIVI ANCORA APERTI

Prossimo intervento da confermare:
- nuovo audit esclusivamente di lettura di app/gestione-ordini/page.js;
- verifica completa della funzione aggiornaStato, dei suoi utilizzi e delle dipendenze della visualizzazione stato;
- creazione o riallineamento di un TEST dedicato partendo dall'ufficiale corrente;
- eventuale rimozione nel TEST esclusivamente dei quattro pulsanti BOZZA / LAVORAZIONE / PRONTO / CONSEGNATO;
- eventuale rimozione di aggiornaStato soltanto se il nuovo audit conferma che non rimangono utilizzi;
- mantenimento del campo stato nel database, della visualizzazione dello stato attuale e del filtro stato;
- nessuna modifica a Supabase, schema database o pagine di stampa nello stesso intervento.

Stato dipendenza stampe:
- Stampa Totale, Andrea e Raffaele non filtrano più gli ordini per stato;
- per la data selezionata vengono caricati gli ordini indipendentemente dal valore stato;
- la rimozione dei pulsanti di cambio stato non deve quindi essere compensata con modifiche alle pagine di stampa.

Interventi funzionali successivi ancora previsti:
- valutare separatamente, solo se richiesto, l'eventuale ulteriore semplificazione della visualizzazione e del filtro stato;
- etichette descrittive delle zone mantenendo i valori database numerici;
- controllo integrità anche per Stampa Andrea;
- controllo integrità anche per Stampa Raffaele;
- apprendimento della posizione abituale dei clienti;
- analisi e classificazione dei numerosi file TEST, backup e script non tracciati;
- rimozione futura della funzione/API Telegram, solo dopo analisi separata e autorizzazione.

Interventi tecnici e di sicurezza da mantenere separati:
- versionare nel repository la definizione SQL di public.crea_ordine_atomico con relativa procedura di migrazione e rollback;
- analizzare RLS e privilegi diretti anon/authenticated su ordini e righe_ordine senza mescolare questa attività con correzioni funzionali;
- verificare separatamente la protezione di accesso alla route /ordine-manuale.

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
