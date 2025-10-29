# Tower19 — Procedural CAD Practice Generator

Lightweight web app to procedurally generate 3D practice parts (in millimetres), present an interactive 3D viewer, and produce ISO-compliant 2D CAD drawings (orthographic views + optional sections). The app is intended as a training aid for CAD users who want random part practice to rebuild in Fusion 360, Inventor, SolidWorks, or similar.

Key features
- Procedural 3D models with deterministic seeds and difficulty levels (Beginner / Intermediate / Expert)
- Interactive 3D inspection (orbit/pan/zoom) using Three.js
- Generate ISO-style orthographic 2D drawings (Front/Top/Right) in mm, with dimensioning and title block
- Optional section views and hatch patterns for internal features
- Timer starts when the 2D drawing is viewed; users can save completion times
- Bookmark/save generated parts locally (IndexedDB) and export PDFs/SVGs for practice

Deployment
- Intended to deploy as a static web app (Vercel recommended) so users can access it without installation.

Current Status
- ✅ Project scaffold with React + TypeScript + Three.js + Vite
- ✅ Basic beginner generator (blocks with cylinder holes)
- ✅ Interactive 3D viewer with OrbitControls
- ✅ Local bookmarking with localStorage (short-term)
- ✅ Deployed to Vercel
- ✅ CSG boolean subtraction for holes implemented (@react-three/csg)

Notes from the recent test run
- Production build completed successfully. There is a large JS chunk (~1 MB) flagged by Rollup — we should consider code-splitting heavy modules (CSG, Three.js) to reduce initial bundle size.

Next steps (prioritized)
1. Migrate bookmarking/storage from localStorage to IndexedDB and provide a migration path for existing bookmarks
2. Implement 2D SVG drawing generator (ISO-compliant orthographic views, dimensioning, title block)
3. Add timer functionality and local records storage (start when viewing 2D drawing)
4. Add CI (GitHub Actions) that runs `npm run build` on PRs
5. Add tests, documentation and small example models

See `TODO.md` and `docs/` for project tracking and technical notes.
