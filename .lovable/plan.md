

# Comprehensive Group System Overhaul (Telegram-style)

## Overview
A complete rewrite of the group creation and management system to match ~90% of Telegram's group features. This includes a 3-step creation wizard with avatar upload and public/private dexst.me links, a fully tabbed management interface with granular permissions, individual member restrictions, per-admin permissions with custom titles, banned users management, anti-spam, and invite link formatting.

## What the User Will See

### Create Group -- 3-Step Wizard
1. **Identity**: Upload group photo, enter name (64 char limit) and description (255 char limit)
2. **Privacy & Settings**: Public/Private toggle with dexst.me link preview, join approval, chat history visibility for new members
3. **Add Members**: Search users, recent contacts carousel, selected member chips

### Manage Group -- Tabbed Interface (3 tabs)

**General Tab**
- Avatar upload (AvatarUpload component)
- Name and description editing
- Group type toggle (Public/Private) with dexst.me link preview
- Chat history for new members (Visible/Hidden)
- Allow reactions toggle
- Auto-translate toggle

**Permissions Tab**
- Global member permissions with expanded toggles:
  - Send messages, Send media (photos/videos), Send stickers/GIFs, Send polls, Send links, Send files, Add members, Pin messages, Change group info, Create topics
- Slow Mode selector (Off, 5s, 10s, 15s, 30s, 1m, 5m, 15m, 1h)
- Anti-spam toggle
- Restrict saving content toggle

**Management Tab**
- Invite Links button (links now display with dexst.me domain)
- Administrators button (opens enhanced AdminManagementModal)
- Members count
- Banned Users section with list and unban functionality
- Removed Users section
- Recent Actions log
- Danger zone: Delete Group

### Enhanced Admin Management Modal
- List of current admins with custom titles displayed
- Per-admin granular permissions editor:
  - Change group info, Delete messages, Ban users, Invite users via link, Pin messages, Manage voice/video chats, Stay anonymous, Add new admins, Manage topics
- Custom admin title input (e.g. "Moderator", "Founder")
- Promote member flow with permissions selection

### Banned Users Modal (New)
- List of banned users with ban reason and date
- Unban button per user
- Indicator for temporary vs permanent bans

### Member Restrictions (New - via InfoPanel or Management)
- Per-user restriction toggles (same list as global permissions)
- Temporary restriction with duration selector
- "Until date" or "Forever" options

## Technical Details

### Types Changes (src/types/chat.ts)

```text
GroupPermissions expanded:
  + sendLinks: boolean
  + sendFiles: boolean  
  + createTopics: boolean

Chat expanded:
  + antiSpam?: boolean
  + reactionsEnabled used for groups too (already exists)

AdminPermissions already has:
  changeInfo, postMessages, editMessages, deleteMessages,
  banUsers, inviteUsers, pinMessages, manageVideoChats,
  stayAnonymous, addAdmins
  + manageTopics: boolean (new)

AdminEntry already has title field -- will be used in UI

New interface:
  MemberRestriction {
    userId: string
    restrictions: Partial<GroupPermissions>
    until?: number // timestamp, undefined = forever
  }

Chat expanded:
  + memberRestrictions?: MemberRestriction[]

BannedUser interface:
  { userId: string; reason?: string; bannedAt: string; until?: number }

Chat.bannedUsers changes from string[] to BannedUserEntry[] 
  (breaking change handled with migration logic in component)
```

### CreateGroupModal Rewrite (src/components/chat/Modals.tsx)

```text
Props change:
  onCreate: (name, memberIds, description)
  -->  
  onCreate: (data: {
    name: string
    description: string
    isPublic: boolean
    joinApproval: boolean
    chatHistoryForNewMembers: boolean
    memberIds: string[]
    avatarFile?: File
  })

3-step wizard using same patterns as CreateChannelModal:
  - Step indicator dots
  - AvatarUpload component reuse
  - Public/Private toggle cards with dexst.me link preview
  - User search with useUserSearch hook (already used)
  - Recent contacts horizontal list (already exists in current modal)
```

### EditGroupModal Rewrite (src/components/chat/Modals.tsx)

```text
Changes from flat layout to tabbed interface (same as EditChannelModal):
  - 3 tabs: General, Permissions, Management
  - Uses AvatarUpload component (currently missing from EditGroupModal)
  - Expanded permissions list (10 toggles instead of 7)
  - Anti-spam toggle
  - Restrict saving content toggle
  - Banned users section with BannedUsersModal
  - Recent actions log
  - handleSave sends all new fields
```

### AdminManagementModal Enhancement (src/components/chat/Modals.tsx)

```text
Current: Simple promote/demote with title
Enhanced:
  - Each admin shows their permissions summary
  - Edit admin button opens permissions editor
  - 10 granular permission checkboxes per admin
  - Custom title input per admin
  - Promote flow includes permissions selection step
```

### New: BannedUsersModal (src/components/chat/Modals.tsx)

```text
- Lists banned users with avatar, name, ban reason, date
- Unban button per entry
- Empty state when no bans
```

### New: MemberRestrictionsModal (src/components/chat/Modals.tsx)

```text
- Select a member from list
- Toggle individual permissions for that member
- Set restriction duration (1h, 1d, 1w, Forever)
- Save restrictions
```

### DexsterChat.tsx Changes

```text
- createGroup callback updated to accept new data shape
- Pass avatarFile, isPublic, joinApproval, chatHistoryForNewMembers to API
- New state: showBannedUsers, showMemberRestrictions
- New callbacks: handleUnban, handleRestrict
- EditGroupModal receives new props for opening sub-modals
```

### InviteLinksModal Update

```text
- Format displayed links with https://dexst.me/ prefix
- Show "Primary link" badge on the first/main link
```

## Files Modified
1. `src/types/chat.ts` -- Expand GroupPermissions, AdminPermissions, add MemberRestriction, BannedUserEntry
2. `src/components/chat/Modals.tsx` -- Rewrite CreateGroupModal (wizard), rewrite EditGroupModal (tabbed), enhance AdminManagementModal (per-admin permissions), add BannedUsersModal, add MemberRestrictionsModal, update InviteLinksModal
3. `src/components/chat/DexsterChat.tsx` -- Update createGroup handler, add new modal states and callbacks

