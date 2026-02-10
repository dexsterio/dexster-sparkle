

# Massive Feature Expansion & UI Fix Plan for Dexster Chat

## Overview
This plan addresses two major areas: (1) fixing the persistent reply contrast bug and other UI issues, and (2) adding comprehensive channel/group management, a proper header menu system, and many missing functional features to bring Dexster to enterprise-grade quality.

---

## Part 1: Critical UI Fixes

### 1.1 Reply Contrast Fix (Still Broken)
The reply preview inside own purple bubbles still shows near-invisible text. The current code uses `text-white/90` and `text-white/60` which should work, but the `bg-white/10` background blends with the purple gradient making the entire reply block hard to distinguish.

**Fix**: Increase contrast significantly:
- Reply background: `bg-white/15` (was `/10`)
- Reply sender name: `text-white font-bold` (was `text-white/90`)  
- Reply text: `text-white/75` (was `text-white/60`)
- Reply left border: `border-white/60` (was `border-white/40`)

### 1.2 Other Bubble Contrast Tweaks
- Forwarded header border: `border-white/50` (was `/30`)
- Pin indicator: `text-white/80` (was `/70`)
- Meta timestamp: `text-white/60` (was `/55`)

---

## Part 2: Channel Header Menu (Three-Dot Menu)

Currently the MoreVertical button in the chat header does nothing. Based on the Telegram reference (image-1), this needs a full dropdown menu.

### 2.1 Header Menu Dropdown (ChatArea.tsx)
Add a dropdown on the three-dot button with context-aware items:

**For Channels (owner/admin):**
- Mute notifications (with submenu arrow)
- View channel info
- Manage Channel (opens Edit Channel modal)
- Create poll
- Clear history
- Leave channel (red)

**For Channels (subscriber):**
- Mute notifications
- View channel info
- Report
- Leave channel (red)

**For Groups (admin):**
- Mute notifications
- View group info
- Manage Group (opens Edit Group modal)
- Create poll
- Clear history
- Leave group (red)

**For Groups (member):**
- Mute notifications
- View group info
- Create poll
- Leave group (red)

**For Personal chats:**
- Mute notifications
- View profile
- Clear history
- Block user
- Delete chat (red)

### 2.2 Implementation
- New state `showHeaderMenu` in ChatArea
- Click-outside-to-close behavior
- Each item calls the appropriate handler passed as props from DexsterChat

---

## Part 3: Edit Channel / Manage Channel Modal

Based on reference image-2, a comprehensive channel settings modal.

### 3.1 EditChannelModal (new export in Modals.tsx)

**Sections:**
1. **Header**: Channel avatar (camera icon placeholder) + Channel name input + emoji button
2. **Description** (optional textarea)
3. **Settings section**:
   - Channel type: Public / Private (toggle, shows current state)
   - Discussion: Add a group / linked group name
   - Direct Messages: On/Off toggle
   - Appearance: accent color picker
   - Auto-translate messages: On/Off toggle
   - Sign messages: On/Off toggle with explanation text
4. **Divider**
5. **Management section**:
   - Reactions: All / Selected / None
   - Invite links: count display, clickable
   - Administrators: count display, clickable
   - Subscribers: count display, clickable
   - Removed users: clickable
   - Recent actions: clickable
6. **Delete channel** (red, bottom)
7. **Footer**: Cancel / Save buttons

### 3.2 Data Model Updates (types/chat.ts)

Add to Chat interface:
```
signMessages?: boolean;
autoTranslate?: boolean;
accentColor?: string;
directMessages?: boolean;
discussionGroup?: string;
inviteLinks?: { id: string; link: string; uses: number; maxUses?: number; expiresAt?: string }[];
admins?: { userId: string; title?: string; permissions: string[] }[];
removedUsers?: string[];
recentActions?: { action: string; userId: string; timestamp: string }[];
```

### 3.3 Logic in DexsterChat.tsx
- `updateChannelSettings(chatId, settings)` handler
- `deleteChannel(chatId)` handler with confirmation
- Pass handlers to the modal

---

## Part 4: Edit Group / Manage Group Modal

### 4.1 EditGroupModal (new export in Modals.tsx)

Similar to channel but with group-specific options:
1. Group avatar + name + description
2. Group type: Public / Private
3. Chat history for new members: Visible / Hidden
4. Permissions section (what members can do):
   - Send messages
   - Send media
   - Send stickers/GIFs
   - Send polls
   - Add members
   - Pin messages
   - Change group info
5. Slow mode: Off / 10s / 30s / 1m / 5m / 15m / 1h
6. Admin list with roles
7. Member list with search + kick/promote
8. Banned users
9. Invite links management
10. Delete group (red)

### 4.2 Data Model Updates
Add to Chat interface:
```
permissions?: {
  sendMessages?: boolean;
  sendMedia?: boolean;
  sendStickers?: boolean;
  sendPolls?: boolean;
  addMembers?: boolean;
  pinMessages?: boolean;
  changeInfo?: boolean;
};
slowMode?: number; // seconds, 0 = off
chatHistoryForNewMembers?: boolean;
bannedUsers?: string[];
```

