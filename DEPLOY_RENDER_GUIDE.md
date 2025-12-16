# Guida Deployment su Render

## Sistema di Autenticazione

Questo progetto include un sistema completo di autenticazione email/password con:
- Registrazione utenti con approvazione admin
- Login/logout sicuro
- Gestione ruoli (super_admin, admin, user)
- Il primo utente registrato diventa automaticamente Super Admin

---

## Passo 1: Scarica i file da Replit

1. In Replit, clicca sui tre puntini (...) accanto alla cartella principale del progetto
2. Seleziona **"Download as zip"**
3. Estrai lo zip sul tuo computer

## Passo 2: Crea repository GitHub

1. Vai su [github.com](https://github.com) e accedi
2. Clicca sul **"+"** in alto a destra e seleziona **"New repository"**
3. Nome repository: `trading-journal` (o quello che preferisci)
4. Lascia **Private** se vuoi tenerlo privato
5. NON selezionare "Add a README file"
6. Clicca **"Create repository"**

## Passo 3: Carica i file su GitHub

Apri il terminale nella cartella del progetto estratto ed esegui:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/TUO_USERNAME/trading-journal.git
git push -u origin main
```

Sostituisci `TUO_USERNAME` con il tuo username GitHub.

## Passo 4: Crea database PostgreSQL

### Opzione A: Usa Render PostgreSQL (consigliato)
1. Vai su [render.com](https://render.com) e accedi
2. Clicca **"New"** > **"PostgreSQL"**
3. Nome: `trading-journal-db`
4. Piano: **Free** (per iniziare)
5. Clicca **"Create Database"**
6. Copia l'**Internal Database URL** (ti servira dopo)

### Opzione B: Usa Neon, Supabase o altro
- Crea un database PostgreSQL e copia la connection string

## Passo 5: Inizializza il database (IMPORTANTE!)

Prima del deploy, devi creare le tabelle nel database.

1. Nella cartella del progetto sul tuo PC, crea un file `.env` con:
   ```
   DATABASE_URL=postgresql://TUA_CONNECTION_STRING
   ```
   (Usa la connection string del passo 4)

2. Esegui nel terminale:
   ```bash
   npm install
   npx drizzle-kit push
   ```

Questo creera tutte le tabelle necessarie (users, trades, sessions, diary, goals).

## Passo 6: Deploy su Render

1. Su Render, clicca **"New"** > **"Web Service"**
2. Connetti il tuo account GitHub
3. Seleziona il repository `trading-journal`
4. Configura:
   - **Name**: `trading-journal`
   - **Region**: scegli la piu vicina (es. Frankfurt)
   - **Branch**: `main`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start`
   - **Instance Type**: `Free`

5. Clicca **"Advanced"** e aggiungi le **Environment Variables**:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | (incolla la connection string del database) |
| `SESSION_SECRET` | (genera una stringa random, es: `openssl rand -hex 32`) |
| `NODE_ENV` | `production` |

6. Clicca **"Create Web Service"**

## Passo 7: Primo Accesso

1. Attendi che il deploy sia completato (status: **Live**)
2. Vai all'URL del tuo sito (es: `https://trading-journal-xxxx.onrender.com`)
3. Clicca **"Registrati"** e crea il tuo account
4. **IMPORTANTE**: Il primo utente registrato diventa automaticamente Super Admin!
5. Ora puoi approvare o rifiutare le registrazioni di altri utenti dalla pagina Admin

## Come Funziona l'Approvazione Utenti

1. Un nuovo utente si registra sul sito
2. Il suo account e' "In Attesa" di approvazione
3. L'admin va nella pagina Admin > Utenti
4. L'admin puo:
   - **Approvare**: l'utente puo accedere
   - **Rifiutare**: l'utente non puo accedere
5. Solo gli utenti approvati possono usare l'applicazione

## Variabili d'ambiente

| Variabile | Descrizione | Obbligatoria |
|-----------|-------------|--------------|
| `DATABASE_URL` | Connection string PostgreSQL | Si |
| `SESSION_SECRET` | Chiave segreta per le sessioni (minimo 32 caratteri) | Si |
| `NODE_ENV` | Deve essere `production` | Si |

## Troubleshooting

### Il sito non si carica
- Controlla i **Logs** su Render per vedere gli errori
- Verifica che DATABASE_URL sia corretto

### Errore "relation does not exist"
- Assicurati di aver eseguito `npx drizzle-kit push` prima del deploy
- Verifica che il database sia attivo e raggiungibile

### Non riesco a registrarmi
- Verifica che il database sia connesso correttamente
- Controlla i log per errori specifici

### Il free tier si spegne
- Il piano gratuito di Render mette il sito in "sleep" dopo 15 minuti di inattivita
- Il primo accesso dopo lo sleep richiede ~30 secondi
- Per evitarlo, puoi passare a un piano a pagamento

## Note importanti

- Il piano gratuito di Render ha limitazioni (si spegne dopo inattivita)
- Il database gratuito di Render scade dopo 90 giorni
- Considera un piano a pagamento per uso continuativo
- Le password sono criptate con bcrypt (sicuro)
- Le sessioni durano 7 giorni
