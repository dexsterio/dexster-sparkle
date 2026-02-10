
# Full Frontend Backend Logic for Dexster Chat

## Overview
Make every feature in Dexster Chat fully functional with real client-side logic. Currently many buttons are placeholders (archive, block, attach menu, emoji picker, select mode, in-chat search, etc.). This plan implements complete working logic for every feature that doesn't require a real server.

---

## What "Full Backend" Means Here
All state management, data persistence (in React state), business logic, validation, computed values, and UI interactions will be fully functional. The only thing NOT implemented is real-time network communication between users — everything else works as a complete local simulation.

---

## Changes by File

### 1. `src/types/chat.ts` — Expanded Data Model

Add these fields/types to support all features:

- **Message**: `type: 'message' | 'service' | 'poll' | 'dice'`, `pollData`, `scheduled`, `scheduledTime`, `silentSend`, `effect` (confetti/fireworks/hearts), `translated`, `autoDeleteAt`, `bookmarked`, `selected`
- **PollData**: `{ question, options: {text, voters: string[]}[], multiChoice, quizMode, correctOption?, explanation? }`
- **Chat**: `archived`, `blocked`, `autoDeleteTimer`, `folderId`, `markedUnread`, `draft`
- **CustomFolder**: `{ id, name, includedChatIds, filters }`
- **ScheduledMessage**: extends Message with scheduling metadata
- **ContactInfo**: for contact sharing messages
- **DiceResult**: `{ emoji: string, value: number }`

### 2. `src/data/mockData.ts` — Rich Mock Data

- Add "Saved Messages" chat (id: 'saved', type: 'personal', special handling)
- Add poll messages, dice messages, forwarded-without-name messages
- Add archived chats (at least 2)
- Add more varied messages: blockquotes, hashtags, mentions, URLs, underline formatting, code blocks
- Add messages with effects
- Add scheduled messages collection
- Expand comments data

### 3. `src/components/chat/DexsterChat.tsx` — Central State Engine

New state variables and fully working handlers:

**State additions:**
- `selectMode` / `selectedMessages: Set<string>` — multi-select with real bulk operations
- `archivedChats` — derived from chat.archived flag
- `customFolders: CustomFolder[]` — user-created folders with real filtering
- `scheduledMessages: Record<string, Message[]>` — per-chat scheduled messages with timer-based auto-send
- `blockedUsers: Set<string>` — functional blocking (hides chat, prevents interaction)
- `chatDrafts: Record<string, string>` — save draft text when switching chats
- `autoDeleteTimers: Record<string, number>` — functional auto-delete with real setTimeout
- `chatSearchQuery / chatSearchResults` — in-chat search state
- `showEmojiPicker / showAttachMenu` — picker states
- `pinnedIndex: Record<string, number>` — per-chat pin navigation index
- `comments: Record<string, Comment[]>` — functional comment system
- `showCommentsFor: string | null` — which post's comments are open

**New fully working handlers:**
- `archiveChat(id)` — moves to archived, removes from main list
- `unarchiveChat(id)` — restores from archive
- `blockUser(id)` — marks as blocked, filters from view
- `unblockUser(id)` — restores
- `markUnread(id)` — sets markedUnread flag (shows unread badge = 1)
- `saveDraft(chatId, text)` — auto-saves on chat switch
- `restoreDraft(chatId)` — restores input text on chat select
- `setAutoDelete(chatId, timer)` — sets auto-delete, starts timers for existing messages
- `scheduleMessage(text, time)` — adds to scheduled list, setTimeout to auto-send at time
- `cancelScheduled(msgId)` — removes from scheduled
- `sendSilent(text)` — sends message marked as silent (no notification indicator)
- `sendWithEffect(text, effect)` — sends with confetti/fireworks/hearts
- `translateMessage(msgId)` — mock translation (reverses/shuffles words as demo)
- `bookmarkMessage(msg)` — forwards to Saved Messages
- `createPoll(question, options, multiChoice, quizMode)` — creates interactive poll message
- `votePoll(msgId, optionIndex)` — toggles vote on poll
- `rollDice(emoji)` — sends dice message with random result
- `addComment(postId, text)` — adds comment to channel post
- `bulkDelete(msgIds)` — deletes all selected messages
- `bulkForward(msgIds, toChatId)` — forwards all selected
- `createGroup(name, members, description)` — creates new group chat
- `createCustomFolder(name, filters)` — creates folder with real filtering logic
- `moveToFolder(chatId, folderId)` — assigns chat to folder
- `searchInChat(query)` — filters messages, returns indices for navigation
- `navigateSearch(direction)` — moves to next/prev search result
- `cyclePinnedMessage(chatId)` — advances pinnedIndex for multi-pin navigation
- `copyMessageLink(msg)` — generates mock link, copies to clipboard
- `reportMessage(msg)` — shows confirmation toast
- `leaveChat(chatId)` — removes from chats list with service message

