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

Next steps
1. Create project scaffold (React + TypeScript + Three.js)
2. Implement beginner generator and 3D viewer
3. Implement 2D SVG drawing export and PDF generation

See `TODO.md` and `docs/` for project tracking and technical notes.
