# Project TODO

This file mirrors the managed todo list and acts as the project's on-disk tracker. Keep this file updated as work progresses.

## Overall Checklist

- [x] Draft app outline & feature suggestions
- [-] Design core data model
  - Basic BeginnerRecipe type implemented
  - Need to add operations, parameters schema
- [-] Specify 3D generator algorithms
  - Basic cylinder holes working
  - Need CSG for proper Boolean operations
- [ ] Specify 2D drawing engine & ISO conventions
- [-] UI/UX and interactions
  - OrbitControls implemented
  - Basic Generate/Save UI working
  - Need view presets, 2D viewer
- [-] Persistence and export
  - localStorage bookmarks working
  - Need IndexedDB, PDF/SVG export
- [ ] Scoring, timer, and leaderboards
- [x] MVP roadmap and tech stack
  - React + Three.js + Vite implemented
  - Successfully deployed to Vercel
- [ ] Testing, validation, and documentation

## Notes
- The first item (high-level outline) was completed and is recorded in `README.md` and `docs/`.
- Use the `manage_todo_list` tool (or update this file) whenever you change task statuses so the in-memory and on-disk trackers stay in sync.
