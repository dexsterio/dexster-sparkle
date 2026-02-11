

# UI Color & Readability Refinement -- True Black, Clean, Professional

## Overview
Shift the entire theme to a true black base with improved text contrast, better readability on chat messages, and refined micro-details throughout. No glow effects. No flashy colors. Just clean, dark, professional.

## Color Changes (index.css)

### Backgrounds -- shift to true black
- `--background`: from `240 25% 5%` to `0 0% 3%` (near-black, #080808)
- `--card`: from `240 25% 8%` to `0 0% 6%` (#0F0F0F)
- `--popover`: from `240 30% 10%` to `0 0% 8%` (#141414)
- `--dex-surface`: from `240 25% 10%` to `0 0% 7%` (#121212)
- `--dex-hover`: from `240 10% 14%` to `0 0% 10%` (#1A1A1A)
- `--dex-bubble-other`: from `240 20% 14%` to `0 0% 11%` (#1C1C1C)
- `--muted`: from `240 15% 18%` to `0 0% 14%` (#242424)
- `--input`: from `240 15% 18%` to `0 0% 13%` (#212121)
- `--border`: from `240 10% 12%` to `0 0% 12%` (#1F1F1F)

### Text -- higher contrast
- `--foreground`: from `240 20% 92%` to `0 0% 93%` (#EDEDED) -- pure neutral white
- `--muted-foreground`: from `240 10% 55%` to `0 0% 50%` (#808080) -- neutral gray, easier to read

### Primary/accent -- keep as muted steel but slightly brighter for better visibility
- `--primary`: from `220 15% 38%` to `220 12% 42%` -- subtle steel, slightly more visible
- `--secondary`: keep at `220 12% 48%`

### Sidebar vars -- match new blacks
- `--sidebar-background`: match `--card`
- `--sidebar-border`: match `--border`

## Own Message Bubble Gradient (MessageBubble.tsx)
The own-message gradient currently references hardcoded `hsl(252,60%,48%)` (purple). Change to use `--primary` variable so it matches the muted steel theme:
- `from-primary to-[hsl(220,15%,32%)]` -- dark steel gradient, no purple

Also in dice messages: same fix for the hardcoded purple gradient.

## Text Readability Improvements (MessageBubble.tsx)
- Message text size: ensure `text-sm` (14px) is used consistently -- currently correct
- Time stamps: keep `text-[11px]` but ensure neutral color
- Sender names in groups: keep deterministic hue colors but increase lightness from 60% to 65% for better readability on black
- Admin badges: ensure they read well against true black

## index.html Meta Colors
- Change `#7c5cfc` (purple) to `#080808` (true black) in `theme-color` and `msapplication-TileColor`

## Files Modified
1. **src/index.css** -- all CSS variable values updated to true-black neutral palette
2. **src/components/chat/MessageBubble.tsx** -- remove hardcoded purple gradient, use primary-based steel gradient; improve sender color lightness
3. **index.html** -- meta theme-color to black

## What Does NOT Change
- DexsterLogo component -- keeps its brand turquoise + glitch effects untouched
- Font choices (Outfit, JetBrains Mono, Orbitron) -- stay the same
- Layout structure -- unchanged
- Animation keyframes -- unchanged
- Glitch CSS -- unchanged

