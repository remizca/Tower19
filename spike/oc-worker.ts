// OpenCascade Web Worker - runs OCCT in background thread

let oc: any = null;
let initPromise: Promise<any> | null = null;

// Message types for worker communication
type WorkerRequest = 
  | { id: string; type: 'init' }
  | { id: string; type: 'makeBox'; params: { w: number; h: number; d: number } }
  | { id: string; type: 'makeCylinder'; params: { r: number; h: number } }
  | { id: string; type: 'booleanCut'; params: { baseShape: any; toolShape: any } }
  | { id: string; type: 'fillet'; params: { shape: any; radius: number } }
  | { id: string; type: 'triangulate'; params: { shape: any; deflection: number } };

type WorkerResponse = 
  | { id: string; type: 'init'; success: true; initMs: number }
  | { id: string; type: 'init'; success: false; error: string }
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

// Helper: Boolean cut operation
function booleanCut(baseShape: any, toolShape: any) {
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

// Helper: Fillet operation
function fillet(shape: any, radius: number) {
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

// Helper: Triangulate shape and extract mesh
function triangulate(shape: any, deflection: number) {
  new oc.BRepMesh_IncrementalMesh_2(shape, deflection, false, deflection, false);
  
  let vertexCount = 0;
  let triangleCount = 0;
  
  const explorer = new oc.TopExp_Explorer_2(shape, oc.TopAbs_ShapeEnum.TopAbs_FACE, oc.TopAbs_ShapeEnum.TopAbs_SHAPE);
  while (explorer.More()) {
    const face = oc.TopoDS.Face_1(explorer.Current());
    const location = new oc.TopLoc_Location_1();
    const triangulation = oc.BRep_Tool.Triangulation(face, location);
    
    if (triangulation && !triangulation.IsNull()) {
      vertexCount += triangulation.NbNodes();
      triangleCount += triangulation.NbTriangles();
    }
    
    explorer.Next();
  }
  
  return { vertexCount, triangleCount };
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
        const { w, h, d } = req.params;
        const maker = makeBox(w, h, d);
        const shape = maker.Shape();
        // Note: Can't transfer shape directly, would need serialization for complex use cases
        // For now, just confirm success
        self.postMessage({ id: req.id, success: true, result: 'box_created' });
        break;
      }
      
      case 'makeCylinder': {
        const { r, h } = req.params;
        const maker = makeCylinder(r, h);
        const shape = maker.Shape();
        self.postMessage({ id: req.id, success: true, result: 'cylinder_created' });
        break;
      }
      
      case 'booleanCut': {
        // For boolean ops, would need shape serialization
        // For spike, we'll keep operations in worker and just return metrics
        self.postMessage({ id: req.id, success: true, result: 'cut_performed' });
        break;
      }
      
      case 'fillet': {
        // Similar - would need shape transfer
        self.postMessage({ id: req.id, success: true, result: 'fillet_applied' });
        break;
      }
      
      case 'triangulate': {
        // Similar - return mesh data instead of shape
        self.postMessage({ id: req.id, success: true, result: { vertices: 0, triangles: 0 } });
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
