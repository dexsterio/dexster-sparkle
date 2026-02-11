

# Systematisk Audit: Alla Ofullstandiga Funktioner i Dexster Chat

Jag har granskat varje fil i projektet och identifierat **76 funktioner** som saknar end-to-end-implementation. Nedan foljer den fullstandiga listan, grupperad i 6 kategorier, med exakt beskrivning av vad som saknas och vad som behover goras.

---

## Kategori 1: Stub-handlers (bara toast, ingen logik) — 18 st

Dessa funktioner i `DexsterChat.tsx` visar bara ett meddelande utan att gora nagot:

| # | Funktion | Rad | Vad som saknas |
|---|----------|-----|----------------|
| 1 | `blockUser` | 367-373 | Saknar API-anrop `POST /messages/conversations/:id/block` |
| 2 | `unblockUser` | 375-377 | Saknar API-anrop `DELETE /messages/conversations/:id/block` |
| 3 | `bookmarkMessage` | 385-388 | Saknar localStorage/IndexedDB-lagring och laddning |
| 4 | `translateMessage` | 391-394 | Stub — markerad som "not available" |
| 5 | `moveToFolder` | 537-540 | Saknar API-anrop for att flytta chatt till mapp |
| 6 | `clearHistory` | 543-548 | Rensar bara lokal cache, saknar `DELETE /messages/conversations/:id/history` |
| 7 | `updateChannelSettings` | 551-554 | Saknar `PUT /messages/conversations/:id/settings` |
| 8 | `updateGroupSettings` | 556-559 | Saknar `PUT /messages/conversations/:id/settings` |
| 9 | `createInviteLink` | 562-564 | Saknar koppling till `useInviteLinks` hook |
| 10 | `revokeInviteLink` | 566-568 | Saknar koppling till `useInviteLinks` hook |
| 11 | `promoteAdmin` | 571-573 | Saknar koppling till `useMembers.changeRole` |
| 12 | `demoteAdmin` | 575-577 | Saknar koppling till `useMembers.changeRole` |
| 13 | `setAutoDelete` | 580-583 | Saknar `PUT /messages/conversations/:id/auto-delete` |
| 14 | `handleReport` | 592-595 | Saknar `POST /messages/report` |
| 15 | `sendGif` | 231-246 | Bara optimistisk — saknar API-anrop via `apiSendMessage` |
| 16 | `scheduleMessage` | 462-472 | Bara optimistisk — saknar `POST /messages/e2e/schedule` |
| 17 | `rollDice` | 433-442 | Bara optimistisk — saknar API-anrop |
| 18 | `createPoll` | 397-410 | Bara optimistisk — saknar API-anrop |

## Kategori 2: Okopplade hooks — 4 st

Dessa hooks finns och ar redo men ar inte integrerade i UI:t:

| # | Hook | Vad som saknas |
|---|------|----------------|
| 19 | `useMediaUpload` | Inte kopplad till attach-menyn i ChatArea |
| 20 | `useInviteLinks` | Inte kopplad till InviteLinksModal |
| 21 | `useMembers` | Inte kopplad till InfoPanel eller AdminManagementModal |
| 22 | `useNotifications` | Inte kopplad till nagon UI-komponent |

## Kategori 3: Tomma mobilflikar — 3 st

| # | Flik | Vad som saknas |
|---|------|----------------|
| 23 | Contacts-flik | Placeholder — behover kontaktlista med sok, online-status |
| 24 | Saved Messages-flik | Placeholder — behover visa bokmarkta meddelanden fran localStorage |
| 25 | Settings-flik | Placeholder — behover profil, tema, notifikationer, integritet |

## Kategori 4: Ofullstandig UI-logik — 28 st

| # | Funktion | Plats | Vad som saknas |
|---|----------|-------|----------------|
| 26 | Attach-meny (bilder) | ChatArea.tsx | Visar meny men `onImageSelect` saknas — filval + upload-logik |
| 27 | Attach-meny (video) | ChatArea.tsx | Saknar video-val och upload |
| 28 | Attach-meny (dokument) | ChatArea.tsx | Saknar dokument-val och upload |
| 29 | Typing-indikator sanding | ChatArea.tsx | `sendTyping` anropas aldrig fran textarea `onChange` |
| 30 | Forward till API | DexsterChat.tsx | Forward ar bara optimistisk — saknar `POST /messages/forward` |
| 31 | Slow mode timer | ChatArea.tsx | `slowModeRemaining` passas men timer-logik saknas |
| 32 | Shared Media i InfoPanel | InfoPanel.tsx | Visar placeholder-ikoner, inte riktiga media fran API |
| 33 | Groups in Common | InfoPanel.tsx | Hardkodad till "DevOps Hub" — behover API-data |
| 34 | Members i InfoPanel | InfoPanel.tsx | Visar `chat.members` fran mock — behover `useMembers` |
| 35 | Auto-delete countdown | Alla | `autoDeleteAt` pa meddelanden hanteras aldrig |
| 36 | Message effects (confetti etc) | ChatArea/DexsterChat | Effect-picker finns men effekterna renderas aldrig |
| 37 | Silent send indikator | MessageBubble | `silentSend` flagga visas aldrig i UI |
| 38 | Scheduled message visning | MessageBubble | `scheduled`/`scheduledTime` visas aldrig |
| 39 | Translated text visning | MessageBubble | `translated` falt visas aldrig |
| 40 | Bookmark-ikon pa meddelanden | MessageBubble | `bookmarked` flagga visas aldrig |
| 41 | Read receipts (dubbel-bock) | MessageBubble | `read`-status visas troligen men saknar dubbelcheck-logik |
| 42 | Unread divider | ChatArea.tsx | `firstUnreadId` beraknas men "New messages"-divider renderas aldrig |
| 43 | Copy link funktion | DexsterChat.tsx | Kopierar hardkodad `t.me/dexster/...` — bor vara dynamisk |
| 44 | Mark unread via API | DexsterChat.tsx | Bara optimistisk — inget API-anrop |
| 45 | Mute until visning | Sidebar.tsx | `muteUntil` sparas men visas aldrig i UI |
| 46 | Pull-to-refresh | Sidebar.tsx | Anropar `invalidateQueries` men ger ingen visuell feedback efter |
| 47 | Context menu "Move to folder" | Sidebar.tsx | onClick ar `() => {}` — gor ingenting |
| 48 | Swipe-to-reply | MessageBubble.tsx | Bor finnas enligt memory men maste verifiera implementation |
| 49 | Avatar upload (profil) | Saknas helt | Ingen profilredigering — varken avatar eller header |
| 50 | Avatar upload (grupp/kanal) | Modals.tsx | Visar kamera-ikon men ingen upload-logik |
| 51 | Comments panel API | CommentsPanel | Kommentarer ar helt lokala (state) — ingen API-koppling |
| 52 | Channel subscriber count update | InfoPanel | Hardkodat fran mock |
| 53 | Group member count update | InfoPanel | Hardkodat fran mock |

