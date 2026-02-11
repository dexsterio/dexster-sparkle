

# Use Dexster Logo SVG in Sidebar

## Overview
Replace the current gradient "D" placeholder in the sidebar header with the actual Dexster logo SVG that was uploaded.

## Changes

### 1. Copy Logo to Project
Copy `user-uploads://1.svg` to `src/assets/dexster-logo.svg`

### 2. Update Sidebar Header (`src/components/chat/Sidebar.tsx`)
- Import the SVG: `import dexsterLogo from '@/assets/dexster-logo.svg'`
- Replace the gradient "D" div (line 162) with an `<img>` tag using the imported logo
- Size it to match the current 32x32px slot

**Before:**
```text
<div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-primary-foreground font-bold text-sm">D</div>
```

**After:**
```text
<img src={dexsterLogo} alt="Dexster" className="w-8 h-8" />
```

### Files Modified
1. `src/assets/dexster-logo.svg` (new -- copied from upload)
2. `src/components/chat/Sidebar.tsx` (import + replace logo element)

