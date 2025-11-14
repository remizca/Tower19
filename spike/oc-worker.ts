// OpenCascade Web Worker - runs OCCT in background thread

let oc: any = null;
let initPromise: Promise<any> | null = null;

// Shape registry for persistent shape references
const shapeRegistry = new Map<string, any>();

// Message types for worker communication
type WorkerRequest = 
  | { id: string; type: 'init' }
  | { id: string; type: 'makeBox'; params: { shapeId: string; w: number; h: number; d: number } }
  | { id: string; type: 'makeCylinder'; params: { shapeId: string; r: number; h: number } }
  | { id: string; type: 'makeSphere'; params: { shapeId: string; radius: number } }
  | { id: string; type: 'makeCone'; params: { shapeId: string; radius1: number; radius2: number; height: number } }
  | { id: string; type: 'makeTorus'; params: { shapeId: string; majorRadius: number; minorRadius: number } }
  | { id: string; type: 'booleanCut'; params: { resultId: string; baseId: string; toolId: string } }
  | { id: string; type: 'booleanFuse'; params: { resultId: string; shapes: string[] } }
  | { id: string; type: 'fillet'; params: { resultId: string; baseId: string; radius: number } }
  | { id: string; type: 'triangulate'; params: { shapeId: string; deflection?: number } }
  | { id: string; type: 'extractEdges'; params: { shapeId: string; viewDirection: { x: number; y: number; z: number } } };

type WorkerResponse = 
  | { id: string; type: 'init'; success: true; initMs: number }
  | { id: string; type: 'init'; success: false; error: string }
  | { id: string; type: 'triangulate'; success: true; result: { vertices: Float32Array; indices: Uint32Array; normals: Float32Array } }
  | { id: string; type: 'extractEdges'; success: true; result: { edges: any[] } }
  | { id: string; success: true; result: any }
  | { id: string; success: false; error: string };

// Initialize OpenCascade (called once)
async function ensureInit(): Promise<void> {
  if (oc) {
    console.log('[Worker] Already initialized, skipping');
    return;
  }
  if (initPromise) {
    console.log('[Worker] Init already in progress, waiting...');
    await initPromise;
    return;
  }

  console.log('[Worker] Starting initOpenCascade()...');
  initPromise = (async () => {
    const start = performance.now();
    // @ts-ignore - opencascade.js dynamic import
    const { initOpenCascade } = await import('opencascade.js');
    oc = await initOpenCascade();
    const initMs = performance.now() - start;
    console.log(`[Worker] initOpenCascade() completed in ${initMs.toFixed(0)}ms`);
    return initMs;
  })();

  await initPromise;
}

// Helper: Try different MakeBox overloads
function makeBox(w: number, h: number, d: number) {
  if (oc.BRepPrimAPI_MakeBox_1) return new oc.BRepPrimAPI_MakeBox_1(w, h, d);
  if (oc.BRepPrimAPI_MakeBox_2) {
    try {
      return new oc.BRepPrimAPI_MakeBox_2(w, h, d, 0);
    } catch {
      return new oc.BRepPrimAPI_MakeBox_2(0, 0, 0, w, h, d);
    }
  }
  throw new Error('MakeBox overloads not found');
}

// Helper: Try different MakeCylinder overloads
function makeCylinder(r: number, h: number) {
  if (oc.BRepPrimAPI_MakeCylinder_1) return new oc.BRepPrimAPI_MakeCylinder_1(r, h);
  if (oc.BRepPrimAPI_MakeCylinder_2) {
    const axis = new oc.gp_Ax2_2(
      new oc.gp_Pnt_3(0, 0, 0),
      new oc.gp_Dir_4(0, 0, 1),
      new oc.gp_Dir_4(1, 0, 0)
    );
    return new oc.BRepPrimAPI_MakeCylinder_2(axis, r, h);
  }
  throw new Error('MakeCylinder overloads not found');
}

// Helper: Make sphere
function makeSphere(radius: number) {
  if (oc.BRepPrimAPI_MakeSphere_1) return new oc.BRepPrimAPI_MakeSphere_1(radius);
  if (oc.BRepPrimAPI_MakeSphere_5) {
    const center = new oc.gp_Pnt_3(0, 0, 0);
    return new oc.BRepPrimAPI_MakeSphere_5(center, radius);
  }
  throw new Error('MakeSphere overloads not found');
}

// Helper: Make cone (frustum)
function makeCone(radius1: number, radius2: number, height: number) {
  if (oc.BRepPrimAPI_MakeCone_1) return new oc.BRepPrimAPI_MakeCone_1(radius1, radius2, height);
  if (oc.BRepPrimAPI_MakeCone_2) {
    const axis = new oc.gp_Ax2_2(
      new oc.gp_Pnt_3(0, 0, 0),
      new oc.gp_Dir_4(0, 0, 1),
      new oc.gp_Dir_4(1, 0, 0)
    );
    return new oc.BRepPrimAPI_MakeCone_2(axis, radius1, radius2, height);
  }
  throw new Error('MakeCone overloads not found');
}