### 4. `src/components/chat/Sidebar.tsx` — Full Sidebar Logic

- **Archived section**: Collapsible "Archived Chats (N)" row at top, expands to show archived chats, click to open, context menu to unarchive
- **Mark as unread**: Context menu option that sets badge to 1 and marks chat
- **Move to folder submenu**: Nested context menu showing all folders + "New Folder"
- **Mute submenu**: Expandable options (1h, 8h, 2 days, forever) with real timers that auto-unmute
- **Block user**: Functional in context menu
- **Custom folder creation**: "+" tab that opens inline folder editor
- **Folder filtering**: Custom folders actually filter by assigned chatIds
- **Draft indicator**: Show "[Draft] text..." in chat preview when draft exists
- **Saved Messages**: Special chat item with bookmark icon
- **New Group**: Opens CreateGroupModal when clicked

### 5. `src/components/chat/ChatArea.tsx` — Complete Chat Logic

- **In-chat search**: Click magnifying glass opens search bar under header, real-time message filtering with yellow highlight, up/down navigation between matches, "X of Y" counter, media type filter tabs
- **Select mode**: Toggle via context menu, checkboxes on all messages, bottom toolbar with count + Delete/Forward/Copy buttons, all functional
- **Emoji picker panel**: Full emoji grid with 8 categories (Smileys, People, Animals, Food, Activities, Travel, Objects, Symbols), search, recently used tracking (stored in state), click inserts at cursor
- **Attach menu**: Dropdown from paperclip with Photo/Video, Document, Poll, Location, Contact — Poll opens PollCreationModal, others show toast "Feature simulated"
- **Scheduled send**: Clock icon next to send, opens date/time picker, scheduled messages viewable via header icon
- **Silent send**: Shift+click on send button sends without notification marker
- **Message effects**: Long-press or dropdown on send button to choose confetti/fireworks/hearts, renders CSS particle animation overlay
- **Pin banner navigation**: Click cycles through pinned messages, shows "1 of N", scrolls to and highlights target message
- **Unread messages separator**: Horizontal line with "Unread Messages" label between last read and first unread
- **Auto-delete indicator**: Shows timer icon in header if auto-delete is set
- **Format toolbar**: Enhanced with blockquote (>) and underline (__) buttons
- **Scroll-to-bottom badge**: Shows count of new messages since scrolled away

### 6. `src/components/chat/MessageBubble.tsx` — Enhanced Parser & Logic

- **Text parser additions**:
  - `__underline__` renders as `<u>`
  - `> blockquote` renders with left border + indent background
  - `#hashtag` renders as clickable purple link
  - `@mention` renders as clickable styled link
  - URL auto-detection renders as clickable `<a>` tags
  - Multi-line ` ``` code blocks ``` ` render with dark background, monospace font
  - Expandable blockquotes (long quotes collapse with "Show more")
