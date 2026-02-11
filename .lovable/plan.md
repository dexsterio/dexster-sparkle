

# Produktionsklar PWA -- Dexster Chat

## Oversikt

Appen saknar idag all PWA-infrastruktur. Planen ar att bygga en fullt produktionsklar Progressive Web App med offline-stod, installationsprompt, uppdateringshantering, och alla metadata som kravs for app-stores och hemskarmsinstallation.

## Ny dependency

- `vite-plugin-pwa` (devDependency) -- genererar service worker, manifest och precache automatiskt

## Implementering

### 1. Vite-konfiguration (`vite.config.ts`)

Lagg till `VitePWA`-pluginen med fullstandig konfiguration:

- **registerType**: `"prompt"` -- visar en uppdateringsnotis nar ny version finns, istallet for att tvinga reload
- **Manifest**:
  - `name`: "Dexster Chat"
  - `short_name`: "Dexster"
  - `description`: "A modern messaging experience"
  - `theme_color`: "#7c5cfc" (primary-fargen)
  - `background_color`: "#0a0b14" (mork bakgrund)
  - `display`: "standalone"
  - `orientation`: "portrait"
  - `start_url`: "/"
  - `scope`: "/"
  - `categories`: ["social", "communication"]
  - `screenshots`: (tomma for nu, kan laggas till senare)
  - Ikoner i storlekar: 72, 96, 128, 144, 192, 384, 512 (genererade SVG-baserade PNG-placeholders)
  - `maskable`-ikon (512x512) for adaptiva ikoner pa Android
- **Workbox**:
  - `navigateFallbackDenylist`: `[/^\/~oauth/]` (kritiskt for auth-redirects)
  - `globPatterns`: `["**/*.{js,css,html,ico,png,svg,woff2}"]`
  - Runtime caching for Google Fonts (CacheFirst, 30 dagar)
  - Runtime caching for bilder (CacheFirst, 7 dagar, max 50 entries)
  - `cleanupOutdatedCaches`: true
  - `skipWaiting`: false (vanta pa anvandardens godkannande via prompt)

### 2. PWA-ikoner (`public/`)

Skapa SVG-baserade ikoner som renderar Dexster-logotypen (bokstaven "D" mot mork bakgrund med primary-fargen):
- `public/pwa-192x192.svg` -- 192x192
- `public/pwa-512x512.svg` -- 512x512
- `public/pwa-maskable-512x512.svg` -- 512x512 maskable (extra padding)
- `public/apple-touch-icon-180x180.svg` -- 180x180 for iOS

(SVG-ikoner fungerar i moderna browsrar och ar vektorbaserade sa de skalar perfekt)

### 3. HTML-metadata (`index.html`)

Lagg till foljande i `<head>`:

```text
- <link rel="manifest" href="/manifest.webmanifest">
- <meta name="theme-color" content="#7c5cfc">
- <meta name="apple-mobile-web-app-capable" content="yes">
- <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
- <meta name="apple-mobile-web-app-title" content="Dexster">
- <link rel="apple-touch-icon" href="/apple-touch-icon-180x180.svg">
- <meta name="msapplication-TileColor" content="#7c5cfc">
- <meta name="application-name" content="Dexster Chat">
```

### 4. SW-registrering och uppdateringsprompt (`src/main.tsx`)

- Importera `registerSW` fran `virtual:pwa-register`
- Registrera service workern med `onNeedRefresh`-callback
- Nar ny version finns: visa en toast (via sonner) med "Ny version tillganglig -- Uppdatera" knapp
- Nar anvandaren klickar: anropa `updateSW(true)` for att aktivera nya versionen

### 5. Offline-fallback-komponent (`src/components/OfflineIndicator.tsx`)

Ny komponent som:
- Lyssnar pa `navigator.onLine` och `online`/`offline`-events
- Visar en tydlig banner hogst upp i appen nar anslutningen tapps: "Du ar offline -- meddelanden synkas nar du ar online igen"
- Bannen forsvinner med fade-animation nar anslutningen aterupprattas

### 6. Integration i `App.tsx`

- Lagg till `<OfflineIndicator />` komponenten i app-layouten (ovanfor Routes)

### 7. TypeScript-typer (`src/vite-env.d.ts`)

- Lagg till `/// <reference types="vite-plugin-pwa/client" />` for att typa `virtual:pwa-register`

## Filer som andras/skapas

| Fil | Typ |
|-----|-----|
| `vite.config.ts` | Redigera -- lagg till VitePWA plugin |
| `package.json` | Redigera -- lagg till vite-plugin-pwa |
| `index.html` | Redigera -- PWA meta-taggar |
| `src/main.tsx` | Redigera -- SW-registrering + uppdateringsprompt |
| `src/vite-env.d.ts` | Redigera -- PWA-typer |
| `src/components/OfflineIndicator.tsx` | Ny -- offline-banner |
| `src/App.tsx` | Redigera -- lagg till OfflineIndicator |
| `public/pwa-192x192.svg` | Ny -- app-ikon |
| `public/pwa-512x512.svg` | Ny -- app-ikon |
| `public/pwa-maskable-512x512.svg` | Ny -- maskable ikon |
| `public/apple-touch-icon-180x180.svg` | Ny -- iOS-ikon |

## Vad detta ger anvandaren

- Appen kan installeras fran browsern till hemskarm (Android + iOS)
- Startar i standalone-lage utan adressfalt
- Fungerar offline med cachade resurser
- Visar tydlig offline-indikator
- Smidiga uppdateringar med prompt istallet for hard reload
- Korrekt tema-farg i adressfalt och splash screen
- Adaptiva ikoner pa Android (maskable)
- Apple-specifik hemskarmsikon och statusbar-styling

