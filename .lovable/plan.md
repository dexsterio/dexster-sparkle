
# Comprehensive Mobile Responsive Overhaul

## Overview
Make the entire Dexster chat application fully responsive and optimized for all mobile screen sizes (320px-414px and everything in between). This involves fixing modal overflow issues, improving touch targets, ensuring safe-area compliance, and polishing every mobile view.

## Current State
The app already has a basic mobile implementation:
- View-stack model (sidebar OR chat, not both)
- Bottom navigation bar (Chats, Contacts, Saved, Settings)
- Sheet-based menus for the chat header
- Pull-to-refresh, swipe-to-reply
- Safe-area inset handling in some areas

## Issues to Fix

### 1. Modals overflow on small screens
All modals in `Modals.tsx` use fixed pixel widths (`w-[380px]`, `w-[400px]`, `w-[480px]`) that overflow on screens narrower than 400px (e.g. iPhone SE at 320px, Galaxy S at 360px).

**Fix**: Replace all fixed modal widths with responsive classes:
- `w-[380px]` becomes `w-[calc(100vw-2rem)] max-w-[380px]`
- `w-[400px]` becomes `w-[calc(100vw-2rem)] max-w-[400px]`
- `w-[480px]` becomes `w-[calc(100vw-2rem)] max-w-[480px]`

This ensures modals never exceed screen width minus 16px padding on each side.

### 2. Sidebar last-message truncation uses fixed width
In `Sidebar.tsx`, `max-w-[200px]` is hardcoded for last-message previews. On wider phones this wastes space; on narrow phones it could still overflow.

**Fix**: Replace `max-w-[200px]` with `max-w-[60vw]` on mobile and keep `max-w-[200px]` on desktop via conditional class.

### 3. CommentsPanel needs safe-area bottom padding
The comments input at the bottom of `CommentsPanel.tsx` does not account for the phone's bottom safe area (notch/home indicator).

**Fix**: Add `style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}` to the input container.

### 4. InfoPanel mobile Sheet lacks safe-area bottom
The mobile InfoPanel rendered as a Sheet needs bottom safe-area padding for the danger-zone buttons.

**Fix**: Add safe-area bottom padding to the InfoPanel's bottom section.

### 5. Toast notification needs safe-area awareness
The toast at the bottom of `DexsterChat.tsx` uses `bottom-6` which can be hidden behind the home indicator on newer phones.

**Fix**: Change to `bottom-20` on mobile (above the bottom nav) or use `env(safe-area-inset-bottom)` offset.

### 6. Context menu on mobile should be a bottom sheet
Currently `ContextMenu.tsx` renders as a floating positioned menu. On mobile, long-pressing a chat item can cause the context menu to clip off-screen.

**Fix**: When `isMobile` is true, render the context menu as a bottom Sheet instead of a floating positioned menu. This requires passing `isMobile` prop to the ContextMenu usage in Sidebar.

### 7. Saved messages delete button invisible on mobile
In `SavedMessagesTab.tsx`, the delete button uses `opacity-0 group-hover:opacity-100` which never triggers on touch devices.

**Fix**: Change to always show the button on mobile, or use `opacity-100 md:opacity-0 md:group-hover:opacity-100`.

### 8. Chat input area needs keyboard-aware spacing
When the virtual keyboard opens on mobile, the input area should remain visible and not get hidden behind the keyboard.

**Fix**: Add `visualViewport` resize listener to adjust the input bar positioning when the keyboard is open. Use CSS `env(keyboard-inset-height)` or JS fallback.

### 9. Missing viewport meta tag attributes
Ensure `index.html` has proper mobile viewport settings including `viewport-fit=cover` for notch devices and `user-scalable=no` to prevent unwanted zoom on input focus.

### 10. CSS touch-action and overscroll behavior
Add global CSS rules to prevent browser bounce/overscroll on mobile and improve touch responsiveness.

## Files Modified

1. **src/components/chat/Modals.tsx** -- Make all modal widths responsive with `w-[calc(100vw-2rem)] max-w-[Xpx]`
2. **src/components/chat/Sidebar.tsx** -- Dynamic max-width for last-message text; pass isMobile to context menu
3. **src/components/chat/CommentsPanel.tsx** -- Safe-area bottom padding on input
4. **src/components/chat/InfoPanel.tsx** -- Safe-area bottom padding
5. **src/components/chat/DexsterChat.tsx** -- Mobile-aware toast positioning
6. **src/components/chat/SavedMessagesTab.tsx** -- Always-visible delete button on mobile
7. **src/components/chat/ContextMenu.tsx** -- Bottom-sheet mode for mobile
8. **src/components/chat/ChatArea.tsx** -- Keyboard-aware input positioning
9. **index.html** -- Viewport meta improvements
10. **src/index.css** -- Touch-action, overscroll-behavior, keyboard-height CSS

## Technical Details

### Modal Responsive Pattern
```text
Before:  w-[380px]
After:   w-[calc(100vw-2rem)] max-w-[380px]
```

### Context Menu Mobile Pattern
When isMobile is true, the ContextMenu component will render using the Sheet component (bottom-sheet) rather than absolutely positioned div. The items array stays the same.

### Keyboard Handling
Add a `useEffect` in ChatArea that listens to `window.visualViewport.resize` events and applies a CSS custom property `--keyboard-offset` to push the input bar above the keyboard.

### CSS Additions (index.css)
```text
html, body {
  overscroll-behavior: none;
  -webkit-overflow-scrolling: touch;
}

@supports (padding-bottom: env(keyboard-inset-height)) {
  .chat-input-bar {
    padding-bottom: calc(env(keyboard-inset-height, 0px));
  }
}
```

### Viewport Meta (index.html)
```text
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
```