- **Select mode checkbox**: Shows checkbox on left when selectMode is active
- **Delete animation**: `msgOut` animation on delete before removal
- **Translate option**: Context menu "Translate" calls handler, shows `[Translated] ...` prefix
- **Copy link**: Context menu option for channel posts
- **Big reaction**: Long-press on reaction shows enlarged animation
- **See who reacted**: Click reaction pill shows tooltip with user names
- **Poll rendering**: Inline poll component with vote bars, percentages, vote toggle
- **Dice rendering**: Animated emoji with random result display
- **Message effect overlay**: Confetti/fireworks/hearts CSS animation
- **Scheduled indicator**: Clock icon instead of checkmarks for scheduled messages
- **Silent send indicator**: Muted bell icon for silent messages
- **Bookmark action**: Context menu "Save" to bookmark to Saved Messages

### 7. `src/components/chat/InfoPanel.tsx` — Functional Panel

- **Block user**: Calls blockUser handler, shows "Blocked" state, toggle to unblock
- **Report**: Shows confirmation dialog, then toast "Reported"
- **Leave/Delete**: Calls leaveChat/deleteChat with confirmation dialog
- **Mute toggle**: Already works, add mute duration options
- **Pinned messages section**: Lists all pinned messages, click scrolls to them
- **Groups in common**: Shows mock "Groups in Common (N)" for personal chats
- **Shared media tabs**: Clickable, filters messages by type (shows count)
- **Channel link**: Shows copyable t.me/channelname for public channels
- **Auto-delete setting**: Dropdown to set auto-delete timer (off/1 day/1 week/1 month)
- **Per-chat background**: Color picker or preset selection, stored in chat state
- **Member management**: Show roles (Owner/Admin/Member) for groups
- **Edit own profile**: Editable bio/username fields in Saved Messages info

### 8. `src/components/chat/Modals.tsx` — New Modals

- **CreateGroupModal**: Name input, member selection from contacts (checkbox list), description, creates functional group
- **PollCreationModal**: Question input, dynamic option inputs (add/remove), multi-choice toggle, quiz mode toggle with correct answer selector + explanation, creates real poll
- **PinConfirmationDialog**: "Pin this message?" with "Notify all members" checkbox
- **ReportDialog**: Report reason selection (Spam, Violence, Pornography, Other), confirmation
- **MuteOptionsDialog**: Duration picker (1h, 8h, 2 days, forever, custom)
- **SchedulePickerModal**: Calendar date picker + time picker, "Send when online" option
- **FolderEditorModal**: Folder name, include/exclude chat picker, filter toggles
- **AutoDeleteDialog**: Timer duration picker (off, 1 day, 1 week, 1 month)
- **EffectPickerMenu**: Small dropdown showing confetti/fireworks/hearts options

### 9. `src/components/chat/EmojiPicker.tsx` — New Component

- Full emoji grid organized by 8 categories
- Search input that filters emojis
- Recently used section (tracks last 20 used emojis in state)
- Click inserts emoji at cursor position in textarea
- Smooth panel animation (slide-up from bottom)
- Category tabs with emoji icons
- ~500 common emojis included as data

### 10. `src/components/chat/CommentsPanel.tsx` — New Component

- Slide-up overlay panel for channel post comments
- Header with back button, "Comments" title, count
- Comment list: avatar + colored name + text + time
- Reply to specific comments (nested)
- Add comment input at bottom
- Reactions on comments
- All persisted in state

### 11. `src/components/chat/PollMessage.tsx` — New Component

- Question text displayed prominently
- Option list with vote buttons
- Visual vote bars (percentage fill animation)
- Vote count per option
- Total votes display
- Multi-choice: checkboxes, single-choice: radio behavior
- Quiz mode: correct/incorrect highlight after voting, explanation reveal
- "Retract Vote" option after voting

### 12. `src/index.css` — New Animations

- `@keyframes confetti` — particle burst effect
- `@keyframes fireworks` — expanding sparkle effect
- `@keyframes hearts` — floating hearts effect
- `@keyframes deleteCollapse` — height collapse for message deletion
- `@keyframes highlightSearch` — yellow pulse for search matches
- `@keyframes slideUpPanel` — for comments panel

---

## Feature Completeness Checklist (Everything Fully Functional)

