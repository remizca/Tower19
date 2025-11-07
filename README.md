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
- ✅ Local bookmarking with localStorage
- ✅ **Deployed to Vercel and working in production**
- ✅ CSG boolean operations (subtraction and union) working with @react-three/csg
- ✅ Procedural generator creates 12 varied part types using multiple strategies
  - Box, cylinder, sphere, cone (frustum), and torus primitives supported
  - Feature strategies: Spherical pockets, countersinks, torus cutouts, angled holes, linear/circular patterns
  - Structural strategies: L-bracket, T-bracket, Cylinder-cutouts, Stacked blocks, Corner bracket, Block-with-holes
  - Full transform support: position, rotation (Euler angles), and scale
- ✅ Build optimizations: manual chunk splitting, reduced bundle size
- ⚠️ **Blocked**: 2D SVG renderer needs robust edge visibility for varied geometry

Recent Progress (Nov 7, 2025)
- ✅ **Fixed production deployment**: Resolved Vercel build errors and blank page issue
- ✅ **Fixed 3D rendering**: Removed invalid CSG structure (group wrappers) causing blank canvas
- ✅ Added sphere, cone (frustum), and torus primitive support to generator and renderer
- ✅ Expanded beginner generator from 6 to 12 strategies with new primitive types and patterns
- ✅ Build optimizations: replaced Ajv with lightweight validator, manual chunk splitting
- ✅ Created test fixtures and variety validation tests
- ✅ **Full transform support**: Implemented rotation (Euler angles) and scale in renderer and generator
- ✅ **Pattern generators**: Linear and circular hole patterns using position transforms

Known Issues
- 2D SVG renderer edge visibility incomplete (needs depth-buffer or ray-casting)
- Need to add intermediate and expert difficulty generators

Next steps (prioritized)
1. **[HIGH PRIORITY]** Implement robust edge visibility for 2D renderer
   - Use depth-buffer rasterization or ray-casting for occlusion detection
   - Test with all primitive types and varied shapes
2. Create intermediate difficulty generator (5-8 primitives, more complex patterns, fillets)
3. Migrate bookmarking/storage from localStorage to IndexedDB
4. Migrate bookmarking/storage from localStorage to IndexedDB
5. Add timer functionality and local records storage
6. Add CI (GitHub Actions) that runs `npm run build` on PRs
7. Add comprehensive tests and example models

See `TODO.md` and `docs/` for project tracking and technical notes.
