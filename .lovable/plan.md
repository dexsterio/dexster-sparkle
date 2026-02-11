

# Remove All Mock Data & Prepare for Production Backend Integration

## Overview
Systematically remove all mock/hardcoded data from every file, replace with proper empty states, loading states, and clear placeholder comments guiding your backend developer on exactly where and how to integrate real data.

## Files to Modify

### 1. src/data/mockData.ts -- DELETE ENTIRE FILE
This file contains all fake users, conversations, messages, and folders. It will be completely removed.

### 2. src/contexts/AuthContext.tsx -- Real Auth Flow Placeholder
Current: Imports `MOCK_USER` and sets it as default state, uses `'mock-token'` for WebSocket.

Changes:
- Remove `MOCK_USER` import
- Default `currentUser` to `null` (unauthenticated)
- Default `isLoading` to `true` (app starts in loading state)
- Add `wsToken` state (default `null`)
- Add detailed placeholder comments in `refreshSession` showing the backend dev exactly what to call:
  - `GET /api/auth/me` to fetch current user session
  - Set `wsToken` from response
- Add placeholder in `logout`:
  - `POST /api/auth/logout`
  - Clear state
- Add an `useEffect` skeleton that calls `refreshSession()` on mount (auto-login from existing session cookie)
- Add a `login` function placeholder for Solana wallet SIWS flow:
  - `POST /api/auth/challenge` to get nonce
  - Sign with wallet
  - `POST /api/auth/verify` with signature
  - Set user + wsToken from response

### 3. src/hooks/useConversations.ts -- Remove Mock Fallback
Current: Falls back to `MOCK_CHATS` on API error, defaults to `MOCK_CHATS`.

Changes:
- Remove `MOCK_CHATS` import
- On API error: return empty array `[]` instead of mock data
- Default `conversations` to `query.data ?? []`
- Add comment: `// BACKEND: GET /messages/conversations returns ApiConversation[]`

### 4. src/hooks/useMessages.ts -- Remove Mock Fallback
Current: Falls back to `MOCK_MESSAGES[conversationId]` on error, defaults to mock.

Changes:
- Remove `MOCK_MESSAGES` import
- On API error: return `[]`
- Default `messages` to `query.data ?? []`
- Add comment: `// BACKEND: GET /messages/conversations/:id/messages?limit=100 returns ApiMessage[]`

### 5. src/hooks/useFolders.ts -- Remove Mock Fallback
Current: Falls back to `MOCK_FOLDERS` on error, defaults to mock.

Changes:
- Remove `MOCK_FOLDERS` import
- On API error: return `[]`
- Default `folders` to `query.data ?? []`
- Add comment: `// BACKEND: GET /messages/folders returns ApiFolder[]`

### 6. src/components/chat/MyProfilePanel.tsx -- Remove Mock Balance
Current: Has `const mockBalance = '12.847 SOL'` hardcoded.

Changes:
- Remove `mockBalance` constant
- Replace with a comment and placeholder:
  - `// BACKEND: Fetch wallet balance from Solana RPC or backend endpoint`
  - `// e.g. GET /api/wallet/balance => { balance: string }`
  - Display `'--'` or a loading spinner until balance is fetched
- Add `handleSave` placeholder to call `PUT /api/profile/me` with updated displayName, bio, avatar

### 7. src/components/chat/DexsterChat.tsx -- Remove Local Mock Fallbacks
Current: Lines 673-688 and 705-720 create mock group/channel objects locally when API fails.

Changes:
- Remove the catch-block mock fallback for `createGroup` -- instead show error toast: `'Failed to create group'`
- Remove the catch-block mock fallback for `createChannel` -- instead show error toast: `'Failed to create channel'`
- Add comments explaining which endpoints are called:
  - `// BACKEND: POST /messages/conversations { type: 'group', ... }`
  - `// BACKEND: POST /messages/conversations { type: 'channel', ... }`

### 8. src/components/chat/Sidebar.tsx -- Add Empty State
When `conversations` is empty (no mock data), the sidebar will be blank. Add a proper empty state:
- "No conversations yet" message with a button to start a new chat
- This ensures the UI isn't broken when there's no data

### 9. src/components/chat/ChatArea.tsx -- Add Empty State
When no chat is selected or messages array is empty:
- Show "Select a conversation to start chatting" placeholder
- When messages is empty: show "No messages yet. Say hello!" centered text

## Summary of Mock Data References to Remove

| File | Mock Reference | Replace With |
|------|---------------|-------------|
| `mockData.ts` | Entire file | Delete |
| `AuthContext.tsx` | `MOCK_USER`, `'mock-token'` | `null`, real auth flow |
| `useConversations.ts` | `MOCK_CHATS` (import + 2 usages) | `[]` |
| `useMessages.ts` | `MOCK_MESSAGES` (import + 2 usages) | `[]` |
| `useFolders.ts` | `MOCK_FOLDERS` (import + 2 usages) | `[]` |
| `MyProfilePanel.tsx` | `mockBalance` | Backend placeholder |
| `DexsterChat.tsx` | Mock group/channel creation fallback | Error toast |

## Backend Integration Comments Pattern
Every placeholder will follow this pattern for consistency:

```text
// ══════════════════════════════════════════════════════════════
// BACKEND TODO: [Description of what needs to be implemented]
// Endpoint: [METHOD /path]
// Request: { field: type, ... }
// Response: { field: type, ... }
// Notes: [Any additional context]
// ══════════════════════════════════════════════════════════════
```

## What Stays Unchanged
- `src/lib/api.ts` -- Already production-ready (real API client with CSRF, refresh, etc.)
- `src/lib/websocket.ts` -- Already production-ready
- `src/lib/csrf.ts` -- Already production-ready
- `src/lib/signal/` -- Already has proper TODO comments
- `src/hooks/useMembers.ts` -- No mock data (already pure API)
- `src/hooks/useNotifications.ts` -- No mock data
- `src/hooks/useUnreadCount.ts` -- No mock data
- `src/hooks/useMessageSearch.ts` -- No mock data
- `src/hooks/useUserSearch.ts` -- No mock data
- `src/hooks/useInviteLinks.ts` -- No mock data
- `src/hooks/useMediaUpload.ts` -- No mock data
- `src/hooks/useUserProfile.ts` -- No mock data
- `src/contexts/WebSocketContext.tsx` -- Already production-ready (uses real wsToken from AuthContext)

## Result
After these changes:
- App starts in a loading/unauthenticated state (no fake data visible)
- All hooks return empty arrays when API is unreachable
- Every integration point has clear comments for the backend developer
- The UI handles empty states gracefully
- The backend developer has a clear roadmap of every endpoint needed

