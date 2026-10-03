<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# PROJECT FOLD product rules

Keep every change aligned with these. They outrank convenience.

1. Reduce mental load.
2. Signal over noise.
3. Never turn Home into a widget dashboard.
4. Today = where people must be.
5. Needs Attention = exceptions requiring action.
6. Tomorrow = preparation, not another calendar.
7. Don't make users enter information twice.
8. Family members should see information appropriate to them.
9. Transportation is a core system.
10. External actions require deliberate approval.
11. AI proposes; humans approve.
12. Never sacrifice usability for visual decoration.
13. Large touch targets because this will run on wall-mounted tablets.
14. Avoid "mom planner" aesthetics.
15. Treat a household like an operation worthy of excellent software.

## Engineering conventions

- Persisted records use snake_case fields that map 1:1 to future Supabase columns (`src/lib/types.ts`). Every household-owned record has `household_id`.
- UI never touches storage directly: screens read via `useHousehold()` and write via `householdActions` (`src/lib/store`), which call the `HouseholdRepository` interface (`src/lib/data`). Swap the backend in `getRepository()` only.
- Home derives everything from household data through the Daily Brief engine (`src/lib/brief`). Never add separate mock data for Home. Rules are deterministic and unit-tested.
- Transportation timing lives in `src/lib/brief/transport.ts` — change the commitment-window model there, not in UI.
- Before finishing: `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`.
