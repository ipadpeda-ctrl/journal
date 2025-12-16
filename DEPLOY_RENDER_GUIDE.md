# Guida Deployment su Render

## IMPORTANTE: Autenticazione

Questo progetto usa **Replit Auth** che funziona solo su Replit. Per deployare su Render hai due opzioni:

### Opzione A: Uso personale (senza login)
Se sei l'unico utente, puoi disabilitare l'autenticazione. Il sito funzionera senza login.

### Opzione B: Multi-utente (richiede configurazione)
Per supportare piu utenti con login, dovrai implementare un sistema di autenticazione alternativo (es. email/password, Google OAuth, etc.).

**Questa guida assume l'Opzione A (uso personale senza login).**

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
6. Copia l'**Internal Database URL** (ti servirà dopo)

### Opzione B: Usa Neon, Supabase o altro
- Crea un database PostgreSQL e copia la connection string

## Passo 5: Deploy su Render

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
| `REPLIT_DEPLOYMENT` | `1` |
| `SKIP_AUTH` | `true` |

6. Clicca **"Create Web Service"**

## Passo 6: Inizializza il database

Dopo il primo deploy, devi creare le tabelle nel database. Hai due opzioni:

### Opzione A: Da Render Shell (se disponibile)
1. Su Render, vai al tuo Web Service
2. Clicca sulla tab **"Shell"**
3. Esegui: `npx drizzle-kit push`

### Opzione B: Esegui localmente prima del deploy
1. Nella cartella del progetto sul tuo PC, crea un file `.env` con:
   ```
   DATABASE_URL=postgresql://TUA_CONNECTION_STRING
   ```
2. Esegui: `npm install && npx drizzle-kit push`

Questo creerà tutte le tabelle necessarie (users, trades, sessions, diary, goals).

## Passo 7: Verifica

1. Attendi che il deploy sia completato (status: **Live**)
2. Clicca sull'URL del tuo sito (es: `https://trading-journal-xxxx.onrender.com`)
3. Il sito dovrebbe caricarsi correttamente

## Troubleshooting

### Il sito non si carica
- Controlla i **Logs** su Render per vedere gli errori
- Verifica che DATABASE_URL sia corretto

### Errore database
- Assicurati di aver eseguito `npm run db:push`
- Verifica che il database sia attivo

### Il free tier si spegne
- Il piano gratuito di Render mette il sito in "sleep" dopo 15 minuti di inattività
- Il primo accesso dopo lo sleep richiede ~30 secondi
- Per evitarlo, puoi passare a un piano a pagamento

## Variabili d'ambiente necessarie

| Variabile | Descrizione |
|-----------|-------------|
| `DATABASE_URL` | Connection string PostgreSQL |
| `SESSION_SECRET` | Chiave segreta per le sessioni (minimo 32 caratteri) |
| `NODE_ENV` | Deve essere `production` |
| `REPLIT_DEPLOYMENT` | Deve essere `1` |
| `SKIP_AUTH` | Imposta a `true` per disabilitare il login (uso personale) |

## Note importanti

- Il piano gratuito di Render ha limitazioni (si spegne dopo inattività)
- Il database gratuito di Render scade dopo 90 giorni
- Considera un piano a pagamento per uso continuativo
