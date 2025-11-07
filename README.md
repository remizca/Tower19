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
- ✅ Interactive 3D viewer with OrbitControls
- ✅ Local bookmarking with localStorage (short-term)
- ✅ Deployed to Vercel
- ✅ CSG boolean subtraction for holes implemented (@react-three/csg)
- ✅ **NEW**: Procedural generator creates 6 varied part types (L-bracket, T-bracket, Cylinder, Stacked blocks, Corner bracket, Block-with-holes)
- ⚠️ **Blocked**: 2D SVG renderer needs robust edge visibility for varied geometry

Recent Progress (Nov 7, 2025)
- ✅ Expanded beginner generator to create varied shapes instead of just blocks with holes
- ✅ Implemented 6 different part generation strategies with 2-6 primitives each
- ✅ Created test fixtures for L-bracket, T-bracket, and cylinder-cutout shapes
- ✅ Verified variety with automated test (`npm run test:generator`)
- ✅ All shapes render correctly in 3D viewer

Known Issues
- 2D edge visibility classification incomplete (needs depth-buffer or ray-casting for general geometry)
- Production build has large JS chunk (~1 MB) — consider code-splitting heavy modules (CSG, Three.js)

Next steps (prioritized)
1. **[HIGH PRIORITY]** Implement robust edge visibility for 2D renderer
   - Use depth-buffer rasterization or ray-casting for occlusion detection
   - Test with all new varied shapes (L-bracket, T-bracket, cylinder, etc.)
   - Support both box and cylinder primitives
2. Add transformation support (rotation, scale) to generators
3. Create intermediate difficulty generator (5-8 primitives, patterns, fillets)
4. Migrate bookmarking/storage from localStorage to IndexedDB
5. Add timer functionality and local records storage
6. Add CI (GitHub Actions) that runs `npm run build` on PRs
7. Add comprehensive tests and example models

See `TODO.md` and `docs/` for project tracking and technical notes.