// Helper: Make torus
function makeTorus(majorRadius: number, minorRadius: number) {
  if (oc.BRepPrimAPI_MakeTorus_1) return new oc.BRepPrimAPI_MakeTorus_1(majorRadius, minorRadius);
  if (oc.BRepPrimAPI_MakeTorus_2) {
    const axis = new oc.gp_Ax2_2(
      new oc.gp_Pnt_3(0, 0, 0),
      new oc.gp_Dir_4(0, 0, 1),
      new oc.gp_Dir_4(1, 0, 0)
    );
    return new oc.BRepPrimAPI_MakeTorus_2(axis, majorRadius, minorRadius);
  }
  throw new Error('MakeTorus overloads not found');
}

// Helper: Boolean cut operation
function booleanCut(baseId: string, toolId: string): any {
  const baseShape = shapeRegistry.get(baseId);
  const toolShape = shapeRegistry.get(toolId);
  
  if (!baseShape) throw new Error(`Base shape not found: ${baseId}`);
  if (!toolShape) throw new Error(`Tool shape not found: ${toolId}`);
  
  // Try numbered variants systematically
  const variants = ['BRepAlgoAPI_Cut_1', 'BRepAlgoAPI_Cut_2', 'BRepAlgoAPI_Cut_3', 'BRepAlgoAPI_Cut_4'];
  
  for (const variantName of variants) {
    if (oc[variantName]) {
      try {
        const cut = new oc[variantName](baseShape, toolShape);
        return cut.Shape();
      } catch (e: any) {
        // Try next variant
        continue;
      }
    }
  }
  
  throw new Error('No Cut variant accepted 2 parameters');
}

// Helper: Boolean fuse (union) operation
function booleanFuse(shapeIds: string[]): any {
  if (shapeIds.length < 2) {
    throw new Error('Fuse requires at least 2 shapes');
  }
  
  const shapes = shapeIds.map(id => {
    const shape = shapeRegistry.get(id);
    if (!shape) throw new Error(`Shape not found: ${id}`);
    return shape;
  });
  
  // Start with first two shapes
  let result = shapes[0];
  
  for (let i = 1; i < shapes.length; i++) {
    const variants = ['BRepAlgoAPI_Fuse_1', 'BRepAlgoAPI_Fuse_2', 'BRepAlgoAPI_Fuse_3'];
    
    let fused = null;
    for (const variantName of variants) {
      if (oc[variantName]) {
        try {
          const fuse = new oc[variantName](result, shapes[i]);
          fused = fuse.Shape();
          break;
        } catch (e: any) {
          continue;
        }
      }
    }
    
    if (!fused) throw new Error('No Fuse variant succeeded');
    result = fused;
  }
  
  return result;
}

// Helper: Fillet operation
function fillet(baseId: string, radius: number) {
  const shape = shapeRegistry.get(baseId);
  if (!shape) throw new Error(`Shape not found: ${baseId}`);
  
  const filletMaker = new oc.BRepFilletAPI_MakeFillet(shape, oc.ChFi3d_FilletShape.ChFi3d_Rational);
  
  // Add fillet to all edges
  const explorer = new oc.TopExp_Explorer_2(shape, oc.TopAbs_ShapeEnum.TopAbs_EDGE, oc.TopAbs_ShapeEnum.TopAbs_SHAPE);
  let edgeCount = 0;
  while (explorer.More()) {
    const edge = oc.TopoDS.Edge_1(explorer.Current());
    filletMaker.Add_2(radius, edge);
    explorer.Next();
    edgeCount++;
  }
  
  return { shape: filletMaker.Shape(), edgeCount };
}

