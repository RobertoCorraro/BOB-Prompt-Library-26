# Guida Completa - BOB Prompt Library

Questa guida ti aiuterà a configurare, gestire e pubblicare la tua applicazione BOB Prompt Library, anche se non hai esperienza di sviluppo.

## 📋 Indice

1. [Introduzione](#introduzione)
2. [Capire React e la Struttura del Progetto](#capire-react-e-la-struttura-del-progetto)
3. [Configurazione Iniziale](#configurazione-iniziale)
4. [Modifica delle Credenziali di Accesso](#modifica-delle-credenziali-di-accesso)
5. [Configurazione Database Supabase](#configurazione-database-supabase)
6. [Esecuzione in Locale](#esecuzione-in-locale)
7. [Build per Produzione](#build-per-produzione)
8. [Deploy su Server Linux](#deploy-su-server-linux)
9. [Deploy tramite FTP](#deploy-tramite-ftp)
10. [Gestione e Manutenzione](#gestione-e-manutenzione)

---

## Introduzione

**BOB Prompt Library** è un'applicazione web per gestire e organizzare i tuoi prompt AI. Le funzionalità principali includono:

- 📱 **Design mobile-first**: Ottimizzato per smartphone
- 🔐 **Login protetto**: Accesso sicuro con username e password
- 📂 **Categorie dinamiche**: Organizza i prompt per categoria
- 🏷️ **Tipologie personalizzabili**: Filtra per tipo di prompt
- ✏️ **CRUD completo**: Crea, modifica ed elimina prompt
- 📋 **Copia rapida**: Un tap per copiare il prompt negli appunti
- ☁️ **Database cloud**: Sincronizzazione con Supabase (opzionale)

---

## Capire React e la Struttura del Progetto

### Cos'è React e Perché Serve Avviarlo?

React è una **libreria JavaScript** per costruire interfacce utente. A differenza di un semplice sito HTML statico, un'applicazione React:

1. **È dinamica**: Il contenuto cambia senza ricaricare la pagina
2. **È componibile**: L'interfaccia è divisa in componenti riutilizzabili
3. **Richiede compilazione**: Il codice React (JSX) deve essere trasformato in JavaScript normale

**Perché devo "avviare" l'app?**

Quando sviluppi in React, hai bisogno di un **server di sviluppo** che:
- Compila il codice JSX in JavaScript
- Aggiorna automaticamente il browser quando modifichi i file
- Serve i file sulla porta locale (es. http://localhost:5173)

Questo è diverso da un sito HTML statico che puoi aprire direttamente nel browser.

### Struttura del Progetto

```
BOB-Prompt-Library/
├── src/                          # Codice sorgente dell'applicazione
│   ├── components/               # Componenti React riutilizzabili
│   │   ├── AdminModal.jsx        # Modal per creare/modificare prompt
│   │   ├── CategoryMenu.jsx      # Menu orizzontale delle categorie
│   │   ├── FilterBar.jsx         # Barra filtri per tipologia
│   │   ├── Header.jsx            # Header con logo e menu
│   │   ├── Login.jsx             # Schermata di login
│   │   ├── PromptCard.jsx        # Card singolo prompt
│   │   ├── SettingsModal.jsx     # Modal per gestire categorie/tipologie
│   │   └── Toast.jsx             # Notifiche toast
│   ├── lib/
│   │   └── supabase.js           # Configurazione client Supabase
│   ├── App.jsx                   # Componente principale dell'app
│   ├── auth.config.js            # Credenziali di login
│   ├── index.css                 # Stili globali (Tailwind)
│   └── main.jsx                  # Entry point dell'applicazione
├── public/                       # File statici (immagini, favicon)
├── dist/                         # Build di produzione (creata con npm run build)
├── node_modules/                 # Dipendenze installate (non modificare)
├── index.html                    # Template HTML principale
├── package.json                  # Configurazione progetto e dipendenze
├── schema.sql                    # Schema database Supabase
├── vite.config.js                # Configurazione Vite (build tool)
└── tailwind.config.js            # Configurazione Tailwind CSS
```

### File e Cartelle Importanti

#### 📁 `src/` - Il Cuore dell'Applicazione

**`src/App.jsx`** - Il componente principale
- Gestisce lo stato globale (prompts, categorie, tipologie)
- Coordina tutti gli altri componenti
- Gestisce la logica di autenticazione
- Comunica con Supabase

**`src/components/`** - Componenti Riutilizzabili
Ogni file `.jsx` è un componente React:
- `PromptCard.jsx`: Mostra un singolo prompt con pulsante copia
- `AdminModal.jsx`: Form per creare/modificare prompt
- `Header.jsx`: Barra superiore con menu
- `Login.jsx`: Schermata di login

**`src/auth.config.js`** - Credenziali di Login
```javascript
export const AUTH_CONFIG = {
  username: 'admin',
  password: 'changeme123'
};
```

**`src/lib/supabase.js`** - Connessione Database
Configura la connessione a Supabase usando le variabili d'ambiente.

#### 📁 `public/` - File Statici
Contiene immagini, favicon e altri file che non vengono processati.

#### 📁 `dist/` - Build di Produzione
Creata automaticamente con `npm run build`. Contiene i file ottimizzati pronti per il deploy.

#### 📄 File di Configurazione

**`package.json`** - Configurazione del Progetto
- Elenca tutte le dipendenze (React, Vite, Tailwind, etc.)
- Definisce gli script npm (dev, build, preview)

**`vite.config.js`** - Configurazione Build Tool
Vite è il tool che compila e serve l'applicazione.

**`tailwind.config.js`** - Configurazione CSS
Tailwind è il framework CSS utilizzato per lo styling.

### Dove Vengono Pescati i Dati?

#### Con Supabase (Configurato)

Quando configuri Supabase (file `.env` con credenziali):
1. L'app si connette al database cloud
2. I dati vengono caricati da 4 tabelle:
   - `prompts`: I tuoi prompt
   - `categories`: Le categorie
   - `types`: Le tipologie
   - `prompt_tags`: I tag per i bottoni
3. Ogni modifica viene salvata permanentemente

#### Senza Supabase (Mock Data)

Se non configuri Supabase:
1. L'app usa dati fittizi definiti in `App.jsx`:
   ```javascript
   const MOCK_CATEGORIES = ['Psicologia', 'Marketing', 'Business'];
   const MOCK_TYPES = ['Prompt parziale', 'Prompt template'];
   ```
2. I dati sono memorizzati solo in **memoria RAM**
3. Quando ricarichi la pagina, le modifiche si perdono
4. Utile per testare l'app senza configurare un database

### Come Funziona il Flusso dei Dati

```
[Browser] ←→ [React App] ←→ [Supabase Database]
                  ↓
            [Componenti]
            - PromptCard
            - AdminModal
            - CategoryMenu
            etc.
```

1. **Caricamento iniziale**: App.jsx carica i dati da Supabase (o mock)
2. **Visualizzazione**: I dati vengono passati ai componenti come "props"
3. **Interazione utente**: Click su pulsanti → Chiamate a funzioni in App.jsx
4. **Aggiornamento**: App.jsx aggiorna Supabase e lo stato locale
5. **Re-render**: React aggiorna automaticamente l'interfaccia

---

## Configurazione Iniziale

### Requisiti

Prima di iniziare, assicurati di avere installato:

1. **Node.js** (versione 18 o superiore)
   - Scarica da: https://nodejs.org/
   - Durante l'installazione, seleziona "Add to PATH"
   - Verifica l'installazione aprendo il terminale e digitando:
     ```bash
     node --version
     npm --version
     ```

### Installazione Dipendenze

1. Apri il terminale nella cartella del progetto
2. Esegui il comando:
   ```bash
   npm install
   ```
3. Attendi il completamento (potrebbero volerci alcuni minuti)

---

## Modifica delle Credenziali di Accesso

Le credenziali di login sono memorizzate in un file facile da modificare.

### Passaggi

1. Apri il file `src/auth.config.js`
2. Troverai questo codice:
   ```javascript
   export const AUTH_CONFIG = {
     username: 'admin',
     password: 'changeme123'
   };
   ```
3. Modifica `username` e `password` con i tuoi valori desiderati
4. Salva il file

> **⚠️ IMPORTANTE**: Queste credenziali sono memorizzate nel codice sorgente. Per un'applicazione pubblica, considera l'utilizzo di Supabase Authentication (vedi sezione avanzata).

---

## Configurazione Database Supabase

Supabase è un servizio cloud gratuito che ti permette di salvare i tuoi prompt online e sincronizzarli tra dispositivi.

### Creazione Account e Progetto

1. **Registrati su Supabase**
   - Vai su https://supabase.com
   - Clicca su "Start your project"
   - Registrati con email o GitHub

2. **Crea un nuovo progetto**
   - Clicca su "New Project"
   - Scegli un nome (es. "bob-prompt-library")
   - Imposta una password sicura per il database
   - Seleziona una regione vicina a te
   - Clicca su "Create new project"
   - Attendi 1-2 minuti per la creazione

### Configurazione del Database

1. **Apri SQL Editor**
   - Nel menu laterale, clicca su "SQL Editor"
   - Clicca su "New query"

2. **Esegui lo schema SQL**
   - Apri il file `schema.sql` nella cartella del progetto
   - Copia tutto il contenuto
   - Incollalo nell'editor SQL di Supabase
   - Clicca su "Run" (o premi F5)
   - Dovresti vedere il messaggio "Success. No rows returned"

3. **Ottieni le credenziali API**
   - Nel menu laterale, clicca su "Settings" (icona ingranaggio)
   - Clicca su "API"
   - Troverai due informazioni importanti:
     - **Project URL**: qualcosa come `https://xxxxx.supabase.co`
     - **anon public**: una lunga stringa che inizia con `eyJ...`

### Configurazione dell'Applicazione

1. **Crea il file `.env`**
   - Nella cartella principale del progetto, crea un nuovo file chiamato `.env`
   - Apri il file con un editor di testo

2. **Aggiungi le credenziali**
   ```env
   VITE_SUPABASE_URL=https://tuo-progetto.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
   - Sostituisci i valori con quelli copiati da Supabase
   - Salva il file

3. **Riavvia l'applicazione**
   - Se l'app è in esecuzione, fermala (Ctrl+C nel terminale)
   - Riavviala con `npm run dev`

> **✅ Fatto!** Ora i tuoi prompt saranno salvati su Supabase invece che solo in memoria.

---

## Esecuzione in Locale

### Avvio dell'Applicazione - Guida Dettagliata

#### Metodo 1: Terminale Integrato VS Code (Consigliato)

1. **Apri VS Code** nella cartella del progetto
2. **Apri il terminale integrato**:
   - Menu: `Terminal` → `New Terminal`
   - Oppure: `Ctrl+ò` (Windows/Linux) o `Cmd+ò` (Mac)
3. **Verifica di essere nella cartella corretta**:
   - Il terminale dovrebbe mostrare il percorso del progetto
   - Esempio: `C:\Users\Utente\Local Sites\TEST Antigravity>`
4. **Avvia il server di sviluppo**:
   ```bash
   npm run dev
   ```
5. **Attendi il messaggio di conferma**:
   ```
   VITE v5.x.x  ready in xxx ms
   
   ➜  Local:   http://localhost:5173/
   ➜  Network: use --host to expose
   ```
6. **Apri il browser**:
   - Vai su `http://localhost:5173`
   - Oppure: `Ctrl+Click` sul link nel terminale

#### Metodo 2: PowerShell/CMD (Se hai problemi con npm)

Se ricevi l'errore "Impossibile caricare il file npm.ps1":

**Soluzione A - Usa CMD invece di PowerShell**:
```bash
cmd /c "npm run dev"
```

**Soluzione B - Cambia policy PowerShell** (richiede privilegi admin):
1. Apri PowerShell come Amministratore
2. Esegui:
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```
3. Conferma con `Y`
4. Riprova `npm run dev`

**Soluzione C - Usa Git Bash** (se installato):
```bash
npm run dev
```

#### Metodo 3: Terminale di Sistema

1. **Apri il terminale**:
   - Windows: Cerca "cmd" o "PowerShell" nel menu Start
   - Mac: Apri "Terminal" da Applicazioni → Utility
   - Linux: `Ctrl+Alt+T`

2. **Naviga alla cartella del progetto**:
   ```bash
   cd "C:\Users\Utente\Local Sites\TEST Antigravity"
   ```
   (Sostituisci con il tuo percorso)

3. **Avvia il server**:
   ```bash
   npm run dev
   ```

### Cosa Succede Quando Avvii l'App?

1. **Vite si avvia**: Il build tool inizia a monitorare i file
2. **Compila il codice**: Trasforma JSX in JavaScript
3. **Avvia un server locale**: Sulla porta 5173
4. **Hot Module Replacement (HMR)**: Aggiorna automaticamente il browser quando modifichi i file

### Comandi Utili

```bash
# Avvia il server di sviluppo
npm run dev

# Crea la build di produzione
npm run build

# Anteprima della build di produzione
npm run preview

# Installa/aggiorna dipendenze
npm install

# Pulisci node_modules e reinstalla
rm -rf node_modules package-lock.json
npm install
```

### Problemi Comuni e Soluzioni

#### Errore: "npm: command not found"
- **Causa**: Node.js non è installato o non è nel PATH
- **Soluzione**: Installa Node.js da https://nodejs.org/

#### Errore: "Port 5173 is already in use"
- **Causa**: Un'altra istanza dell'app è già in esecuzione
- **Soluzione**: 
  1. Chiudi l'altra istanza (Ctrl+C nel terminale)
  2. Oppure usa una porta diversa: `npm run dev -- --port 3000`

#### Errore: "Cannot find module"
- **Causa**: Dipendenze non installate
- **Soluzione**: Esegui `npm install`

#### La pagina è bianca
- **Causa**: Errore JavaScript
- **Soluzione**: 
  1. Apri la console del browser (F12)
  2. Cerca errori in rosso
  3. Controlla il terminale per errori di compilazione

### Per Fermare l'Applicazione

1. Nel terminale dove l'app è in esecuzione
2. Premi `Ctrl+C`
3. Conferma con `Y` se richiesto

---

## Build per Produzione

### Cos'è una "Build"?

Quando sviluppi l'applicazione, il codice è organizzato in molti file separati per facilitare le modifiche. Una **build** è il processo che:

1. Prende tutti i file del progetto
2. Li ottimizza (riduce dimensioni, migliora velocità)
3. Li combina in pochi file pronti per essere pubblicati
4. Li inserisce in una cartella chiamata `dist`

Pensa alla build come "impacchettare" la tua app per la spedizione.

### Come Creare una Build

1. Apri il terminale nella cartella del progetto
2. Esegui:
   ```bash
   npm run build
   ```
3. Attendi il completamento (di solito 10-30 secondi)
4. Vedrai una nuova cartella `dist` con i file pronti per il deploy

> **📁 Contenuto della cartella `dist`**:
> - `index.html`: La pagina principale
> - `assets/`: Cartella con JavaScript, CSS e immagini ottimizzati

---

## Deploy su Server Linux

Questa sezione spiega come pubblicare l'applicazione su un server Linux che possiedi.

### Prerequisiti

- Accesso SSH al tuo server Linux
- Un web server installato (Nginx o Apache)
- Un dominio o indirizzo IP pubblico

### Metodo 1: Upload via SFTP (Consigliato per Principianti)

1. **Crea la build** (vedi sezione precedente)

2. **Connettiti al server con SFTP**
   - Usa un client SFTP come FileZilla (https://filezilla-project.org/)
   - Inserisci:
     - Host: indirizzo IP del tuo server
     - Username: il tuo username SSH
     - Password: la tua password SSH
     - Porta: 22

3. **Carica i file**
   - Nel pannello locale, naviga alla cartella `dist` del progetto
   - Nel pannello remoto, naviga alla cartella del web server:
     - Nginx: `/var/www/html/bob-prompt-library`
     - Apache: `/var/www/html/bob-prompt-library`
   - Seleziona tutti i file dentro `dist` e trascinali nel pannello remoto

### Metodo 2: Upload via SCP (Linea di Comando)

```bash
# Dalla cartella del progetto
scp -r dist/* utente@tuo-server.com:/var/www/html/bob-prompt-library/
```

Sostituisci:
- `utente`: il tuo username SSH
- `tuo-server.com`: l'indirizzo del tuo server

### Configurazione Nginx

1. **Connettiti al server via SSH**
   ```bash
   ssh utente@tuo-server.com
   ```

2. **Crea un file di configurazione**
   ```bash
   sudo nano /etc/nginx/sites-available/bob-prompt-library
   ```

3. **Incolla questa configurazione**
   ```nginx
   server {
       listen 80;
       server_name tuo-dominio.com;  # Sostituisci con il tuo dominio
       
       root /var/www/html/bob-prompt-library;
       index index.html;
       
       location / {
           try_files $uri $uri/ /index.html;
       }
       
       # Compressione per migliorare le prestazioni
       gzip on;
       gzip_types text/css application/javascript application/json;
   }
   ```

4. **Attiva il sito**
   ```bash
   sudo ln -s /etc/nginx/sites-available/bob-prompt-library /etc/nginx/sites-enabled/
   sudo nginx -t  # Verifica la configurazione
   sudo systemctl reload nginx
   ```

### Configurazione Apache

1. **Connettiti al server via SSH**

2. **Crea un file di configurazione**
   ```bash
   sudo nano /etc/apache2/sites-available/bob-prompt-library.conf
   ```

3. **Incolla questa configurazione**
   ```apache
   <VirtualHost *:80>
       ServerName tuo-dominio.com
       DocumentRoot /var/www/html/bob-prompt-library
       
       <Directory /var/www/html/bob-prompt-library>
           Options -Indexes +FollowSymLinks
           AllowOverride All
           Require all granted
           
           # Rewrite per SPA
           RewriteEngine On
           RewriteBase /
           RewriteRule ^index\.html$ - [L]
           RewriteCond %{REQUEST_FILENAME} !-f
           RewriteCond %{REQUEST_FILENAME} !-d
           RewriteRule . /index.html [L]
       </Directory>
   </VirtualHost>
   ```

4. **Attiva il sito**
   ```bash
   sudo a2ensite bob-prompt-library
   sudo a2enmod rewrite  # Abilita mod_rewrite
   sudo systemctl reload apache2
   ```

### Configurazione Variabili d'Ambiente sul Server

Se usi Supabase, devi configurare le variabili d'ambiente anche sul server:

1. **Crea il file `.env` sul server**
   ```bash
   cd /var/www/html/bob-prompt-library
   sudo nano .env
   ```

2. **Aggiungi le credenziali**
   ```env
   VITE_SUPABASE_URL=https://tuo-progetto.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

3. **Ricostruisci l'applicazione con le variabili**
   
   > **⚠️ IMPORTANTE**: Le variabili d'ambiente di Vite vengono incorporate durante la build, non a runtime. Quindi devi:
   
   - Configurare il file `.env` sul tuo computer locale
   - Eseguire `npm run build` localmente
   - Caricare la nuova build sul server

### Verifica

1. Apri il browser e vai su `http://tuo-dominio.com`
2. Dovresti vedere la schermata di login di BOB Prompt Library

### Configurazione HTTPS (Opzionale ma Consigliato)

Per abilitare HTTPS con certificato gratuito:

```bash
sudo apt install certbot python3-certbot-nginx  # Per Nginx
# oppure
sudo apt install certbot python3-certbot-apache  # Per Apache

sudo certbot --nginx -d tuo-dominio.com  # Per Nginx
# oppure
sudo certbot --apache -d tuo-dominio.com  # Per Apache
```

Segui le istruzioni a schermo.

---

## Deploy tramite FTP

Se non hai accesso SSH ma solo FTP, puoi comunque pubblicare l'applicazione seguendo questi passaggi.

### Prerequisiti

- Accesso FTP al tuo hosting
- Un client FTP (es. FileZilla, WinSCP, Cyberduck)
- Hosting che supporta file statici HTML/JS/CSS

### Passaggi per il Deploy

#### 1. Crea la Build di Produzione

Sul tuo computer locale:

```bash
# Assicurati di essere nella cartella del progetto
cd "C:\Users\Utente\Local Sites\TEST Antigravity"

# Crea la build
npm run build
```

Questo creerà una cartella `dist` con tutti i file ottimizzati.

#### 2. Configura il Client FTP

**FileZilla (Esempio)**:

1. Apri FileZilla
2. File → Site Manager → New Site
3. Inserisci i dati del tuo hosting:
   - **Host**: ftp.tuosito.com (fornito dal tuo hosting)
   - **Port**: 21 (di solito)
   - **Protocol**: FTP - File Transfer Protocol
   - **Encryption**: Use explicit FTP over TLS if available
   - **Logon Type**: Normal
   - **User**: il tuo username FTP
   - **Password**: la tua password FTP
4. Clicca "Connect"

#### 3. Carica i File

1. **Nel pannello locale** (sinistra):
   - Naviga alla cartella `dist` del progetto
   - Esempio: `C:\Users\Utente\Local Sites\TEST Antigravity\dist`

2. **Nel pannello remoto** (destra):
   - Naviga alla cartella pubblica del tuo hosting
   - Di solito è: `public_html`, `www`, `htdocs`, o `web`
   - Crea una sottocartella se vuoi (es. `public_html/bob-prompt-library`)

3. **Carica tutti i file**:
   - Seleziona TUTTI i file e cartelle dentro `dist`
   - Trascinali nel pannello remoto
   - Attendi il completamento del caricamento

#### 4. Struttura File sul Server

Dopo il caricamento, la struttura sul server dovrebbe essere:

```
public_html/bob-prompt-library/
├── index.html
├── assets/
│   ├── index-xxxxx.js
│   ├── index-xxxxx.css
│   └── ...
└── vite.svg (se presente)
```

#### 5. Configurazione per SPA (Single Page Application)

Molti hosting richiedono una configurazione speciale per le SPA React.

**Se il tuo hosting supporta `.htaccess` (Apache)**:

1. Crea un file chiamato `.htaccess` nella cartella del progetto locale
2. Aggiungi questo contenuto:
   ```apache
   <IfModule mod_rewrite.c>
     RewriteEngine On
     RewriteBase /bob-prompt-library/
     RewriteRule ^index\.html$ - [L]
     RewriteCond %{REQUEST_FILENAME} !-f
     RewriteCond %{REQUEST_FILENAME} !-d
     RewriteRule . /bob-prompt-library/index.html [L]
   </IfModule>
   ```
3. Caricalo via FTP nella stessa cartella di `index.html`

**Se il tuo hosting usa Nginx**:

Dovrai contattare il supporto del tuo hosting per aggiungere questa configurazione:
```nginx
location /bob-prompt-library {
    try_files $uri $uri/ /bob-prompt-library/index.html;
}
```

#### 6. Configurazione Variabili d'Ambiente

> **⚠️ IMPORTANTE**: Le variabili d'ambiente di Vite vengono incorporate durante la build, non possono essere configurate sul server FTP.

Se usi Supabase:

1. Configura il file `.env` sul tuo computer locale
2. Esegui `npm run build` localmente
3. Carica la build via FTP

**Non puoi** modificare le variabili d'ambiente dopo il deploy via FTP.

### Verifica del Deploy

1. Apri il browser
2. Vai su: `http://tuosito.com/bob-prompt-library/`
3. Dovresti vedere la schermata di login

### Problemi Comuni con FTP

#### Errore 404 - Pagina non trovata

**Causa**: File non caricati correttamente o percorso errato

**Soluzione**:
- Verifica che `index.html` sia nella cartella corretta
- Controlla che il percorso URL corrisponda alla cartella sul server
- Assicurati di aver caricato TUTTI i file da `dist`

#### Pagina bianca

**Causa**: Percorsi delle risorse non corretti

**Soluzione**:
1. Apri la console del browser (F12)
2. Cerca errori 404 per file CSS/JS
3. Se vedi errori, potrebbe essere necessario configurare `base` in `vite.config.js`:
   ```javascript
   export default defineConfig({
     base: '/bob-prompt-library/',  // Aggiungi questa riga
     plugins: [react()],
   })
   ```
4. Ricostruisci con `npm run build`
5. Ricarica i file via FTP

#### Gli stili non vengono applicati

**Causa**: File CSS non caricati

**Soluzione**:
- Verifica che la cartella `assets` sia stata caricata completamente
- Controlla i permessi dei file sul server (di solito 644 per i file, 755 per le cartelle)

#### Errore "Cannot GET /bob-prompt-library/qualsiasi-pagina"

**Causa**: Routing SPA non configurato

**Soluzione**:
- Aggiungi il file `.htaccess` come descritto sopra
- Se non funziona, contatta il supporto del tuo hosting

### Aggiornamento dell'Applicazione via FTP

Quando ricevi una nuova versione:

1. **Backup**: Scarica la cartella attuale dal server (per sicurezza)
2. **Build locale**: Esegui `npm run build` sul tuo computer
3. **Elimina vecchi file**: Cancella i vecchi file dalla cartella remota
4. **Carica nuovi file**: Carica tutti i file dalla nuova cartella `dist`

### Limitazioni del Deploy FTP

- ❌ Non puoi modificare variabili d'ambiente sul server
- ❌ Non puoi eseguire comandi npm sul server
- ❌ Configurazione web server limitata
- ✅ Semplice e accessibile
- ✅ Non richiede conoscenze tecniche avanzate
- ✅ Funziona con la maggior parte degli hosting condivisi

---

## Gestione e Manutenzione

### Aggiornamento Credenziali

1. Modifica `src/auth.config.js`
2. Esegui `npm run build`
3. Carica i nuovi file sul server

### Aggiunta di Categorie e Tipologie

Puoi gestire categorie e tipologie direttamente dall'app:

1. Accedi all'applicazione
2. Clicca sul menu hamburger (☰) in alto a destra
3. Seleziona "Gestisci Categorie" o "Gestisci Tipologie"
4. Aggiungi o elimina elementi

> **💡 Nota**: Se usi Supabase, le modifiche saranno salvate nel database. Altrimenti, saranno perse al riavvio.

### Backup dei Dati

#### Con Supabase

1. Vai su Supabase Dashboard
2. Clicca su "Database" → "Backups"
3. Supabase crea backup automatici giornalieri
4. Puoi anche esportare manualmente:
   - "Table Editor" → Seleziona tabella → "Export" → "CSV"

#### Senza Supabase (Solo Locale)

I dati sono memorizzati solo in memoria e si perdono al riavvio. Per un backup permanente, configura Supabase.

### Aggiornamento dell'Applicazione

Quando ricevi una nuova versione:

1. Sostituisci i file del progetto con quelli nuovi
2. Esegui `npm install` (per aggiornare dipendenze)
3. Esegui `npm run build`
4. Carica la nuova build sul server

### Risoluzione Problemi Comuni

#### L'app non si avvia in locale

- Verifica che Node.js sia installato: `node --version`
- Elimina `node_modules` e `package-lock.json`, poi esegui `npm install`
- Controlla che la porta 5173 non sia già in uso

#### Login non funziona

- Verifica le credenziali in `src/auth.config.js`
- Cancella la cache del browser (Ctrl+Shift+Delete)
- Prova in modalità incognito

#### Supabase non si connette

- Verifica che il file `.env` sia nella cartella principale
- Controlla che le credenziali siano corrette
- Assicurati di aver eseguito lo schema SQL
- Riavvia l'applicazione dopo aver modificato `.env`

#### Errore 404 sul server dopo il deploy

- Verifica che la configurazione del web server includa il rewrite per SPA
- Controlla i permessi dei file: `sudo chmod -R 755 /var/www/html/bob-prompt-library`
- Riavvia il web server: `sudo systemctl restart nginx` o `apache2`

#### Pagina bianca dopo il deploy

- Apri la console del browser (F12) e cerca errori
- Verifica che tutti i file siano stati caricati correttamente
- Controlla che il percorso in `base` nel `vite.config.js` sia corretto

---

## Supporto

Per ulteriore assistenza:

- Controlla i log del browser (F12 → Console)
- Controlla i log del server: `sudo tail -f /var/log/nginx/error.log`
- Verifica la documentazione di Supabase: https://supabase.com/docs

---

**Buon lavoro con BOB Prompt Library! 🚀**
