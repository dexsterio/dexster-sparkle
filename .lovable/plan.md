

# Korrigerad Full Backend-Integration -- v3 (Alla 7 fel fixade)

## Korrigeringar fran v2

| # | Fel | Fix |
|---|-----|-----|
| 1 | `participantId` i DM-skapande | Andrat till `recipientId` (number) |
| 2 | Nastad `initialMessage`-objekt | Platt struktur: `{ recipientId, encryptedContent?, nonce?, senderKeyVersion?, signalMessageType? }` |
| 3 | `signalMessageType: "prekey" \| "message"` | Andrat till `number`: `2` (PreKeySignalMessage) eller `3` (SignalMessage) |
| 4 | Plaintext-endpoints anvands | Alla borttagna. BARA E2E-varianter: `POST /conversations/e2e` och `POST /conversations/:id/messages/e2e` |
| 5 | Key bundle saknar falt | Lagt till `registrationId` (required) och `kyberPreKey` (optional) |
| 6 | `clientMsgId` i conversation creation | Borttaget. `clientMsgId` finns bara i `sendE2EMessageSchema` |
| 7 | "src/Arkiv/ finns inte" | Korrigerat: filerna finns pa din server. Anvands som referens for Signal Protocol-implementation |

---

## Phase 1: API Client Foundation (OFORANDRAD)

### 1.1 `src/lib/api.ts`
- Base URL via `VITE_API_BASE_URL` (default: `https://dexster.io/api`)
- `credentials: 'include'` pa alla requests
- CSRF double-submit: laser CSRF-cookie, skickar som `X-CSRF-Token` header pa POST/PUT/PATCH/DELETE
- 401-hantering: forsoker `POST /api/auth/refresh` en gang, sedan redirect till `/login`
- Typed helpers: `api.get<T>()`, `api.post<T>()`, `api.put<T>()`, `api.delete<T>()`, `api.upload<T>()` (multipart)
- Cursor-pagination helper

### 1.2 `src/lib/csrf.ts`
- Lasa CSRF-cookie fran `document.cookie`

---

## Phase 2: Authentication (Solana SIWS) (OFORANDRAD)

### 2.1 `src/contexts/AuthContext.tsx`
- State: `currentUser`, `isAuthenticated`, `isLoading`, `wsToken`
- On mount: `GET /api/auth/session`
- `login()`: SIWS-flode (challenge -> sign -> verify)
- `logout()`: `POST /api/auth/logout`
- `refreshToken()`: `POST /api/auth/refresh`

### 2.2 `src/pages/Login.tsx` -- Wallet connect + SIWS
### 2.3 `src/pages/Onboarding.tsx` -- Profilsetup
### 2.4 `src/components/ProtectedRoute.tsx` -- Auth guard

### 2.5 Paket
- `@solana/wallet-adapter-react`, `@solana/wallet-adapter-react-ui`, `@solana/wallet-adapter-wallets`, `@solana/web3.js`, `bs58`

---

## Phase 3: WebSocket Manager (OFORANDRAD)

### 3.1 `src/lib/websocket.ts`
- Ansluter till `wss://dexster.io/ws`
- Auth: `{ "type": "auth", "token": "<wsToken>" }` (wsToken fran AuthContext, INTE cookie)
- Auto-reconnect med exponential backoff

### 3.2 `src/contexts/WebSocketContext.tsx`
- Alla WS-events: `chat:message`, `chat:typing`, `chat:read`, `chat:delivered`, `chat:reaction`, `chat:message_edited`, `chat:message_deleted`, `chat:message_expired`, `chat:message_updated`, `chat:message_pinned`, `chat:message_unpinned`, `chat:new_conversation`, `chat:timer_updated`, `chat:member_added/removed/left`, `chat:role_changed`, `chat:member_banned/unbanned`, `chat:settings_updated`, `presence:update`, `notification`

---

## Phase 4: Signal Protocol (KORRIGERAD -- fel 3, 5, 7)

### 4.1 `src/lib/signal/signalManager.ts`

**Key bundle upload** (`POST /api/messages/keys/bundle`) -- KORRIGERAT SCHEMA:
```text
{
  identityPublicKey: string (base64, REQUIRED),
  registrationId: number (REQUIRED -- NYTT),
  signedPreKey: {
    id: number,
    publicKey: string (base64),
    signature: string (base64)
  },
  preKeys: [{ id: number, publicKey: string (base64) }] (max 100),
  kyberPreKey?: {           // NYTT -- optional post-quantum
    id: number,
    publicKey: string (base64),
    signature: string (base64)
  }
}
```

