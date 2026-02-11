

# Mobilanpassning av Dexster Chat

## Oversikt

Chatten ar byggd som en fast tvakolumnslayout (340px sidebar + flexibel chattyta + 360px infopanel). Inget ar responsivt idag. Planen ar att implementera en fullstandig mobilupplevelse dar sidebar, chattyta och paneler visas som separata fullskarmsvyer med smidiga overganger -- likt Telegram/WhatsApp pa mobil.

## Arkitektur

Mobilvyn anvander en **view-stack-modell**: pa mobil visas bara en vy i taget (sidebar ELLER chattyta ELLER infopanel), med animerade overganger. `useIsMobile()` (redan finns i projektet) styr vilken layout som renderas.

```text
DESKTOP (>=768px)                    MOBIL (<768px)
+----------+------------------+      +------------------+
| Sidebar  |    ChatArea      |      | [Sidebar]        | <-- fullskarm
| 340px    |    flex-1        |      | eller             |
|          |                  |      | [ChatArea]        | <-- fullskarm
|          |                  |      | eller             |
|          |    [InfoPanel]   |      | [InfoPanel]       | <-- slide-in sheet
+----------+------------------+      +------------------+
```

## Steg-for-steg implementering

### 1. DexsterChat.tsx -- Mobilvy-logik

- Importera `useIsMobile()` hook
- Lagg till state: `mobileView: 'sidebar' | 'chat'`
- Pa mobil: rendera ANTINGEN Sidebar ELLER ChatArea (inte bada samtidigt)
- Nar anvandaren valjer en chatt -> byt till `mobileView: 'chat'`
- Lagg till en tillbaka-knapp i ChatArea-headern pa mobil -> byt till `mobileView: 'sidebar'`
- InfoPanel renderas som en Sheet (slide-in fran hoger) pa mobil istallet for en fast kolumn
- CommentsPanel renderas pa samma satt -- fullskarmsstacklad vy

### 2. Sidebar.tsx -- Mobilanpassning

- Andra fast bredd `w-[340px]` till `w-full md:w-[340px]`
- Justera padding och typstorlekar for touch-targets (minst 44px hojd pa klickbara element)
- Folder-tabbar: horisontell scroll med momentum (`overflow-x-auto`, `-webkit-overflow-scrolling: touch`)
- Chat-listelement: storre touch-areas (py-3 istallet for py-2.5)
- Soksfaltet: fullbredd, storre font
- Ny chatt-menyn: fullbredd-dropdown anpassad for mobil
- Lagg till safe-area-insets for iPhones med notch

### 3. ChatArea.tsx -- Mobilanpassning

- Lagg till en tillbaka-knapp (ArrowLeft) langst till vanster i headern, synlig BARA pa mobil
- Prop: `onBack?: () => void` -- anropas nar tillbaka trycks
- Header: kompaktare layout med storre touch-targets
- Meddelandeyta: fullbredd bubblor (`max-w-[85vw]` istallet for `max-w-[480px]`)
- Input-area: anpassad for mobil med storre knappar
- Emoji-picker: renderas som en bottom-sheet pa mobil (absolute bottom med max-height)
- GIF-picker: samma bottom-sheet-beteende
- Attach-meny: fullbredd bottom-sheet
- Header-meny: fullskarms-overlay pa mobil istallet for absolut dropdown
- Format-toolbar: horisontell scroll pa sma skarmar
- Select mode toolbar: kompaktare med ikoner istallet for text+ikoner
- Scroll-to-bottom FAB: positionerad for mobil (bottom-20 right-4)

### 4. MessageBubble.tsx -- Mobilanpassning

- Max-bredd: `max-w-[85vw] md:max-w-[480px]`
- Long-press for kontextmeny (istallet for hogerklick)
- Swipe-to-reply gester (stretch goal, kan lagas till via touch events)
- Reaction-picker: storre knappar for touch
- Hover-actions doljs pa mobil (ersatts av long-press kontextmeny)
- Kontextmeny: renderas som en centrerad bottom-sheet pa mobil

### 5. InfoPanel.tsx -- Mobilt Sheet

- Pa mobil: renderas inuti en Sheet-komponent (slide fran hoger, fullskarm)
- Andras fran `w-[360px]` till fullbredd inuti sheeten
- Storre touch-targets pa alla knappar
- Scrollbar som fungerar bra pa touch

### 6. EmojiPicker.tsx och GifPicker.tsx

- Pa mobil: renderas som bottom-sheets med drag-to-dismiss
- Storre emoji-knappar for touch (minst 40x40px)
- Fullbredd sokfalt

### 7. ContextMenu.tsx -- Mobilt bottom-sheet

- Pa mobil: istallet for absolut positionerad dropdown, renderas som ett centrerat bottom-sheet med overlay
- Storre touch-targets
- Animerad inslidning fran botten

### 8. Modals (alla dialoger)

- Pa mobil: fullskarms-modaler eller bottom-sheets istallet for centrerade popups
- Storre input-falt och knappar
- Safe-area padding

### 9. CSS-tillagg (index.css)

- Safe area insets: `env(safe-area-inset-top)`, `env(safe-area-inset-bottom)`
- Nya animations for mobiloverganger (slide-left, slide-right)
- Touch-specifik styling: `-webkit-tap-highlight-color: transparent`
- Viewport meta-tag kontroll (redan i index.html)

## Tekniska detaljer

### Responsiva breakpoints
- `<768px`: Mobillayout (en vy i taget)
- `>=768px`: Desktoplayout (nuvarande tvakolumner)

### Touch-optimering
- Alla interaktiva element minst 44x44px (Apple HIG)
- Long-press for kontextmenyer (300ms delay)
- Smooth momentum scrolling overallt
- Ingen hover-effekt pa mobil (anvand active states istallet)

### Filer som andras
1. `src/components/chat/DexsterChat.tsx` -- mobilvy-logik, villkorlig rendering
2. `src/components/chat/Sidebar.tsx` -- responsiv bredd, touch-targets
3. `src/components/chat/ChatArea.tsx` -- tillbaka-knapp, mobilanpassade pickers
4. `src/components/chat/MessageBubble.tsx` -- long-press, responsiva bubblor
5. `src/components/chat/InfoPanel.tsx` -- Sheet-wrapping pa mobil
6. `src/components/chat/CommentsPanel.tsx` -- mobilanpassning
7. `src/components/chat/ContextMenu.tsx` -- bottom-sheet pa mobil
8. `src/components/chat/EmojiPicker.tsx` -- bottom-sheet pa mobil
9. `src/components/chat/GifPicker.tsx` -- bottom-sheet pa mobil
10. `src/components/chat/Modals.tsx` -- mobilanpassade modaler
11. `src/index.css` -- nya animations, safe-area, touch-styling

### Inga nya beroenden
Allt byggs med befintliga verktyg: Tailwind CSS responsiva klasser, `useIsMobile()` hook, och befintliga Sheet/Drawer-komponenter fran shadcn/ui.

