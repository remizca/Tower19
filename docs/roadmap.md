# Roadmap

This document contains a high-level roadmap for Tower19: prioritized phases from MVP to advanced features.

## Phase 1 — MVP (minimum viable product)
- Random 3D generator (Beginner + Intermediate difficulty)
- Three.js 3D viewer with orbit controls and preset views
- SVG-based orthographic drawing generation (Front/Top/Right)
- Basic automatic dimensioning (overall envelope + hole sizes) in mm
- Title block with: part name, seed, difficulty, units (mm)
- Timer that starts when 2D drawing is viewed; save local times
- Local bookmarking using IndexedDB; open saved parts
- Export: SVG and PDF (SVG->PDF pipeline)

## Phase 2 — Advanced features
- Expert difficulty generator (splines, lofts, complex cuts)
- Automatic section view generation for parts with internal cavities
- Improved ISO-compliant line weights, hidden-line rendering, and hatching
- DXF export (2D) and optional STEP export (3D) via a server-side service
- Leaderboards and optional user accounts

## Phase 3 — Polishing & integrations
- Guided practice mode, curated packs, and scoring/gamification
- Desktop/Electron build and PWA improvements
- Fusion 360 script generator or macro export to accelerate recreation

## Notes
- Prioritize client-only implementations for Phase 1 to enable Vercel static hosting.