// Helper: Triangulate shape and extract mesh data
function triangulate(shapeId: string, deflection: number = 0.1) {
  const shape = shapeRegistry.get(shapeId);
  if (!shape) throw new Error(`Shape not found: ${shapeId}`);
  
  // Triangulate the shape
  new oc.BRepMesh_IncrementalMesh_2(shape, deflection, false, deflection, false);
  
  const vertices: number[] = [];
  const indices: number[] = [];
  const normals: number[] = [];
  let vertexOffset = 0;
  
  const explorer = new oc.TopExp_Explorer_2(shape, oc.TopAbs_ShapeEnum.TopAbs_FACE, oc.TopAbs_ShapeEnum.TopAbs_SHAPE);
  
  while (explorer.More()) {
    const face = oc.TopoDS.Face_1(explorer.Current());
    const location = new oc.TopLoc_Location_1();
    const triangulation = oc.BRep_Tool.Triangulation(face, location);
    
    if (triangulation && !triangulation.IsNull()) {
      const transformation = location.Transformation();
      const nodeCount = triangulation.NbNodes();
      const triangleCount = triangulation.NbTriangles();
      
      // Extract vertices
      for (let i = 1; i <= nodeCount; i++) {
        const node = triangulation.Node(i);
        const transformed = node.Transformed(transformation);
        vertices.push(transformed.X(), transformed.Y(), transformed.Z());
      }
      
      // Extract normals (use face normal for now)
      const surface = oc.BRep_Tool.Surface_2(face);
      for (let i = 1; i <= nodeCount; i++) {
        const node = triangulation.Node(i);
        const uv = triangulation.UVNode(i);
        
        try {
          const normalCalc = new oc.GeomLProp_SLProps_2(surface, uv.X(), uv.Y(), 1, 0.01);
          const normal = normalCalc.Normal();
          
          // Flip normal if face is reversed
          if (face.Orientation_1() === oc.TopAbs_Orientation.TopAbs_REVERSED) {
            normals.push(-normal.X(), -normal.Y(), -normal.Z());
          } else {
            normals.push(normal.X(), normal.Y(), normal.Z());
          }
        } catch {
          // Fallback to flat normal if calculation fails
          normals.push(0, 0, 1);
        }
      }
      
      // Extract indices
      for (let i = 1; i <= triangleCount; i++) {
        const triangle = triangulation.Triangle(i);
        let i1 = triangle.Value(1) - 1;
        let i2 = triangle.Value(2) - 1;
        let i3 = triangle.Value(3) - 1;
        
        // Flip winding if face is reversed
        if (face.Orientation_1() === oc.TopAbs_Orientation.TopAbs_REVERSED) {
          indices.push(vertexOffset + i1, vertexOffset + i3, vertexOffset + i2);
        } else {
          indices.push(vertexOffset + i1, vertexOffset + i2, vertexOffset + i3);
        }
      }
      
      vertexOffset += nodeCount;
    }
    
    explorer.Next();
  }
  
  return {
    vertices: new Float32Array(vertices),
    indices: new Uint32Array(indices),
    normals: new Float32Array(normals)
  };
}

// Helper: Extract edges from shape for 2D path generation
function extractEdges(shapeId: string, viewDirection: { x: number; y: number; z: number }) {
  const shape = shapeRegistry.get(shapeId);
  if (!shape) throw new Error(`Shape not found: ${shapeId}`);
  
  const edges: any[] = [];
  const explorer = new oc.TopExp_Explorer_2(shape, oc.TopAbs_ShapeEnum.TopAbs_EDGE, oc.TopAbs_ShapeEnum.TopAbs_SHAPE);
  
  while (explorer.More()) {
    const edge = oc.TopoDS.Edge_1(explorer.Current());
    
    // Get curve from edge
    const curve = oc.BRep_Tool.Curve_2(edge, 0, 1);
    const handle = curve.get();
    
    if (!handle || handle.IsNull()) {
      explorer.Next();
      continue;
    }
    
    // Get first and last parameters
    const first = { current: 0 };
    const last = { current: 0 };
    const adaptorCurve = oc.BRep_Tool.Curve_2(edge, first, last);
    
    // Get start and end points
    const startPnt = new oc.gp_Pnt_1();
    const endPnt = new oc.gp_Pnt_1();
    adaptorCurve.get().D0(first.current, startPnt);
    adaptorCurve.get().D0(last.current, endPnt);
    
    const edgeData: any = {
      start: { x: startPnt.X(), y: startPnt.Y(), z: startPnt.Z() },
      end: { x: endPnt.X(), y: endPnt.Y(), z: endPnt.Z() },
      visible: true
    };
    
    // Determine edge type
    const curveType = handle.DynamicType().Name();
    
    if (curveType.includes('Geom_Line')) {
      edgeData.type = 'line';
    } else if (curveType.includes('Geom_Circle')) {
      edgeData.type = 'arc';
      const circle = oc.Handle_Geom_Circle.DownCast(curve).get();
      const center = circle.Location();
      edgeData.center = { x: center.X(), y: center.Y(), z: center.Z() };
      edgeData.radius = circle.Radius();
      
      // Calculate angles
      const ax = circle.Axis();
      const xAxis = circle.XAxis();
      edgeData.startAngle = 0; // TODO: Calculate actual angles
      edgeData.endAngle = Math.PI; // TODO: Calculate actual angles
    } else if (curveType.includes('Geom_BSplineCurve')) {
      edgeData.type = 'spline';
      const spline = oc.Handle_Geom_BSplineCurve.DownCast(curve).get();
      const controlPoints = [];
      for (let i = 1; i <= spline.NbPoles(); i++) {
        const pole = spline.Pole(i);
        controlPoints.push({ x: pole.X(), y: pole.Y(), z: pole.Z() });
      }
      edgeData.controlPoints = controlPoints;
    } else {
      // Default to line for unknown types
      edgeData.type = 'line';
    }
    
    edges.push(edgeData);
    explorer.Next();
  }
  
  return { edges };
}

