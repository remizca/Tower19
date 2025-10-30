# 3D Generator Algorithms (design)

This document specifies the generator algorithms, heuristics, and constraints used to procedurally create practice parts at different difficulty levels. It is intended both as a design reference and as a step-by-step blueprint for implementing deterministic (seeded) generators that output the canonical `PartRecipe` model.

## Goals and constraints
- Deterministic: generation must be fully reproducible from the `seed`.
- Manufacturability: generated parts should be plausible (no zero-thickness walls, reasonable radii, etc.).
- Visual clarity: parts should display well in the 3D viewer and produce meaningful 2D orthographic drawings.
- Complexity scale: difficulty should map to a measurable increase in feature count, nested Boolean operations, asymmetry, and geometry variety.
- Performance budget: generator must run client-side quickly (target < 100–300 ms for Beginner, < 1s for higher levels). Complex boolean evaluations should be limited and optionally deferred to worker threads.

## Core building blocks
- Primitives: `box`, `cylinder`, `sphere`, `custom` (extra geometry such as extrusions or chamfers can be represented as `custom` with param details). All params expressed in millimetres.
- Operations: ordered boolean ops (`union`, `subtract`, `intersect`) that reference primitives or prior operations by id.
- Transforms: `position`, `rotation` (Euler degrees), `scale`.
- Metadata: semantic tags (e.g., `hole`, `boss`, `pocket`, `through-hole`) to help 2D drawing and scoring.

## RNG and reproducibility
- Use a small, platform-independent PRNG (LCG or xorshift) seeded with the recipe `seed`.
- All random decisions derive from this PRNG: difficulty branching, counts, sizes, positions, axis choices.

## High-level generation pipeline
1. Choose difficulty (Beginner / Intermediate / Expert).
2. Decide a nominal bounding box (width, depth, height) from difficulty-based ranges.
3. Create a base primitive (usually a centered `box`) sized to the bounding box.
4. Sample a sequence of feature intents (holes, pockets, bosses, cuts, through-slots). The count and diversity depend on difficulty.
5. For each feature intent:
   - Pick a primitive kind and parameters within safe ranges (see heuristics below).
   - Choose a placement: sample coordinates within the bounding box but respect margins (keep a safe distance from edges and other features).
   - If a feature represents a `cutter` (hole, pocket), create a primitive for the tool and emit a `subtract` operation that references the base (or latest union) object.
   - If a feature is additive (boss, rib), create a primitive and emit a `union` operation.
6. After all features are placed, run a simple sanity pass: check wall thickness, remove or shrink features that violate constraints, and clamp values.
7. Produce the final `PartRecipe` (primitives + ordered operations). Optionally compute a simplified preview bounding box and metadata metrics (feature count, estimated drawing views needed).

## Difficulty-specific heuristics

Beginner
- Bounding box ranges: width 50–200 mm, depth 20–150 mm, height 10–150 mm.
- Feature count: 1–3 features (mostly through-holes or simple pockets).
- Allowed operations: single-level `subtract` (holes) and occasional `union` (simple bosses).
- Placement: features centered or offset modestly; avoid overlapping features; keep margins >= 5–10 mm.
- Sizes: hole radii 2–min(15, min(width, depth)/6).

Intermediate
- Bounding box ranges: similar but variable aspect ratios to increase arrangement complexity.
- Feature count: 3–6 features; can include countersinks, blind pockets, and ribs.
- Operations: nested sequences (e.g., subtract pocket then add boss), limited intersections.
- Placement: allow closer proximity, controlled overlaps resolved by CSG ordering.
- Sizes: introduce non-through features (blind pockets) with depths < height.

Expert
- Higher variance in bounding box and features; include loft-like or `custom` primitives, multiple intersecting operations, and asymmetry.
- Feature count: 6+ features, multi-stage CSG trees, thin ribs, and complex cutouts.
- Increased chance of nontrivial intersections; robust collision resolution and fallback simplification must run (see safety rules).

## Placement and collision rules
- Maintain a margin (M) from part faces for any tool primitive: M = max(2 mm, minDimension * 0.02).
- When sampling candidate placement, test against existing tool bounding spheres/boxes. If overlap and overlap is disallowed (e.g., two through-holes crossing where walls would be too thin), try up to N retries (N=8). If still colliding, alter size or choose different placement.
- For allowed overlaps that should result in combined features, prefer to emit separate cutter primitives but leave Boolean order to merge (subtractions on the same target will naturally combine).

## Ordering and operation strategy
- Order matters. General safe ordering:
  1. Subtract through-hole cutters that must remove material first (ensures holes are full depth when rendering/exporting).
  2. Subtract pockets (blind) next.
  3. Union bosses/ribs to add material.
  4. Intersection operations last for trimming.
- For stability, group operations by type and prefer to apply smaller, high-priority cutters earlier.

## Safety and simplification
- Minimum wall thickness: enforce a minimum W_min = 1.5–2.0 mm. If an operation would yield thinner walls, either reduce cutter size or skip the operation.
- Maximum feature aspect ratio: avoid extremely thin features that create degeneracies in CSG.
- Retry and fallback: if a boolean op fails or produces invalid geometry (detected via renderer or BVH), try: (1) shrink tool, (2) reposition, (3) drop operation.

## Export and 2D drawing considerations
- Tag feature intents with semantic labels (`hole`, `pocket`, `boss`) to simplify 2D dimensioning rules.
- For orthographic drawing generation, ensure pragma for through vs blind features: through-holes get centerlines and through-symbols; blind pockets will get depth callouts.
- Keep geometry axis-aligned whenever possible to simplify 2D projections and avoid slanted surfaces for Beginner difficulty.

## Complexity scoring (optional)
- Use simple metrics to quantify difficulty and scoring:
  - Feature count
  - Nesting depth of operations (CSG tree depth)
  - Number of unique primitive kinds
  - Aspect ratio extremes

## Performance & implementation notes
- Keep the heavy CSG work controlled: synthesize primitive geometry at coarse levels for preview; full-precision CSG only for final render/export.
- Consider lazy/worker-based CSG with optimistic UI: show base + tool primitives while computing final boolean result.
- Libraries and tooling recommendations:
  - Three.js for geometry and rendering (already in use).
  - @react-three/csg for R3F-level CSG orchestration (already added).
  - three-bvh-csg or gkjohnson/three-bvh-csg if heavy CSG performance is needed for complex models.
  - three-mesh-bvh for raycasting/validations and spatial queries.
  - Ajv for runtime schema validation (already available).

## Data model mapping (quick reference)
- Create base box as `Primitive {kind: 'box'}`.
- For each hole: add `Primitive {kind: 'cylinder'}` and `Operation {op: 'subtract', targetId: baseId, toolId: cylinderId}`.
- For additive features: add `Primitive` then `Operation {op: 'union', targetId: baseOrLast, toolId: primId}`.

## Testing checklist
- Unit tests: deterministic outputs for a set of fixed seeds (particle snapshots in `tests/fixtures`).
- Property-based tests: verify invariants (no negative sizes, minimum wall thickness, valid JSON Schema) across randomized seeds.
- Integration: visual smoke tests rendering small set of seeds and snapshotting canvases or GLTF exports.

---

This design provides a concrete blueprint for implementing the generator logic and maps directly to the `PartRecipe` model. If you want, I can next:

1. Implement these rules in `src/generators/beginner.ts` (replace the legacy holes-only shape with the multi-primitive/operation generator), and add tests/fixtures.
2. Add a worker-based CSG path and lazy finalization for complex recipes.

Which implementation step should I take next?
