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
- ✅ Local bookmarking with localStorage
- ✅ Deployed to Vercel

Next steps
1. Implement proper CSG Boolean operations for holes
2. Switch to IndexedDB for robust offline storage
3. Create 2D SVG drawing generator with ISO standards
4. Add timer functionality

See `TODO.md` and `docs/` for project tracking and technical notes.
