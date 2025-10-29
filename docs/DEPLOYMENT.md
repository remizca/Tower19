# Deployment Strategy

## Overview
Tower19 is designed as a web-first application, deployable to Vercel directly from GitHub with zero installation required for end users.

## Technical Architecture
- **Frontend Only (Phase 1)**
  - React + TypeScript + Three.js
  - Vite build system (fast, modern, great Vercel integration)
  - All processing done client-side
  - No backend required for MVP

## Data Flow
1. **3D Generation**
   - All geometry generation happens in the browser
   - Three.js + CSG operations for model creation
   - Deterministic generation from seeds

2. **Storage**
   - IndexedDB for local persistence
   - Bookmarks and times stored locally
   - Works offline (PWA capabilities)

3. **Export Pipeline**
   - SVG generation in-browser
   - PDF conversion client-side
   - All files downloadable directly

## Deployment Pipeline
1. **GitHub**
   - Source code repository
   - Main branch = production
   - Preview deployments on PRs

2. **Vercel Integration**
   - Auto-deploys from GitHub
   - Edge Network CDN
   - Zero-config static hosting

3. **Build Process**
   ```json
   // package.json
   {
     "scripts": {
       "dev": "vite",
       "build": "tsc && vite build",
       "preview": "vite preview"
     }
   }
   ```

## Future Considerations
- Optional API routes (Vercel Serverless Functions) for:
  - STEP file export (Phase 2+)
  - Cloud saves (Phase 2+)
  - Leaderboards (Phase 2+)

## Repository Structure
```
tower19/
├── src/
│   ├── components/
│   ├── generators/
│   ├── viewers/
│   └── exporters/
├── public/
├── index.html
├── package.json
├── vite.config.ts
└── vercel.json (when needed)
```

## Development Setup
1. Clone repository
2. Install dependencies: `npm install`
3. Start dev server: `npm run dev`
4. Build: `npm run build`

## Deployment Steps
1. Push to GitHub
2. Vercel automatically builds and deploys
3. Available globally via Vercel's CDN

## Phase 1 Requirements
- Modern browser with WebGL support
- No backend dependencies
- All computation client-side
- Works offline after initial load