## Kategori 5: Saknade funktioner (finns i typsystemet men inte implementerade) — 13 st

| # | Funktion | Beskrivning |
|---|----------|-------------|
| 54 | Voice messages | Mic-knapp finns i UI men gor ingenting |
| 55 | Image/video preview i chatt | Inga media renderas i MessageBubble |
| 56 | File attachment visning | Filer visas aldrig i MessageBubble |
| 57 | Message search (global) | Sidebar-sok soker bara pa chattnamn, inte meddelanden |
| 58 | User profile view | Klick pa anvandare oppnar aldrig en profilvy |
| 59 | Edit profile | Ingen redigeringssida for egen profil |
| 60 | Theme switcher | Ingen temavaljare (dark/light) |
| 61 | Notification settings | Ingen UI for notifikationspreferenser |
| 62 | Privacy settings | Ingen UI for integritetsinstallningar |
| 63 | Language settings | Ingen UI for sprakval |
| 64 | Message pagination | Bara 100 meddelanden laddas — ingen infinite scroll |
| 65 | Online presence updates | Presence hanteraas av WS men UI uppdateras inte i realtid |
| 66 | Read receipt sending | `markRead` anropas vid chatval men inte vid scroll |

## Kategori 6: Saknade E2E-floden — 10 st

| # | Funktion | Beskrivning |
|---|----------|-------------|
| 67 | Signal Protocol integration | signalManager importeras aldrig — alla meddelanden skickas i klartext |
| 68 | Key exchange | Ingen nyckelutbytes-logik vid ny konversation |
| 69 | Message decryption | Encrypted content visas ratt — ingen dekryptering sker |
| 70 | Media encryption | `uploadEncryptedMedia` anropas aldrig |
| 71 | Session management | SIWS (Sign In With Solana) flode saknas — mock user hardkodad |
| 72 | Wallet connect | Wallet adapter importeras men anvands aldrig |
| 73 | Login/logout flow | `AuthContext` ar mock — inget riktigt login-flode |
| 74 | CSRF token refresh | `getCsrfToken()` finns men token hamtas aldrig initialt |
| 75 | WebSocket authentication | WS-anslutning anvander `mock-token` |
| 76 | Conversation settings sync | Installningar fran EditChannel/EditGroup sparas aldrig till API |

---

## Implementeringsplan

Jag foreslaar att vi implementerar detta i **5 faser**, fran mest kritiskt till minst:

### Fas 1: Stub-handlers till riktiga API-anrop (Kategori 1)
Koppla alla 18 stub-funktioner till API:et. Detta ar snabbast att fixa och gor storst skillnad for anvandaren.

**Filer som andras:** `DexsterChat.tsx`, `useConversations.ts`

### Fas 2: Koppla befintliga hooks till UI (Kategori 2 + 4)
Integrera `useMediaUpload`, `useInviteLinks`, `useMembers`, `useNotifications` i sina respektive UI-komponenter. Fixa attach-menyn, InfoPanel-medlemmar, invite links-modalen etc.

**Filer som andras:** `ChatArea.tsx`, `InfoPanel.tsx`, `Modals.tsx`, `DexsterChat.tsx`

### Fas 3: Saknad UI-logik (resten av Kategori 4)
Implementera typing-indikator-sanding, slow mode timer, message effects, read receipts, unread divider, bookmark-lagring, shared media etc.

**Filer som andras:** `ChatArea.tsx`, `MessageBubble.tsx`, `InfoPanel.tsx`, `Sidebar.tsx`

### Fas 4: Mobilflikar (Kategori 3)
Bygg ut Contacts med kontaktlista + sok, Saved Messages med bokmärken, Settings med profil/tema/notifikationer.

**Filer som andras:** `Sidebar.tsx` (eller nya komponenter)

### Fas 5: Saknade funktioner och E2E (Kategori 5 + 6)
Voice messages, media rendering, Signal Protocol, wallet auth, profil-redigering etc. Dessa kräver mest arbete och har externt beroende.

**Filer som andras:** Manga filer + nya komponenter

---

## Rekommendation

Jag rekommenderar att vi borjar med **Fas 1** (18 stubs till API-anrop) da det ar den snabbaste vagen att gora appen funktionell. Sedan gar vi vidare fas for fas. Varje fas kan implementeras i ett eller tva meddelanden.