---

## Part 5: Invite Links Management

### 5.1 InviteLinksModal (new)
- List of invite links with: link text, uses count, max uses, expiry
- Create new link button (generates `t.me/+randomcode`)
- Copy link button
- Revoke link button
- Edit link (max uses, expiry date)

### 5.2 Logic
- `createInviteLink(chatId)` generates a mock link
- `revokeInviteLink(chatId, linkId)` removes it
- Links stored on the Chat object

---

## Part 6: Admin Management

### 6.1 AdminManagementModal (new)
- List of admins with avatar, name, custom title
- Click admin to edit permissions:
  - Change channel/group info
  - Post messages (channels)
  - Edit messages of others
  - Delete messages
  - Ban users
  - Invite users via link
  - Pin messages
  - Manage video chats
  - Stay anonymous
  - Add new admins
- Promote member to admin
- Demote admin
- Custom admin title input

### 6.2 Data Model
```
interface AdminPermissions {
  changeInfo: boolean;
  postMessages: boolean;
  editMessages: boolean;
  deleteMessages: boolean;
  banUsers: boolean;
  inviteUsers: boolean;
  pinMessages: boolean;
  manageVideoChats: boolean;
  stayAnonymous: boolean;
  addAdmins: boolean;
}
```

---

## Part 7: Member Management (Groups)

### 7.1 MemberListModal (new or section in EditGroupModal)
- Search members
- Click member: view profile / promote to admin / restrict / ban / remove
- Add member button
- Sort by: name, last seen, join date

---

## Part 8: Clear History Feature

### 8.1 ClearHistoryDialog (new in Modals.tsx)
- Confirmation: "Delete all messages in this chat?"
- Checkbox: "Also delete for [other party]" (personal chats)
- Clears all messages for the chat from state

### 8.2 Logic
- `clearHistory(chatId, forAll)` in DexsterChat.tsx

---

## Part 9: Enhanced InfoPanel

The current InfoPanel is basic. Enhance it to be more like Telegram's profile view:

### 9.1 Channel InfoPanel Additions
- Edit button (pencil icon) in header for owners/admins
- Subscriber count with "N online" for groups
- Invite link section (copyable)
- Admin list (compact)
- "Manage Channel" button for admins

### 9.2 Group InfoPanel Additions  
- "Add Member" button
- Member search
- Admin badges next to names
- "Manage Group" button for admins

### 9.3 Personal Chat InfoPanel
- Add notification sound setting (placeholder)
- Shared media tabs: make them actually filter and show message content
- Edit own profile (bio, username) when viewing Saved Messages

---

## Part 10: More Missing Features

### 10.1 Slow Mode (Groups)
- Admin sets delay between messages (10s/30s/1m/5m/15m/1h)
- Input area shows countdown timer when slow mode active
- Disable send button during cooldown

### 10.2 Clear Chat / Delete All Messages
- Context menu on sidebar: "Clear history"
- Opens ClearHistoryDialog

### 10.3 Chat Permissions for Groups
- Toggle what regular members can do
- Enforced in the input area (disable features that are restricted)

### 10.4 Username / Link for Channels
- t.me/channelname copyable in info panel and edit modal
- QR code placeholder

---

## Technical Summary

### Files to Create:
- None (all new modals go in Modals.tsx, all new UI in existing components)

### Files to Modify:

| File | Changes |
|------|---------|
| `src/types/chat.ts` | Add permissions, slowMode, signMessages, autoTranslate, accentColor, directMessages, inviteLinks, admins, bannedUsers, recentActions, chatHistoryForNewMembers |
| `src/data/mockData.ts` | Add default invite links, admin data, permissions to existing channels/groups |
| `src/components/chat/DexsterChat.tsx` | Add handlers: updateChannelSettings, updateGroupSettings, deleteChannel, clearHistory, createInviteLink, revokeInviteLink, promoteAdmin, demoteAdmin, banUser, restrictUser, slowMode enforcement. Add modal states. Pass new props |
| `src/components/chat/ChatArea.tsx` | Add header three-dot menu dropdown with context-aware items. Add slow mode countdown UI. Fix reply contrast values |
| `src/components/chat/MessageBubble.tsx` | Fix reply contrast (increase white opacity). Improve forwarded/pin/meta contrast |
| `src/components/chat/InfoPanel.tsx` | Add edit button for admins, manage button, enhanced member list, invite link section, subscriber/admin counts |
| `src/components/chat/Modals.tsx` | Add: EditChannelModal, EditGroupModal, InviteLinksModal, AdminManagementModal, ClearHistoryDialog, MemberListModal. Enhance existing modals |
| `src/components/chat/Sidebar.tsx` | Add "Clear history" to context menu |

### Priority Order:
1. Fix reply contrast (immediate visual bug)
2. Header three-dot menu (core missing feature)
3. Edit Channel modal (most requested)
4. Edit Group modal
5. Clear history
6. Invite links management
7. Admin management
8. Member management
9. Slow mode
10. InfoPanel enhancements

