# Tower19 Project Structure

This guide explains the repository layout, naming conventions, and where new code should live.

## Top-level layout

- `src/` — Application source code
- `tests/` — Tests and fixtures
- `docs/` — Project documentation (standards, specs, progress)
- `dist/` — Production build output (generated)
- `index.html` — Vite entry
- `vite.config.ts` — Vite configuration (manualChunks, build opts)
- `vercel.json` — Deployment config
- `tsconfig.json`, `tsconfig.node.json` — TypeScript configs
- `README.md`, `CHANGELOG.md`, `TODO.md` — Repo docs

## `src/` overview

- `src/App.tsx` — Main React app shell and 3D scene composition
- `src/generators/` — Procedural part generators
  - `beginner.ts` — Beginner-level strategy functions producing `PartRecipe`
- `src/types/` — Domain types and runtime guards
  - `part.ts` — `PartRecipe`, primitive params (box, cylinder, sphere, cone, torus)
- `src/schema/` — Lightweight runtime validation
  - `validate.ts` — `validatePartRecipe` using `isMinimalPartRecipe`
- `src/drawing/` — 2D SVG renderer (orthographic projection and visibility)
  - `svg.ts` — Initial projection work; depth-buffer occlusion planned
- `src/storage/` — Persistence helpers
  - `migrate.ts` — Migration for legacy localStorage formats

If you add new modules, prefer grouping by domain (types, generators, drawing, schema, storage) rather than by layer.

## Naming conventions

- React components: PascalCase filenames with `.tsx` (e.g., `ModelPanel.tsx`).
- Utilities and modules: lowerCamelCase or kebab-case `.ts` (e.g., `rng.ts`, `depth-buffer.ts`).
- Tests: mirror source names where possible (e.g., `tests/generator-variety.test.ts`).

## Where to put new code

- New generator strategies:
  - Start in `src/generators/beginner.ts` if beginner-level.
  - If a strategy grows, extract to `src/generators/strategies/<strategy-name>.ts` and re-export from `beginner.ts`.
  - Shared util functions (e.g., seeded RNG, placement helpers) go to `src/generators/utils.ts` (create if not present).
- New primitives or params:
  - Extend types in `src/types/part.ts` and update renderer handling in `src/App.tsx`.
- Transforms and placement:
  - Emit `tool.transform.position` (mm) and orientation (`axis` for now; later `rotation` as Euler angles) from generators.
  - The renderer scales to dm and passes transforms directly to `<Addition>`/`<Subtraction>`.
- 2D drawing engine:
  - Projection, visibility, and dimensioning modules belong in `src/drawing/`.
  - Consider `src/drawing/visibility/` (e.g., `depth-buffer.ts`, `raycast.ts`) as it evolves.
- Validation and schemas:
  - Runtime guards in `src/schema/` to keep the client bundle lean.
- Storage:
  - Client-side bookmarks in `src/storage/`; future IndexedDB helpers can live here.

## CSG Composition Rules

- Use `@react-three/csg` with the following constraints:
  - Children of `<Geometry>` must be direct geometry+material pairs.
  - Do not add `<group>` wrappers inside `<Geometry>`.
  - Apply transforms on `Addition`/`Subtraction` components (props: `position`, `rotation`).

## Units & Scaling

- Domain units are millimetres (mm).
- Rendering units are decimetres (dm); divide mm values by 10 when passing to geometry args or transforms.
- Keep this conversion localized to the renderer to avoid unit confusion elsewhere.

## Testing

- Place tests under `tests/` and fixtures under `tests/fixtures/`.
- Prefer deterministic tests (seeded RNG). Limit geometry-heavy tests to structural assertions.

## Documentation

- Centralize markdown docs in `docs/`.
  - Standards: `docs/PROGRAMMING_STANDARDS.md`
  - Structure: `docs/PROJECT_STRUCTURE.md`
  - Progress/specs: under `docs/progress/` and `docs/specs/`

