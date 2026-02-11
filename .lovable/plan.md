

# Dexster Brand Identity + Chat Theme Update

## Overview
Implement the official DEXSTER brand logo with dual glitch effects (static on "DEX", animated on "STER"), the turquoise brand color, Orbitron font, and update the entire chat UI color scheme to match the brand identity -- shifting from purple to turquoise as the primary accent.

## What Changes

### 1. New Reusable Logo Component
A `DexsterLogo` component with size variants (sm/md/lg/xl) that renders "DEX" in turquoise with a static glitch effect and "STER" in white with an animated glitch effect using CSS pseudo-elements and clip-path.

### 2. Updated Color Theme
The primary/accent colors shift from purple (`hsl(252 75% 64%)`) to turquoise (`hsl(165 85% 45%)`). This affects:
- Active chat highlights, folder tabs, badges
- Message bubbles (own messages gradient)
- Focus rings, buttons, links
- Sidebar accents, online indicators
- Search highlights, scrollbar hover states

### 3. Logo Placement
The new glitch logo replaces the current hamburger-menu area branding and appears in:
- Sidebar header (next to hamburger icon)
- Hamburger drawer profile section

### 4. Font Addition
Orbitron font imported for the logo text only. Outfit remains the main UI font.

---

## Technical Details

### New File: `src/components/chat/DexsterLogo.tsx`
Reusable component with size prop (sm/md/lg/xl) using `font-orbitron`, `static-glitch` on "DEX", and `animated-glitch` on "STER" with `data-text` attributes for pseudo-element content.

### File: `index.html`
Add Orbitron font to the Google Fonts link (append `&family=Orbitron:wght@400;500;600;700;800;900`).

### File: `src/index.css`
1. Add `@import url(...)` for Orbitron at the top (line 1)
2. Add `--color-brand-turquoise: 165 85% 45%;` CSS variable
3. Update `--primary` from `252 75% 64%` to `165 85% 45%` (turquoise)
4. Update `--secondary` from `252 95% 80%` to `165 70% 60%` (lighter turquoise)
5. Update `--accent`, `--ring`, `--sidebar-primary`, `--sidebar-accent`, `--sidebar-ring` to match
6. Add the complete static-glitch CSS (clip-path polygon slices with +/-1px translateX)
7. Add the complete animated-glitch CSS (glitchTop + glitchBottom keyframes with skew transforms)
8. Update `--dex-online` stays the same (already turquoise-adjacent)

### File: `tailwind.config.ts`
1. Add `orbitron: ['Orbitron', 'sans-serif']` to `fontFamily`
2. Add `'brand-turquoise': 'hsl(var(--color-brand-turquoise))'` to colors

### File: `src/components/chat/Sidebar.tsx`
1. Import `DexsterLogo` component
2. Replace the bare hamburger button area with hamburger + `<DexsterLogo size="sm" />` in the header
3. In the hamburger drawer profile section, replace "Dexster User" heading or add the logo

### File: `src/components/chat/MessageBubble.tsx`
The own-message bubble gradient currently uses `from-primary to-secondary`. Since primary/secondary are now turquoise, the gradient automatically updates. The contrast-aware inline styles (white text on own bubbles) remain correct since turquoise is also a dark-enough background.

### Files Modified
1. `src/components/chat/DexsterLogo.tsx` (new)
2. `index.html` (Orbitron font)
3. `src/index.css` (brand color, glitch CSS, primary color update)
4. `tailwind.config.ts` (orbitron font, brand-turquoise color)
5. `src/components/chat/Sidebar.tsx` (use DexsterLogo)

