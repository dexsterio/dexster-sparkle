

# Dexster Chat — Telegram Clone Implementation Plan

## Overview
A full-featured Telegram UI clone with Dexster's dark purple theme. Frontend-only with mock data, all interactions simulated in React state. No backend needed.

---

## Phase 1: Foundation & Layout
- **App shell**: Dark theme with 2-column layout (340px sidebar + flexible chat area)
- **Color system**: Custom dark palette with purple (#6C5CE7) accents, gradient message bubbles
- **Typography**: Outfit font for UI, JetBrains Mono for code
- **Global styles**: Custom scrollbars, animations (fade, slide, scale, context menu, typing dots, reaction burst)

## Phase 2: Sidebar
- **Header**: Dexster logo, search toggle, new chat/channel button
- **Search**: Pill-shaped input that filters chats in real-time
- **Folder tabs**: All, Personal, Groups, Channels — horizontal scrollable tabs with unread badges per folder
- **Chat list**: Avatar with online dot, name, last message preview, time, unread badge, pin/mute icons
- **Right-click context menu**: Pin, Mute, Mark as read, Archive, Delete, Leave
- **Sorting**: Pinned chats always on top, then by most recent

## Phase 3: Chat Area — Core Messaging
- **Chat header**: Clickable (opens info panel), shows avatar, name, online/typing status, action buttons (search, menu)
- **Message bubbles**: Gradient for own messages, subtle glass for others. Proper border-radius (tail corners). Max-width 480px
- **Sender names** in groups with unique colors
- **Timestamps** (HH:MM) + read receipts (single ✓ / double ✓✓) on own messages
- **Date separators**: Sticky centered pills ("Today", "Yesterday", "February 10")
- **Service/action messages**: Centered pill-style ("Alex pinned a message")
- **Send messages** with Enter, Shift+Enter for newlines, auto-expanding textarea
- **Auto-scroll** to bottom on new messages
- **Scroll-to-bottom FAB** with unread count badge

## Phase 4: Message Interactions
- **Reply**: Via hover button or context menu → preview bar above input with purple accent line, reply preview inside bubble
- **Edit**: Own messages only → yellow accent preview, "edited" label on saved messages
- **Delete**: Confirmation dialog with "Also delete for [user]" checkbox, fade-out animation
- **Forward**: Modal with chat search, recent contacts grid, chat list, "Send without my name" option
- **Copy text**: Clipboard copy with toast notification
- **Select mode**: Multi-select with checkboxes, bottom toolbar (delete, forward, copy selected)
- **Double-click** quick reaction (👍)

## Phase 5: Context Menus & Hover Actions
- **Message hover actions**: Floating bar (😊 ↩️ ↗️ ⋮) appearing above bubble on hover
- **Message right-click menu**: Quick reaction row on top, then Reply, Edit, Copy, Pin, Forward, Select, Delete — with keyboard shortcuts shown
- **Sidebar chat right-click menu**: Pin, Mute, Mark as read, Archive, Move to folder, Block, Delete

## Phase 6: Reactions System
- **Reaction picker**: Horizontal emoji bar (👍❤️🔥😂😮😢🎉💯 etc.) with hover scale, triggered from hover actions or context menu
- **Reaction display**: Pill buttons under message text showing emoji + count, highlighted if user reacted
- **Burst animation**: 6 particles flying outward on react
- **Toggle**: Click existing reaction pill to add/remove own reaction

## Phase 7: Text Formatting & Spoilers
- **Format toolbar**: Toggle via "Aa" button — Bold, Italic, Underline, Strikethrough, Code, Spoiler, Link
- **Keyboard shortcuts**: Ctrl+B/I/U etc.
- **Rendered formatting**: Bold, italic, underline, strikethrough, inline code, code blocks in message bubbles
- **Spoiler text**: Blurred/obscured text that reveals on click with smooth transition

## Phase 8: Pin System
- **Pin/Unpin messages** via context menu with confirmation dialog
- **Pin banner** at top of chat: Shows pinned message text, navigation ("1 of 3"), close button
- **Visual indicator** on pinned message bubbles (📌 + subtle border)
- **Click pin banner** to scroll to pinned message with highlight animation

## Phase 9: Channels & Groups
- **Create Channel modal** (2-step): Name/description → Type (public/private), comments toggle, reactions toggle
- **Channel posts**: Full-width bubbles, footer with views (👁), comments (💬), shares (↗️), time
- **Comments panel**: Slide-up overlay with comment list and input
- **Group features**: Colored sender names, admin badges, member count in header

## Phase 10: Info Panel (Slide-in)
- **Hidden by default** — opens on chat header click or menu action
- **Slide-in animation** from right (360px width)
- **Content**: Profile section (avatar, name, status), info fields (phone, username, bio), notification toggle, shared media grid, pinned messages count, danger actions (block, report, delete)
- **Adapts** for users/groups/channels with relevant fields
- **Closes** via ✕ button, Esc key, or switching chats

## Phase 11: Additional Features
- **Typing indicator**: Animated dots in header + sidebar, simulated with timers
- **Online status**: Pulsing green dot on avatars, "last seen" text
- **Mute system**: Mute options (1h, 8h, 2 days, forever), grey unread badges when muted
- **Emoji picker**: Panel with emoji grid, categories, search — triggered by 😊 button
- **Attach menu**: Dropdown (Photo, Document, Poll, Location, Contact) — UI only
- **In-chat search**: Expandable search bar, highlights matches, ↑↓ navigation between results
- **Unread messages separator** line
- **Keyboard shortcuts**: Esc to dismiss, Ctrl+E edit, Ctrl+R reply

## Mock Data
- 4+ individual chats (mix of online, offline, typing, unread states)
- 2+ channels (public & private) with posts, views, comments, reactions
- 1+ group with 3+ members and colored names
- Varied reactions, pinned messages, replies, forwards, edited messages, and service messages across chats