**Messaging:**
- [x] Send/receive (Enter, Shift+Enter newline)
- [x] Reply with preview
- [x] Edit with "edited" label
- [x] Delete with confirmation + animation
- [x] Forward with modal
- [x] Copy text + toast
- [ ] Silent send (Shift+click send)
- [ ] Scheduled messages (date/time picker, auto-send)
- [ ] Message effects (confetti/fireworks/hearts)
- [ ] Auto-delete timer (per-chat, functional)
- [ ] Bookmark to Saved Messages
- [ ] Translate (mock)
- [ ] Dice/random (animated emoji result)

**Text Formatting:**
- [x] Bold, Italic, Code, Strikethrough, Spoiler
- [ ] Underline (__text__)
- [ ] Blockquotes (> text)
- [ ] Expandable blockquotes
- [ ] Hashtag detection (#tag)
- [ ] Mention detection (@user)
- [ ] URL auto-linking
- [ ] Multi-line code blocks

**Selection & Bulk:**
- [ ] Select mode toggle
- [ ] Multi-select with checkboxes
- [ ] Bulk delete
- [ ] Bulk forward
- [ ] Bulk copy
- [ ] Select all / deselect

**Search:**
- [ ] In-chat search bar
- [ ] Real-time highlight in messages
- [ ] Result navigation (up/down)
- [ ] Result counter (X of Y)
- [ ] Media type filter

**Reactions:**
- [x] Emoji reactions + burst
- [x] Reaction picker
- [x] Toggle own reaction
- [x] Quick reaction (double-click)
- [ ] See who reacted (tooltip)
- [ ] Big/hold reaction

**Pins:**
- [x] Pin/Unpin messages
- [x] Pin banner
- [ ] Multi-pin navigation (1 of N, click to cycle)
- [ ] Pin confirmation dialog
- [ ] Scroll to pinned + highlight

**Organization:**
- [x] Pin/Mute/Delete chats
- [x] Chat folders (All/Personal/Groups/Channels)
- [ ] Archive/Unarchive chats
- [ ] Custom folder creation
- [ ] Move to folder
- [ ] Mark as unread
- [ ] Mute with duration options
- [ ] Saved Messages chat
- [ ] Chat drafts (auto-save)
- [ ] Block/Unblock users

**Channels & Groups:**
- [x] Create Channel (2-step)
- [x] Channel posts with views/comments/shares
- [ ] Comments panel (functional)
- [ ] Create Group modal
- [ ] Member roles (Owner/Admin/Member)
- [ ] Leave group/channel (functional)

**Interactive Messages:**
- [ ] Polls (create, vote, retract, results)
- [ ] Quiz mode polls
- [ ] Dice messages

**Emoji & Attachments:**
- [ ] Full emoji picker with categories + search
- [ ] Recently used emojis
- [ ] Attach menu dropdown
- [ ] Poll creation from attach menu

**Info Panel:**
- [x] Profile display
- [x] Notifications toggle
- [ ] Block/Report/Leave (functional)
- [ ] Pinned messages list
- [ ] Auto-delete settings
- [ ] Shared media filtering
- [ ] Channel link copy
- [ ] Groups in common
- [ ] Per-chat background

**UI Polish:**
- [x] Typing indicator
- [x] Online status
- [x] Date separators
- [x] Scroll-to-bottom button
- [ ] Unread messages separator
- [ ] Scroll-to-bottom with unread count badge
- [ ] Delete message animation
- [ ] Keyboard shortcuts (Ctrl+E, Ctrl+R, Ctrl+I)

---

## Technical Notes

- All state is managed via React useState/useCallback in DexsterChat.tsx — no external state library needed
- Scheduled messages use setTimeout with cleanup on unmount
- Auto-delete uses setTimeout per message, cleared on component unmount  
- Emoji data is a static array (~500 emojis) defined in EmojiPicker.tsx
- Poll votes are stored in message.pollData.options[].voters array
- Search uses simple string matching with regex for highlighting
- Draft persistence uses a Record<string, string> keyed by chatId
- Custom folders store chatId arrays and filter predicates
- All timers (mute duration, auto-delete, scheduled send) use real setTimeout with useEffect cleanup