**Encrypt output** -- KORRIGERAD TYP:
```text
{
  encryptedContent: string (base64 ciphertext),
  nonce: string,
  senderKeyVersion: number,
  signalMessageType: 2 | 3  // NUMBER, INTE STRING
  // 2 = PreKeySignalMessage (forsta meddelandet, ny session)
  // 3 = SignalMessage (efterfoljande meddelanden)
}
```

- `fetchKeyBundle(userId)`: `GET /api/messages/keys/bundle/:userId`
- `uploadKeyBundle()`: `POST /api/messages/keys/bundle` (med registrationId + optional kyberPreKey)
- `replenishPreKeys()`: `PUT /api/messages/keys/replenish`
- `rotateSignedPreKey()`: `PUT /api/messages/keys/signed`
- `getKeyCount()`: `GET /api/messages/keys/count`
- `uploadKyberPreKey()`: `PUT /api/messages/keys/kyber`
- `getKeyStatus()`: `GET /api/messages/keys/status`

### 4.2 `src/lib/signal/signalStore.ts`
- IndexedDB (via `idb`) for Signal-sessioner, identitetsnycklar, prekeys

### 4.3 Referens: src/Arkiv/
- Filerna pa din server (`/var/www/dexsternew/app/src/Arkiv/`) innehaller fungerande Signal Protocol-kod
- `chatApi.ts`: Alla API-funktioner med korrekt E2E-hantering
- `useE2EConversations.ts`: React-hook med key management
- `chat.ts`: TypeScript-typer
- Dessa anvands som referens vid implementation -- inte kopieras rakt av, men logiken foljs

---

## Phase 5: Meddelanden (KORRIGERAD -- fel 3, 4, 6)

### 5.1 Skicka meddelande -- `POST /conversations/:id/messages/e2e` (ENDA ENDPOINT)

**EXAKT SCHEMA (sendE2EMessageSchema):**
```text
{
  encryptedContent: string (base64, REQUIRED),
  nonce: string (default ''),
  senderKeyVersion: number (default 1),
  signalMessageType: 2 | 3 (number, OPTIONAL),
  replyToId: number (OPTIONAL),
  isForwarded: boolean (default false),
  scheduledAt: string ISO 8601 (OPTIONAL),
  clientMsgId: string UUID max 36 chars (OPTIONAL),
  imageUrl: string -- DEPRECATED, IGNORERAS av servern.
           Media-URLs ska inkluderas INUTI encryptedContent.
}
```

**AVAKTIVERADE ENDPOINTS (returnerar HTTP 410 Gone):**
- ~~POST /api/messages/conversations/:id/messages~~ -- ANVAND INTE
- ~~POST /api/messages/conversations~~ -- ANVAND INTE
- Felmeddelande: "Plaintext messages/conversations are no longer supported. Use E2E endpoint."

### 5.2 Meddelandeformat fran server (dekrypteras av klienten)
```text
{
  id, conversationId, senderId,
  encryptedContent: string (base64 ciphertext),
  nonce: string,
  senderKeyVersion: number,
  signalMessageType: 2 | 3 (NUMBER),
  seqId: number (for ordning),
  clientMsgId: string (idempotency),
  entities: [{ type, offset, length, userId?, url? }],
  imageUrl?, sharedPostId?, replyToId?, isForwarded,
  isDeleted, isSystem,
  expiresAt?, scheduledAt?,
  isPinned, pinnedAt?, pinnedBy?,
  viewCount? (channels),
  editedAt?, createdAt
}
```

### 5.3 `src/hooks/useMessages.ts`
- Hamta: `GET /api/messages/conversations/:id/messages?limit=50&cursor={date}`
- Sedan: `GET .../messages/since` och `GET .../messages/around`
- Dekryptera varje meddelande med Signal Protocol
- Cursor-pagination
- Optimistisk uppdatering vid skicka (visa som "sending", uppdatera med server-id + seqId)

### 5.4 Ta emot via WebSocket
- `chat:message` -> dekryptera -> infoga sorterat pa seqId
- `chat:message_edited` -> uppdatera
- `chat:message_deleted` -> ta bort
- `chat:message_expired` -> ta bort (disappearing)
- `chat:message_updated` -> uppdatera media-URL (transcode klar)

### 5.5 Meddelandeaktioner
- Redigera: `PUT /api/messages/:messageId`
- Ta bort alla: `DELETE /api/messages/:messageId`
- Ta bort for mig: `DELETE /api/messages/:messageId/for-me`
- Fasta: `PUT /api/messages/:messageId/pin`
- Avfasta: `DELETE /api/messages/:messageId/pin`
- Lista fasta: `GET /api/messages/conversations/:id/pinned`
- Schemalagda: `GET /api/messages/conversations/:id/messages/scheduled`
- Ta bort schemalagt: `DELETE /api/messages/:id/scheduled`
- Vidarebefordra: `POST /api/messages/bulk-forward`
- Massradera: `POST /api/messages/bulk-delete-for-me`
- Registrera visning: `POST /api/messages/conversations/:id/messages/:msgId/view`
- Markera levererade: `POST /api/messages/conversations/:id/messages/delivered`

