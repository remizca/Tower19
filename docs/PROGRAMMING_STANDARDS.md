# Tower19 Programming Standards

This document defines the coding conventions for Tower19. It is tailored to our stack:

- TypeScript (strict) + React (function components)
- Three.js via @react-three/fiber and @react-three/csg
- Vite build tooling

Goals
- Readable, predictable, and type-safe code
- Small composable modules, minimal side-effects
- Deterministic generation (seeded RNG) for reproducibility
- Clear separation of concerns: types, generation, rendering, schema/validation, docs

## TypeScript

- Enable and respect strict typing. Avoid `any`; prefer precise types.
- Prefer `type` aliases for union/composition and `interface` for object shapes.
- Co-locate core domain types under `src/types/` (e.g., `src/types/part.ts`).
- Provide lightweight runtime guards where necessary (e.g., `isMinimalPartRecipe`).
- Avoid global ambient declarations. Keep types exported from modules.
- Prefer narrow function signatures. Validate inputs at module boundaries.

### Naming
- Files: kebab-case or lowerCamel for utilities (e.g., `svg.ts`, `validate.ts`).
- Types/Interfaces/Enums: PascalCase (e.g., `PartRecipe`, `PrimitiveKind`).
- Constants: UPPER_SNAKE_CASE when module-level and immutable.
- Functions/variables: lowerCamelCase.

### Modules and dependencies
- Keep imports explicit. Avoid deep default exports for shared utilities; prefer named exports.
- Group related exports in a single index if it improves ergonomics; avoid circular deps.

## React

- Use function components and React hooks. No class components.
- Component files: PascalCase `.tsx` (e.g., `App.tsx`, `ModelRenderer.tsx` if extracted later).
- Props interfaces are named `XxxProps` and exported if reused.
- Keep components focused; extract subcomponents when they exceed ~150 lines or mix concerns.
- Side effects in `useEffect` with dependency arrays; clean up subscriptions and disposables.
- Avoid prop drilling; consider context only if multiple siblings need shared state.

### Styling & UI
- Keep inline styles minimal for overlays/tooling. Prefer CSS modules or a light utility when styles grow.
- Ensure overlay controls have `pointer-events: auto` to remain interactive above the canvas.

## Three.js / @react-three/fiber / @react-three/csg

- Units: recipes are defined in millimetres (mm). Scene renders at decimetres (dm) using a fixed scale of `1 dm = 10 mm`.
  - Convert mm → dm at the renderer boundary (divide by 10 when passing geometry args or positions).
- CSG constraints:
  - Children of `@react-three/csg` `<Geometry>` must be direct geometry+material pairs.
  - Do not wrap brushes in `<group>` or additional nodes inside `<Geometry>`.
  - Apply transforms on the brush elements themselves: `<Addition position={...} rotation={...}>` / `<Subtraction ...>`.
- Rotation: currently axis-based orientation is supported via an `axis` parameter (`'x' | 'y' | 'z'`). Prefer explicit Euler (rx, ry, rz) as we extend recipes.
- Geometry tessellation: favor 32 radial segments for cylinders/cones and 24/48 for torus unless performance dictates otherwise.
- Materials: `meshStandardMaterial` with sensible defaults (metalness ~0.2, roughness ~0.6). Keep visuals consistent.

## Generators

- Strategy-based architecture. Each strategy is a pure function that takes a seed and returns a `PartRecipe`.
- Deterministic RNG only—no calls to `Math.random()` inside strategies. Use the seeded RNG provided.
- Enforce bounding constraints (`recipe.bounding_mm`); features must not extend outside bounds.
- Emit transforms for features via `tool.transform.position` and (soon) `rotation`/`scale`.
- Choose operations deliberately (`union`, `subtract`). Maintain a consistent primitive orientation convention:
  - Cylinders default oriented along +Z unless `axis` indicates otherwise.
  - Cones/frustums use `radiusTop`, `radiusBottom`, and `height` aligned to axis.
  - Torus `majorRadius`/`tubeRadius` with orientation controlled by axis.

## Schema & Validation

- Prefer lightweight runtime guards over heavy validators in the client bundle.
- Keep JSON schema assets (if needed) in `src/schema/` and avoid bundling large validators into the UI.

## Logging & Errors

- Use concise, tagged `console.log` during development (e.g., `[ModelRenderer] ...`).
- Do not spam logs in production; remove verbose traces once issues are resolved.
- Fail fast in generators when parameters are invalid; surface clear messages.

## Testing

- Put tests under `tests/`. Keep fixtures small and reusable.
- For generators, add variety tests verifying distribution/uniqueness across multiple seeds.
- Prefer deterministic snapshots or structural assertions over pixel tests for now.

## Commits & PRs

- Use clear, imperative commit messages. Conventional Commits are recommended:
  - feat, fix, docs, refactor, test, build, chore
- One logical change per commit. Include context in PR descriptions (screens, seeds, or diffs when relevant).

## Performance

- Keep bundle size in check: avoid heavy libs (e.g., Ajv in client). Split chunks via Vite as configured.
- Prefer lower geometry segment counts for preview; allow higher fidelity only if necessary.

## Security & Privacy

- No network calls or secret usage at runtime. App is fully client-side.
- Local storage only for bookmarks; plan IndexedDB migration for larger data.

