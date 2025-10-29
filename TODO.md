# Project TODO

This file mirrors the managed todo list and acts as the project's on-disk tracker. Keep this file updated as work progresses.

## Overall Checklist

- [x] Draft app outline & feature suggestions
 - [x] Design core data model
  - PartRecipe TypeScript types added (`src/types/part.ts`)
  - JSON Schema added (`docs/schema/part-recipe.schema.json`)
  - Migration helper from legacy BeginnerRecipe implemented (`src/storage/migrate.ts`)
  - Runtime validation with Ajv available (`src/schema/validate.ts`)
 - [-] Specify 3D generator algorithms
  - Basic cylinder holes working
  - CSG boolean subtraction implemented (see App.tsx using @react-three/csg)
- [ ] Specify 2D drawing engine & ISO conventions
- [-] UI/UX and interactions
  - OrbitControls implemented
  - Basic Generate/Save UI working
  - Need view presets, 2D viewer
 - [-] Persistence and export
  - localStorage bookmarks working (temporary)
  - Migration to IndexedDB planned; PDF/SVG export pending
- [ ] Scoring, timer, and leaderboards
- [x] MVP roadmap and tech stack
  - React + Three.js + Vite implemented
  - Successfully deployed to Vercel
- [ ] Testing, validation, and documentation

## Notes
- The first item (high-level outline) was completed and is recorded in `README.md` and `docs/`.
- Use the `manage_todo_list` tool (or update this file) whenever you change task statuses so the in-memory and on-disk trackers stay in sync.