### 5.6 Reaktioner
- Lagg till: `POST /api/messages/:messageId/reactions`
- Ta bort: `DELETE /api/messages/:messageId/reactions/:emoji`

### 5.7 Typing + Laskvitton
- Typing skicka: `POST /api/messages/conversations/:id/typing`
- Typing ta emot: WS `chat:typing`
- Lasa: `POST /api/messages/conversations/:id/read`
- Lasa ta emot: WS `chat:read`

---

## Phase 6: Konversationer (KORRIGERAD -- fel 1, 2, 4, 6)

### 6.1 `src/hooks/useConversations.ts`
- `GET /api/messages/conversations` -> mappar till `Chat[]`
- React Query-cachning
- WS: `chat:new_conversation`, `chat:settings_updated`

### 6.2 Skapa DM -- `POST /api/messages/conversations/e2e` (ENDA ENDPOINT)

**EXAKT SCHEMA (createE2EConversationSchema) -- KORRIGERAT:**
```text
{
  recipientId: number (REQUIRED)     // INTE participantId
  encryptedContent?: string (base64) // OPTIONAL -- kan skapa DM utan meddelande
  nonce?: string (default '')
  senderKeyVersion?: number (default 1)
  signalMessageType?: 2 | 3 (number) // INTE string
  // clientMsgId finns INTE har
}
```

**Flode for att skapa DM:**
1. Sok anvandare via `GET /api/social/users/search`
2. Hamta mottagarens key bundle: `GET /api/messages/keys/bundle/:userId`
3. Etablera Signal-session
4. (Valfritt) Kryptera initial message
5. `POST /api/messages/conversations/e2e` med `{ recipientId: userId, encryptedContent?, nonce?, senderKeyVersion?, signalMessageType? }`

**AVAKTIVERAD ENDPOINT (HTTP 410):**
- ~~POST /api/messages/conversations~~ -- returnerar "Plaintext conversations are no longer supported"

### 6.3 Skapa grupp
- `POST /api/messages/conversations/group` med `{ name, description, memberIds }`

### 6.4 Skapa kanal
- `POST /api/messages/conversations/channel` med `{ name, description, isPublic }`

### 6.5 Konversationsatgarder

| Atgard | Endpoint |
|--------|----------|
| Pin | `PUT /api/messages/conversations/:id/pin` |
| Unpin | `DELETE /api/messages/conversations/:id/pin` |
| Mute | `PUT /api/messages/conversations/:id/mute` med `{ muteUntil }` |
| Archive | `PUT /api/messages/conversations/:id/archive` |
| Unarchive | `PUT /api/messages/conversations/:id/unarchive` |
| Leave | `POST /api/messages/conversations/:id/leave` |
| Delete | `DELETE /api/messages/conversations/:id` |
| Mark read | `POST /api/messages/conversations/:id/read` |
| Accept | `POST /api/messages/conversations/:id/accept` |
| Reject | `POST /api/messages/conversations/:id/reject` |
| Disappearing timer | `PUT /api/messages/conversations/:id/disappearing-timer` |
| Settings | `PUT /api/messages/conversations/:id/settings` |
| Group avatar | `POST /api/messages/conversations/:id/settings/avatar` (multipart) |
| Discussion group | `PUT /api/messages/conversations/:id/discussion-group` |
| Unread count | `GET /api/messages/unread-count` |

---

## Phase 7: Medlemmar, Roller, Inbjudningar (OFORANDRAD)

- Lista/sok/lagg till/ta bort medlemmar
- Andra roll (owner/admin/member)
- Banna/avbanna
- Generera/hamta invite-link, ga med via kod
- WS-events for realtid

---

## Phase 8: Block, Report, Moderation (OFORANDRAD)

- Chatt-block: `/api/messages/block/:userId`
- Social moderation: `/api/moderation/report`, `/block`, `/mute`

---

## Phase 9: Anvandarsok och Profiler (OFORANDRAD)

- Sok: `GET /api/social/users/search`
- Profil: `GET /api/profile/user/:walletAddress` eller `/username/:username`
- Follow: `POST/DELETE /api/profile/follow/:userId`
- Presence: `GET /api/messages/presence/:userId` + WS `presence:update`
- Delad media: `GET /api/messages/conversations/:id/shared-media`

---

## Phase 10: Chat Folders (OFORANDRAD)
- CRUD via `/api/messages/folders`

## Phase 11: Message Search (OFORANDRAD)
- `GET /api/messages/search?q={query}`

