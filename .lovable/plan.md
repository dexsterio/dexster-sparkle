

# Resizable + Collapsible Sidebar + Fix Bubble Gradient

## Overview
Two changes: (1) Make the left conversation panel collapsible to a mini-state and resizable by dragging its right edge, and (2) fix ALL remaining gradient references on own-message elements so they use a single flat color.

## 1. Fix Remaining Gradients (Flat Color)

Several places still use `bg-gradient-to-br from-primary to-[hsl(252,60%,48%)]` which creates the dual-color effect. All will be changed to flat `bg-primary`.

### Files and locations:
- **src/components/chat/MessageBubble.tsx** line 685: Voice player own-bubble still uses gradient -- change to `bg-primary`
- **src/components/chat/ChatArea.tsx** line 789: Send button uses gradient -- change to `bg-primary`
- **src/components/chat/VoiceRecorder.tsx** line 120: Send button uses gradient -- change to `bg-primary`
- **src/components/chat/MyProfilePanel.tsx** lines 59, potentially: Cover gradient `from-primary via-primary/80 to-secondary` -- change to flat `bg-primary`
- **src/components/chat/SettingsTab.tsx** lines 169, 289: Avatar circles use `bg-gradient-to-br from-primary to-secondary` -- change to flat `bg-primary`

## 2. Resizable + Collapsible Sidebar

### Approach
Use the already-installed `react-resizable-panels` library (ResizablePanelGroup, ResizablePanel, ResizableHandle) to wrap the main layout. The sidebar becomes a resizable panel with min/max width constraints and a collapsible state.

### Technical Details

**DexsterChat.tsx** (main layout component):
- Import `ResizablePanelGroup`, `ResizablePanel`, `ResizableHandle` from `@/components/ui/resizable`
- Wrap the desktop layout (sidebar + chat + info panel) in a `ResizablePanelGroup direction="horizontal"`
- Sidebar panel: `defaultSize={25}`, `minSize={4}` (mini ~56px), `maxSize={40}`, `collapsible`, `collapsedSize={4}`
- Add a thin `ResizableHandle` between sidebar and chat area
- Chat area panel: `defaultSize={75}`, `minSize={40}`
- Add state `sidebarCollapsed` to track collapsed state
- Pass `collapsed` prop to Sidebar so it renders mini mode (icons only)
- Mobile layout stays unchanged (full-width, no resize)

**Sidebar.tsx**:
- Accept new `collapsed?: boolean` prop
- When collapsed, render a narrow strip showing only:
  - DexsterLogo (icon-only variant or hidden)
  - Chat avatars without text
  - A button to expand
- When expanded, render normally as today
- Hide search bar, folder tabs, and text labels when collapsed

### Mini-collapsed state shows:
- Small hamburger/expand button at top
- Chat avatars stacked vertically (no names, no last messages)
- Online indicators still visible
- Unread badges still visible on avatars
- Click on avatar selects that chat

### Resize handle styling:
- Thin 1px border-like handle matching `--border` color
- On hover: shows a subtle 3px drag indicator
- No grip icon by default (clean look)

## Files Modified
1. **src/components/chat/DexsterChat.tsx** -- wrap layout in ResizablePanelGroup (desktop only)
2. **src/components/chat/Sidebar.tsx** -- add `collapsed` prop, render mini mode
3. **src/components/chat/MessageBubble.tsx** -- fix voice player gradient to flat
4. **src/components/chat/ChatArea.tsx** -- fix send button gradient to flat
5. **src/components/chat/VoiceRecorder.tsx** -- fix send button gradient to flat
6. **src/components/chat/MyProfilePanel.tsx** -- fix cover gradient to flat
7. **src/components/chat/SettingsTab.tsx** -- fix avatar gradient to flat

