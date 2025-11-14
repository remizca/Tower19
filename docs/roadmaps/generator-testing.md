# Generator Testing Checklist

**Document Version**: 1.0  
**Date**: November 8, 2025  
**Source**: Extracted from `docs/generators/algorithms.md`  
**Purpose**: Testing strategy and checklist for 3D part generators

## Overview

This checklist defines the testing approach for the procedural part generation system, covering unit tests, property-based tests, integration tests, and visual validation.

---

## Testing Strategy

### 1. Unit Tests: Deterministic Outputs ✅ IN PROGRESS

**Goal**: Verify that fixed seeds produce consistent, expected outputs

**Approach**:

- Create fixture files with known seeds
- Generate parts from fixtures
- Assert specific properties (primitive counts, dimensions, operations)
- Use snapshot testing for recipe JSON

**Status**: ✅ Implemented

- Created fixtures in `tests/fixtures/`:
  - `block-hole.ts` - Simple block with holes
  - `l-bracket.ts` - L-shaped bracket
  - `t-bracket.ts` - T-shaped bracket  
  - `cylinder-cutout.ts` - Cylinder with box cutouts
- Verification test confirms variety: `npm run test:generator`

**Test Files**:

```text
tests/
  fixtures/
    block-hole.ts          ✅ Created
    l-bracket.ts           ✅ Created
    t-bracket.ts           ✅ Created
    cylinder-cutout.ts     ✅ Created
  generators/
    beginner.test.ts       ⏳ TODO
    intermediate.test.ts   ⏳ TODO
```

**Example Test Case**:

```typescript
describe('Beginner Generator', () => {
  it('should generate block-hole fixture consistently', () => {
    const seed = 12345;
    const recipe = generateBeginnerPart(seed);
    
    expect(recipe.primitives).toHaveLength(2); // base + hole
    expect(recipe.operations).toHaveLength(1); // subtract
    expect(recipe.primitives[0].kind).toBe('box');
    expect(recipe.primitives[1].kind).toBe('cylinder');
  });
});
```

---

### 2. Property-Based Tests ⏳ TODO

**Goal**: Verify invariants across randomized seeds

**Properties to Test**:

#### Geometric Invariants

- [ ] No negative dimensions (width, height, depth > 0)
- [ ] Minimum wall thickness maintained (>= 1mm)
- [ ] Bounding box contains all primitive positions
- [ ] Hole positions within base primitive bounds
- [ ] Pattern spacing prevents overlap

#### Recipe Invariants

- [ ] Valid JSON Schema (passes Ajv validation)
- [ ] All primitive IDs unique
- [ ] All operation references valid (target/tool IDs exist)
- [ ] Operations graph is acyclic (no circular dependencies)
- [ ] At least one base primitive (union/base operation)

#### Difficulty Level Invariants

- [ ] Beginner: 2-4 primitives, 1-3 operations
- [ ] Intermediate: 5-8 primitives, 4-7 operations
- [ ] Advanced: 9-15 primitives, 8-14 operations

**Example Property Test**:

```typescript
import fc from 'fast-check';

describe('Generator Properties', () => {
  it('should always generate valid recipes', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 1000000 }), (seed) => {
        const recipe = generateBeginnerPart(seed);
        
        // Property 1: Valid schema
        expect(validatePartRecipe(recipe).valid).toBe(true);
        
        // Property 2: No negative dimensions
        expect(recipe.bounding_mm.x).toBeGreaterThan(0);
        expect(recipe.bounding_mm.y).toBeGreaterThan(0);
        expect(recipe.bounding_mm.z).toBeGreaterThan(0);
        
        // Property 3: Unique IDs
        const ids = recipe.primitives.map(p => p.id);
        expect(new Set(ids).size).toBe(ids.length);
      })
    );
  });
});
```

**Testing Library**:

- Use `fast-check` for property-based testing
- Run with many iterations (1000+ seeds)
- Shrink failures to minimal reproducible case

---

### 3. Integration Tests: Visual Validation ⏳ TODO

**Goal**: Verify that generated parts render correctly and look reasonable

**Approach**:

- Generate parts from test seeds
- Render to canvas using Three.js
- Capture screenshots or GLTF exports
- Compare against known-good baselines

**Test Cases**:

#### Smoke Tests

- [ ] Generate and render beginner parts (seeds 1-10)
- [ ] Generate and render intermediate parts (seeds 100-110)
- [ ] Generate and render advanced parts (seeds 1000-1010)
- [ ] Verify no Three.js errors or warnings
- [ ] Verify CSG operations complete successfully

#### Visual Regression Tests

- [ ] Capture canvas screenshots for reference seeds
- [ ] Store baselines in `tests/visual-baselines/`
- [ ] Compare new renders against baselines
- [ ] Flag significant visual differences

#### Export Tests

- [ ] Export to GLTF and verify file validity
- [ ] Export to SVG drawing and verify structure
- [ ] Export to STL and verify mesh integrity

**Example Integration Test**:

```typescript
describe('Visual Integration', () => {
  it('should render block-hole without errors', async () => {
    const recipe = generateBeginnerPart(12345);
    const { scene, camera, renderer } = setupThreeJS();
    
    // Build and render
    const mesh = await buildRecipeGeometry(recipe);
    scene.add(mesh);
    renderer.render(scene, camera);
    
    // Verify rendering
    expect(scene.children).toHaveLength(1);
    expect(mesh.geometry.attributes.position.count).toBeGreaterThan(0);
  });
  
  it('should export valid GLTF', async () => {
    const recipe = generateBeginnerPart(12345);
    const gltf = await exportToGLTF(recipe);
    
    expect(gltf).toBeDefined();
    expect(gltf.asset.version).toBe('2.0');
    expect(gltf.scenes).toHaveLength(1);
  });
});
```

---

## Test Coverage Goals

### Minimum Coverage (Phase 1) ✅

- ✅ At least 4 fixture types created
- ✅ Generator verification test passes
- [ ] Unit tests for each generator difficulty level

### Target Coverage (Phase 2) ⏳

- [ ] 80%+ code coverage for generator logic
- [ ] Property-based tests running with 1000+ iterations
- [ ] Visual regression baselines for 30+ reference parts

### Ideal Coverage (Phase 3) 🔮

- [ ] 90%+ code coverage including edge cases
- [ ] Property-based tests cover all invariants
- [ ] Visual regression tests integrated into CI/CD
- [ ] Performance benchmarks for generation time

---

## Test Data and Fixtures

### Existing Fixtures ✅

1. **block-hole.ts** - Simple block with centered hole
   - Seed: 12345
   - Primitives: Box + Cylinder
   - Operations: 1 subtraction
   - Tests: Basic hole drilling

2. **l-bracket.ts** - L-shaped bracket
   - Seed: 23456
   - Primitives: 2 Boxes
   - Operations: 1 union
   - Tests: Multi-primitive assembly

3. **t-bracket.ts** - T-shaped bracket
   - Seed: 34567
   - Primitives: 3 Boxes
   - Operations: 2 unions
   - Tests: Complex assembly

4. **cylinder-cutout.ts** - Cylinder with cutouts
   - Seed: 45678
   - Primitives: Cylinder + 2 Boxes
   - Operations: 2 subtractions
   - Tests: Subtractive features

### Needed Fixtures ⏳

- [ ] Block with chamfered edges
- [ ] Block with filleted edges
- [ ] Part with radial pattern (bolt holes)
- [ ] Part with linear pattern
- [ ] Part with internal pocket
- [ ] Symmetric mounting plate
- [ ] Complex assembly (8+ primitives)

---

## Testing Tools and Libraries

### Current Stack ✅

- **Vitest**: Test runner
- **@testing-library/react**: Component testing
- **Three.js**: 3D rendering
- **Ajv**: JSON Schema validation

### Recommended Additions ⏳

- [ ] **fast-check**: Property-based testing
- [ ] **jest-image-snapshot**: Visual regression
- [ ] **pixelmatch**: Image comparison
- [ ] **three-mesh-bvh**: Geometry validation
- [ ] **gltf-validator**: GLTF export validation

---

## Running Tests

### Unit Tests

```bash
npm run test              # Run all tests
npm run test:unit         # Unit tests only
npm run test:watch        # Watch mode
npm run test:coverage     # With coverage report
```

### Generator Verification

```bash
npm run test:generator    # Verify generator variety
```

### Visual Tests (Future)

```bash
npm run test:visual       # Visual regression tests
npm run test:visual:update # Update baselines
```

---

## Test Checklist Summary

### Immediate (Phase 1) ⏳

- ✅ Create test fixtures (4+ types)
- [ ] Unit tests for beginner generator
- [ ] Unit tests for intermediate generator
- [ ] Schema validation tests
- [ ] Basic rendering smoke tests

### Short-term (Phase 2) ⏳

- [ ] Property-based tests (geometric invariants)
- [ ] Property-based tests (recipe invariants)
- [ ] Property-based tests (difficulty constraints)
- [ ] Visual regression baselines
- [ ] GLTF export validation
- [ ] Performance benchmarks

### Long-term (Phase 3) 🔮

- [ ] Advanced fixture coverage (10+ types)
- [ ] Comprehensive property testing (all invariants)
- [ ] CI/CD integration for visual tests
- [ ] Fuzzing for edge cases
- [ ] Load testing (1000+ simultaneous generations)

---

## Success Metrics

### Test Quality

- All tests pass on main branch
- No flaky tests (consistent results)
- Fast test execution (<30s for unit tests)
- Clear failure messages

### Coverage

- 80%+ code coverage for generator logic
- 100% coverage for core algorithms
- All difficulty levels tested
- All primitive types tested

### Reliability

- Property tests run 1000+ iterations without failure
- Visual tests detect regressions
- Generated parts always validate against schema
- No runtime errors during generation

---

## Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Nov 8, 2025 | Initial checklist extracted from algorithms.md |

---

**Related Documents**:

- `docs/generators/algorithms.md` - Generator algorithms
- `docs/progress/generator-variety.md` - Implementation details
- `TODO.md` - Active task list