## Phase 12: Notifications (OFORANDRAD)
- CRUD + WS `notification` events

## Phase 13: Media Upload (OFORANDRAD)
- Image, video (async BullMQ), file, encrypted media
- Signed URLs via `GET /api/messages/media/signed-url`
- Video: WS `chat:message_updated` nar transcode klar
- VIKTIGT: Media-URLs i E2E-meddelanden ska vara INUTI `encryptedContent`, INTE i `imageUrl`-faltet (deprecated)

## Phase 14: Translation
- Endpoint FINNS INTE pa servern
- Frontend visar translate-knapp men toast "Translation not available yet"
- Tydlig TODO-kommentar i koden for framtida endpoint

## Phase 15: Bookmarks (KORRIGERAT)
- `/api/bookmarks/*` = social feed posts, INTE chattmeddelanden
- "Saved Messages" = lokal funktion (localStorage/IndexedDB)

---

## Phase 16: Cleanup

### 16.1 Ta bort `src/data/mockData.ts`
- Flytta `EMOJI_DATA` till `src/data/emojiData.ts`

### 16.2 Uppdatera komponenter
- `currentUser` fran AuthContext
- `'me'` -> `currentUser.id`
- `'You'` -> `currentUser.displayName`

### 16.3 Utoka `src/types/chat.ts`
- `Message`-typ: lagg till `encryptedContent`, `nonce`, `senderKeyVersion`, `signalMessageType` (number), `seqId`, `clientMsgId`, `entities`, `expiresAt`, `scheduledAt`, `isPinned`, `pinnedAt`, `pinnedBy`, `viewCount`, `editedAt`, `isForwarded`, `isSystem`, `isDeleted`
- `Chat`-typ: matcha server-response

---

## Filer att skapa

| Fil | Syfte |
|-----|-------|
| `src/lib/api.ts` | API-klient med CSRF, auth refresh |
| `src/lib/csrf.ts` | CSRF-cookie-lasare |
| `src/lib/websocket.ts` | WebSocket-manager |
| `src/lib/signal/signalManager.ts` | Signal Protocol (refererar Arkiv-koden) |
| `src/lib/signal/signalStore.ts` | IndexedDB for Signal-sessioner |
| `src/contexts/AuthContext.tsx` | Auth (SIWS wallet) |
| `src/contexts/WebSocketContext.tsx` | WS-anslutning + events |
| `src/pages/Login.tsx` | Wallet connect |
| `src/pages/Onboarding.tsx` | Profilsetup |
| `src/components/ProtectedRoute.tsx` | Auth guard |
| `src/hooks/useConversations.ts` | Konversationer fran API |
| `src/hooks/useMessages.ts` | Meddelanden med E2E |
| `src/hooks/useMembers.ts` | Medlemshantering |
| `src/hooks/useInviteLinks.ts` | Inbjudningslankar |
| `src/hooks/useUserSearch.ts` | Anvandarsok |
| `src/hooks/useUserProfile.ts` | Profil-fetch |
| `src/hooks/useFolders.ts` | Chat folders |
| `src/hooks/useMessageSearch.ts` | Meddelandesokning |
| `src/hooks/useNotifications.ts` | Notifikationer |
| `src/hooks/useMediaUpload.ts` | Mediauppladdning |
| `src/hooks/useUnreadCount.ts` | Olasta-rakning |
| `src/data/emojiData.ts` | Emoji-data (UI-only) |

## Filer att modifiera

| Fil | Andringar |
|-----|-----------|
| `src/App.tsx` | AuthProvider, WalletProvider, WebSocketProvider, routes |
| `src/types/chat.ts` | Utoka Message/Chat-typer for server-format |
| `src/components/chat/DexsterChat.tsx` | Ersatt mock med API-hooks |
| `src/components/chat/Sidebar.tsx` | Sok via API, folders fran API |
| `src/components/chat/ChatArea.tsx` | currentUser fran context, typing |
| `src/components/chat/InfoPanel.tsx` | Riktig profildata, presence, media |
| `src/components/chat/Modals.tsx` | API for sok/admin/invite |
| `src/components/chat/MessageBubble.tsx` | currentUser.id, dekrypterat innehall |

## Filer att ta bort

| Fil | Anledning |
|-----|-----------|
| `src/data/mockData.ts` | All data fran API |

## Beroenden att installera
- `@solana/wallet-adapter-react`
- `@solana/wallet-adapter-react-ui`
- `@solana/wallet-adapter-wallets`
- `@solana/web3.js`
- `bs58`
- `idb` (IndexedDB wrapper for Signal sessions)

## Miljovariabel
- `VITE_API_BASE_URL` -- default `https://dexster.io/api`