// Message handler
self.onmessage = async (e: MessageEvent<WorkerRequest>) => {
  const req = e.data;
  
  try {
    if (req.type === 'init') {
      console.log('[Worker] Received init request, starting OCCT initialization...');
      const start = performance.now();
      await ensureInit();
      const initMs = performance.now() - start;
      console.log(`[Worker] OCCT initialized in ${initMs.toFixed(0)}ms`);
      
      const response: WorkerResponse = {
        id: req.id,
        type: 'init',
        success: true,
        initMs
      };
      self.postMessage(response);
      return;
    }
    
    // All other operations require init first
    await ensureInit();
    
    switch (req.type) {
      case 'makeBox': {
        const { shapeId, w, h, d } = req.params;
        const maker = makeBox(w, h, d);
        const shape = maker.Shape();
        shapeRegistry.set(shapeId, shape);
        self.postMessage({ id: req.id, type: 'makeBox', success: true, shapeId });
        break;
      }
      
      case 'makeCylinder': {
        const { shapeId, r, h } = req.params;
        const maker = makeCylinder(r, h);
        const shape = maker.Shape();
        shapeRegistry.set(shapeId, shape);
        self.postMessage({ id: req.id, type: 'makeCylinder', success: true, shapeId });
        break;
      }
      
      case 'makeSphere': {
        const { shapeId, radius } = req.params;
        const shape = makeSphere(radius);
        shapeRegistry.set(shapeId, shape);
        self.postMessage({ id: req.id, type: 'makeSphere', success: true, shapeId });
        break;
      }
      
      case 'makeCone': {
        const { shapeId, radius1, radius2, height } = req.params;
        const shape = makeCone(radius1, radius2, height);
        shapeRegistry.set(shapeId, shape);
        self.postMessage({ id: req.id, type: 'makeCone', success: true, shapeId });
        break;
      }
      
      case 'makeTorus': {
        const { shapeId, majorRadius, minorRadius } = req.params;
        const shape = makeTorus(majorRadius, minorRadius);
        shapeRegistry.set(shapeId, shape);
        self.postMessage({ id: req.id, type: 'makeTorus', success: true, shapeId });
        break;
      }
      
      case 'booleanCut': {
        const { resultId, baseId, toolId } = req.params;
        const resultShape = booleanCut(baseId, toolId);
        shapeRegistry.set(resultId, resultShape);
        self.postMessage({ id: req.id, type: 'booleanCut', success: true, shapeId: resultId });
        break;
      }
      
      case 'booleanFuse': {
        const { resultId, shapes } = req.params;
        const resultShape = booleanFuse(shapes);
        shapeRegistry.set(resultId, resultShape);
        self.postMessage({ id: req.id, type: 'booleanFuse', success: true, shapeId: resultId });
        break;
      }
      
      case 'fillet': {
        const { baseId, radius } = req.params;
        const { shape: resultShape, edgeCount } = fillet(baseId, radius);
        shapeRegistry.set(baseId, resultShape); // Replace original shape
        self.postMessage({ id: req.id, type: 'fillet', success: true, shapeId: baseId, edgeCount });
        break;
      }
      
      case 'triangulate': {
        const { shapeId, deflection = 0.1 } = req.params;
        const { vertices, indices, normals } = triangulate(shapeId, deflection);
        
        // Send with transferable arrays for zero-copy transfer
        const response: WorkerResponse = {
          id: req.id,
          type: 'triangulate',
          success: true,
          result: { vertices, indices, normals }
        };
        (self as any).postMessage(response, [vertices.buffer, indices.buffer, normals.buffer]);
        break;
      }
      
      case 'extractEdges': {
        const { shapeId, viewDirection } = req.params;
        const result = extractEdges(shapeId, viewDirection);
        self.postMessage({ id: req.id, type: 'extractEdges', success: true, result });
        break;
      }
      
      default:
        throw new Error(`Unknown request type: ${(req as any).type}`);
    }
  } catch (error: any) {
    const response: WorkerResponse = {
      id: req.id,
      success: false,
      error: error.message || String(error)
    };
    self.postMessage(response);
  }
};

// Signal worker is ready to receive messages
console.log('[Worker] Script loaded, ready to receive messages');
self.postMessage({ type: 'ready' });
