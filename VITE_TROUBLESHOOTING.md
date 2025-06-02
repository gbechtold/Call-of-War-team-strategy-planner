# Vite Development Server Troubleshooting Guide

## Problem: http://localhost:5173/Call-of-War-team-strategy-planner/ lädt nicht in Chrome

### Schritt 1: Stelle sicher, dass du im richtigen Verzeichnis bist

```bash
cd /Users/guntrambechtold/Documents/Projects/BusinessProjects/React\ Based\ Frontend\ Gantt\ Chart\ Planner/Call-of-War-team-strategy-planner
```

### Schritt 2: Installiere Dependencies (falls noch nicht geschehen)

```bash
npm install
```

### Schritt 3: Starte den Development Server

```bash
npm run dev
```

### Schritt 4: Überprüfe die Konsolen-Ausgabe

Nach dem Start solltest du diese Meldung sehen:
```
VITE v6.3.5  ready in XXX ms

➜  Local:   http://localhost:5173/Call-of-War-team-strategy-planner/
➜  Network: use --host to expose
```

### Schritt 5: Öffne die richtige URL

Die korrekte URL ist:
```
http://localhost:5173/Call-of-War-team-strategy-planner/
```

**Wichtig:** Der Pfad `/Call-of-War-team-strategy-planner/` am Ende ist notwendig wegen der Vite-Konfiguration!

### Häufige Probleme und Lösungen

#### Problem 1: Port 5173 ist bereits belegt
**Symptom:** Fehlermeldung "Port 5173 is already in use"

**Lösung:**
```bash
# Finde den Prozess auf Port 5173
lsof -i :5173

# Beende den Prozess (ersetze PID mit der tatsächlichen Prozess-ID)
kill -9 PID

# Oder starte Vite auf einem anderen Port
npm run dev -- --port 3000
```

#### Problem 2: Seite lädt, aber zeigt nur eine leere Seite
**Mögliche Ursachen:**
1. JavaScript-Fehler in der Browser-Konsole
2. Falsche URL (ohne den Pfad am Ende)

**Lösung:**
1. Öffne die Chrome Developer Tools (F12)
2. Schaue in die Console nach Fehlermeldungen
3. Stelle sicher, dass die URL korrekt ist (mit `/Call-of-War-team-strategy-planner/` am Ende)

#### Problem 3: "Cannot GET /" Fehler
**Ursache:** Du bist auf `http://localhost:5173/` ohne den Pfad

**Lösung:** Nutze die vollständige URL: `http://localhost:5173/Call-of-War-team-strategy-planner/`

#### Problem 4: Vite startet nicht
**Symptom:** Fehlermeldungen beim Start

**Lösungen:**
```bash
# Lösche node_modules und installiere neu
rm -rf node_modules package-lock.json
npm install

# Clear Vite Cache
rm -rf node_modules/.vite
npm run dev
```

### Alternative: Nutze die Live-Version

Wenn die lokale Entwicklung nicht funktioniert, kannst du auch die deployed Version nutzen:
```
https://gbechtold.github.io/Call-of-War-team-strategy-planner/
```

### Schritt-für-Schritt Neustart

1. **Terminal öffnen**
2. **Ins Projektverzeichnis wechseln:**
   ```bash
   cd "/Users/guntrambechtold/Documents/Projects/BusinessProjects/React Based Frontend Gantt Chart Planner/Call-of-War-team-strategy-planner"
   ```

3. **Alle laufenden Prozesse beenden:**
   ```bash
   # Drücke Ctrl+C im Terminal wo npm run dev läuft
   ```

4. **Cache löschen und neu starten:**
   ```bash
   rm -rf node_modules/.vite
   npm run dev
   ```

5. **Warte auf die Bestätigung:**
   ```
   VITE v6.3.5  ready in XXX ms
   ```

6. **Öffne Chrome und navigiere zu:**
   ```
   http://localhost:5173/Call-of-War-team-strategy-planner/
   ```

### Debugging-Befehle

```bash
# Überprüfe ob Node.js installiert ist
node --version

# Überprüfe ob npm installiert ist
npm --version

# Überprüfe die Vite-Version
npx vite --version

# Zeige alle npm scripts
npm run

# Verbose Mode für mehr Details
npm run dev -- --debug
```

### Browser-spezifische Probleme

Wenn es nur in Chrome nicht funktioniert:
1. Lösche Browser-Cache (Cmd+Shift+R)
2. Deaktiviere Browser-Extensions
3. Teste in einem Inkognito-Fenster
4. Teste in einem anderen Browser (Safari, Firefox)

---

Wenn keiner dieser Schritte hilft, teile bitte die genaue Fehlermeldung aus:
- Terminal (wo npm run dev läuft)
- Browser Console (F12 → Console Tab)