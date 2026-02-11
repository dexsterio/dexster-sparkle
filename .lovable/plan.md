

# Reaction Emoji Animation Fix & Chat Feature Improvements

## Overview
This plan fixes the broken reaction burst animation (currently anchored to the message bubble center instead of the individual reaction pill) and improves its visual quality with GPU-accelerated CSS animations. The burst will be Telegram-style: particles explode outward from the specific reaction pill in a circular pattern.

## What Changes

### 1. New ReactionBurst Component
Create `src/components/chat/ReactionBurst.tsx` -- a standalone component that renders 8 emoji particles in a circular pattern around its parent element. Uses CSS custom properties for GPU-only animation (no JS per-frame updates).

### 2. New ReactionPill Component
Create `src/components/chat/ReactionPill.tsx` -- each reaction pill (`[emoji count]`) manages its own burst state. The burst renders **inside** the pill's container (position: relative), so it's always anchored to the correct button regardless of mouse position.

### 3. Update MessageBubble.tsx
- Remove the old `burst` state, `triggerBurst` function, and the `<div className="absolute inset-0 pointer-events-none">` burst block (lines 156, 278-293, 618-628).
- Add `initialBurst` state to track when a reaction is first added via the picker, so the correct pill receives the burst trigger.
- Replace inline reaction rendering (lines 596-615 and 392-404) with the new `ReactionPill` component.
- Both the media-message reactions and the regular-message reactions get updated.

### 4. Update CSS (src/index.css)
- Remove the old `@keyframes reactionBurst` (line ~6-8 of keyframes section).
- Add new `@keyframes reactionParticle` with 3-stage animation: center (scale 0.3) -> expand (full size) -> fade out. Uses CSS custom properties (`--end-x`, `--end-y`, `--end-scale`, `--end-rotate`).

## Technical Details

### ReactionBurst Component
```text
- 8 particles spread in a circle (angle = i/8 * 2PI + jitter)
- Distance: 30-55px from center
- Scale: 0.6x - 1.1x
- Uses will-change: transform, opacity for GPU compositing
- pointer-events: none on container
- Duration: 600ms with cubic-bezier(0.25, 0.46, 0.45, 0.94)
- Stagger: 30ms between particles
- Self-destructs via onDone callback after 650ms
```

### ReactionPill Component
```text
- Receives: emoji, count, isActive, onReact, triggerBurst, onBurstDone
- Has position: relative + overflow: visible
- Internal burst state for click-triggered bursts
- useEffect watches triggerBurst prop for picker-initiated bursts
- Renders ReactionBurst centered on itself (absolute, top: 50%, left: 50%, translate -50% -50%)
```

### MessageBubble Changes
```text
- Remove: burst state (line 156), triggerBurst function (lines 278-287)
- Remove: burst render block (lines 618-628)
- Add: initialBurst state (string | null)
- handleReaction sets initialBurst = emoji before calling onReaction
- handleDoubleClick sets initialBurst = thumbs up
- Reaction maps replaced with ReactionPill components (2 locations: media messages ~392-404, regular messages ~596-615)
```

### CSS Changes
```text
- Remove: @keyframes reactionBurst
- Add: @keyframes reactionParticle (3-step: 0% center+small, 50% mid+full, 100% far+faded)
  Uses var(--end-x), var(--end-y), var(--end-scale), var(--end-rotate)
```

## Files Modified
1. `src/components/chat/ReactionBurst.tsx` (new)
2. `src/components/chat/ReactionPill.tsx` (new)
3. `src/components/chat/MessageBubble.tsx` (updated)
4. `src/index.css` (updated)

