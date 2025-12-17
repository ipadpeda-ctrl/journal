# Tutorial Autenticazione - Trading Journal

Questa guida ti spiega passo-passo come usare il sistema di login e registrazione del Trading Journal.

---

## Indice

1. [Primo Accesso - Creare l'Account Amministratore](#1-primo-accesso---creare-laccount-amministratore)
2. [Come Fare Login](#2-come-fare-login)
3. [Registrazione Nuovi Utenti](#3-registrazione-nuovi-utenti)
4. [Come Approvare gli Utenti (Solo Admin)](#4-come-approvare-gli-utenti-solo-admin)
5. [Gestione Ruoli Utente (Solo Super Admin)](#5-gestione-ruoli-utente-solo-super-admin)
6. [Come Fare Logout](#6-come-fare-logout)
7. [Risoluzione Problemi](#7-risoluzione-problemi)

---

## 1. Primo Accesso - Creare l'Account Amministratore

Quando avvii l'applicazione per la prima volta, non ci sono utenti registrati. Il **primo utente** che si registra diventa automaticamente il **Super Amministratore** con tutti i privilegi.

### Passaggi:

**Passo 1:** Apri l'applicazione nel browser. Verrai reindirizzato automaticamente alla pagina di login.

**Passo 2:** Clicca sul link **"Registrati qui"** sotto il pulsante di login.

**Passo 3:** Compila il modulo di registrazione:
- **Nome utente:** Scegli un nome che ti identifichi (es. "Mario" o "Admin")
- **Email:** Inserisci la tua email (es. mario.rossi@email.com)
- **Password:** Scegli una password sicura (minimo 6 caratteri)
- **Conferma password:** Ripeti la stessa password

**Passo 4:** Clicca il pulsante **"Registrati"**.

**Passo 5:** Vedrai un messaggio di conferma. Ora sei registrato come Super Admin!

**Passo 6:** Verrai reindirizzato alla pagina di login. Inserisci email e password per entrare.

> **Nota importante:** Solo il primo utente diventa Super Admin automaticamente. Tutti gli altri dovranno essere approvati da te.

---

## 2. Come Fare Login

### Passaggi:

**Passo 1:** Vai alla pagina di login (di solito è la prima pagina che vedi).

**Passo 2:** Inserisci i tuoi dati:
- **Email:** L'email che hai usato per registrarti
- **Password:** La tua password

**Passo 3:** Clicca il pulsante **"Accedi"**.

**Passo 4:** Se i dati sono corretti, entrerai nell'applicazione.

### Cosa succede se sbaglio la password?

Vedrai un messaggio di errore rosso. Riprova inserendo i dati corretti.

---

## 3. Registrazione Nuovi Utenti

Quando altri utenti vogliono usare l'applicazione, devono registrarsi. Ma **non potranno entrare subito** - un amministratore dovrà approvarli prima.

### Passaggi per il nuovo utente:

**Passo 1:** Vai alla pagina di registrazione (clicca "Registrati qui" dalla pagina di login).

**Passo 2:** Compila tutti i campi:
- Nome utente
- Email
- Password
- Conferma password

**Passo 3:** Clicca **"Registrati"**.

**Passo 4:** Vedrai questo messaggio:

> "Registrazione completata! Il tuo account è in attesa di approvazione da parte di un amministratore."

**Passo 5:** Ora devi **aspettare** che un amministratore approvi il tuo account.

### Come sapere se sono stato approvato?

Prova a fare login:
- Se entri nell'applicazione → Sei stato approvato!
- Se vedi "Account in attesa di approvazione" → Devi ancora aspettare
- Se vedi "Account rifiutato" → L'admin ha rifiutato la tua richiesta

---

## 4. Come Approvare gli Utenti (Solo Admin)

Se sei un **Amministratore** o **Super Amministratore**, puoi approvare o rifiutare gli utenti che si registrano.

### Passaggi:

**Passo 1:** Fai login con il tuo account admin.

**Passo 2:** Clicca sulla voce **"Admin"** nel menu laterale (sidebar).

**Passo 3:** Nella sezione **"Gestione Utenti"**, vedrai la lista di tutti gli utenti.

**Passo 4:** Gli utenti in attesa hanno lo stato **"In attesa"** (giallo).

**Passo 5:** Per ogni utente in attesa, hai due opzioni:
- **Approva** (pulsante verde): L'utente potrà entrare nell'app
- **Rifiuta** (pulsante rosso): L'utente non potrà entrare

**Passo 6:** Clicca il pulsante che preferisci. Lo stato dell'utente cambierà immediatamente.

### Cosa vedono gli utenti dopo l'approvazione?

- **Utente approvato:** Può fare login e usare l'applicazione normalmente
- **Utente rifiutato:** Quando prova a fare login, vede un messaggio che dice che l'account è stato rifiutato

### Posso cambiare idea?

Sì! Puoi sempre:
- Revocare l'accesso a un utente approvato (cliccando "Revoca")
- Approvare un utente precedentemente rifiutato

---

## 5. Gestione Ruoli Utente (Solo Super Admin)

Solo il **Super Amministratore** può promuovere altri utenti ad amministratori.

### I tre ruoli disponibili:

| Ruolo | Cosa può fare |
|-------|---------------|
| **Utente** | Può solo vedere e gestire i propri trade |
| **Admin** | Può approvare/rifiutare utenti e vedere tutti i trade |
| **Super Admin** | Può fare tutto, incluso promuovere altri ad admin |

### Come promuovere un utente ad Admin:

**Passo 1:** Fai login come Super Admin.

**Passo 2:** Vai alla sezione **"Admin"** nel menu.

**Passo 3:** Trova l'utente che vuoi promuovere nella lista.

**Passo 4:** Clicca sul menu a tendina accanto al ruolo dell'utente.

**Passo 5:** Seleziona **"admin"** dal menu.

**Passo 6:** Il ruolo verrà aggiornato immediatamente.

> **Attenzione:** Non puoi modificare il ruolo del Super Admin originale.

---

## 6. Come Fare Logout

### Passaggi:

**Passo 1:** Guarda in alto a destra nella pagina. Vedrai il tuo nome utente.

**Passo 2:** Clicca sul tuo nome o sull'icona utente.

**Passo 3:** Clicca su **"Logout"** nel menu che appare.

**Passo 4:** Verrai riportato alla pagina di login.

---

## 7. Risoluzione Problemi

### "Non riesco a fare login"

**Possibili cause:**
1. **Email o password sbagliata** - Controlla di aver scritto tutto correttamente
2. **Account non ancora approvato** - Chiedi all'admin di approvare il tuo account
3. **Account rifiutato** - Contatta l'amministratore

**Soluzione:** Prova a reimpostare la password o contatta l'amministratore.

---

### "Ho dimenticato la password"

**Soluzione:**
1. Vai alla pagina di login
2. Clicca su "Password dimenticata?"
3. Inserisci la tua email
4. Riceverai un'email con un link per reimpostare la password
5. Clicca sul link e inserisci la nuova password

**Nota:** Il link scade dopo 1 ora. Se non ricevi l'email, controlla la cartella spam.

**Importante:** Per funzionare, l'amministratore deve aver configurato il servizio email (Resend). Vedi la sezione "Configurazione Email" più sotto.

---

### "Sono admin ma non vedo il menu Admin"

**Possibili cause:**
1. Il tuo ruolo potrebbe essere ancora "user"
2. Potresti dover ricaricare la pagina

**Soluzione:** 
- Premi F5 per ricaricare la pagina
- Se il problema persiste, chiedi al Super Admin di verificare il tuo ruolo

---

### "Ho approvato un utente ma non riesce ad entrare"

**Possibili cause:**
1. L'utente sta usando credenziali sbagliate
2. Potrebbe esserci un problema di cache nel browser

**Soluzione:**
- Chiedi all'utente di provare a fare login di nuovo
- Suggerisci di cancellare la cache del browser o usare una finestra in incognito

---

### "Non vedo nessun utente nella lista admin"

**Possibili cause:**
1. Nessun altro utente si è ancora registrato
2. Potrebbe esserci un problema di connessione

**Soluzione:** Aspetta che altri utenti si registrino. Appariranno automaticamente nella lista.

---

## Configurazione Email (Per Amministratori)

Per abilitare il reset password via email, devi configurare **Resend** (servizio gratuito fino a 3000 email/mese).

### Passaggi:

**Passo 1:** Vai su [resend.com](https://resend.com) e crea un account gratuito.

**Passo 2:** Nella dashboard di Resend, vai su "API Keys" e crea una nuova chiave.

**Passo 3:** Copia la chiave (inizia con `re_...`).

**Passo 4:** Aggiungi la chiave alle variabili d'ambiente del tuo server:
```
RESEND_API_KEY=re_la_tua_chiave_qui
```

**Passo 5:** (Opzionale) Configura l'indirizzo mittente:
```
EMAIL_FROM=Trading Journal <noreply@tuodominio.com>
```

**Nota:** Se non configuri un dominio personalizzato su Resend, le email verranno inviate da `noreply@resend.dev`.

---

## Cambiare la Password

Se sei già loggato e vuoi cambiare la tua password:

**Passo 1:** Vai nelle **Impostazioni** (icona ingranaggio nel menu).

**Passo 2:** Scorri fino alla sezione "Cambia Password".

**Passo 3:** Inserisci:
- La tua password attuale
- La nuova password (minimo 6 caratteri)
- Conferma la nuova password

**Passo 4:** Clicca "Cambia password".

**Passo 5:** Vedrai un messaggio di conferma. Da ora userai la nuova password.

---

## Glossario

| Termine | Significato |
|---------|-------------|
| **Login** | Entrare nell'applicazione con email e password |
| **Logout** | Uscire dall'applicazione |
| **Registrazione** | Creare un nuovo account |
| **Admin** | Amministratore - può gestire gli utenti |
| **Super Admin** | Amministratore principale con tutti i privilegi |
| **Approvazione** | Permesso dato da un admin per far entrare un utente |
| **Ruolo** | Il livello di permessi di un utente (user, admin, super_admin) |
| **Reset Password** | Reimpostare la password quando la dimentichi |
| **Resend** | Servizio per inviare email (usato per il reset password) |

---

## Hai altre domande?

Se hai bisogno di ulteriore assistenza, contatta l'amministratore del sistema o consulta la documentazione tecnica nel file `DEPLOY_RENDER_GUIDE.md`.
