# PROJECT FOLD

A household operations system: take in the mess, organize it, surface what matters, coordinate the family.

**Status:** build phases 1–4 (foundation, Home, Family, event engine). Demo data lives in the browser (localStorage); no external services.

## Run

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # brief engine + calendar layout unit tests
npm run typecheck && npm run lint && npm run build
```

Settings → **Reset demo data** restores the sample household. Untouched demo data regenerates daily so Today/Tomorrow stay realistic.

## Structure

```
src/
  app/                    routes (Home, Family, Calendar, placeholders, Settings)
  components/
    home/                 Today timeline, Needs Attention, Tomorrow brief
    calendar/             Day / Week / Family views, time grid
    events/               shared event editor (opened from anywhere)
    family/               overview, profile, add/edit form
    shell/                navigation (sidebar ≥1024px, drawer below)
    ui/                   buttons, cards, form controls, sheet
  lib/
    types.ts              domain model (Supabase-shaped)
    data/                 HouseholdRepository interface + localStorage impl
    store/                client store shared by all screens
    brief/                Daily Brief engine + transportation primitives
    calendar/             lane layout + filtering
    mock/seed.ts          demo household (2 parents, 8 children)
```

See `AGENTS.md` for product rules and conventions.
