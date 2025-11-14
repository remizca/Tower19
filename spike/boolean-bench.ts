// Boolean benchmark logic extracted to avoid Vite import-analysis errors on inline scripts
import { loadOC } from './oc-init';

let oc: any;
let initMs = 0;
let results: any[] = [];

function log(msg: string) {
  const ts = new Date().toISOString().split('T')[1].replace('Z', '');
  const logEl = document.getElementById('log');
  if (logEl) {
    logEl.textContent += `[${ts}] ${msg}\n`;
    logEl.scrollTop = logEl.scrollHeight;
  }
  console.log(msg);
}

function metric(label: string, value: string, cls = '') {
  const div = document.createElement('div');
  div.className = `metric ${cls}`;
  div.innerHTML = `<strong>${label}</strong><br>${value}`;
  const metricsEl = document.getElementById('metrics');
  if (metricsEl) metricsEl.appendChild(div);
}

function makeBox(w: number, h: number, d: number) {
  if ((oc as any).BRepPrimAPI_MakeBox_1) return new (oc as any).BRepPrimAPI_MakeBox_1(w, h, d);
  if ((oc as any).BRepPrimAPI_MakeBox_2) {
    try {
      return new (oc as any).BRepPrimAPI_MakeBox_2(w, h, d, 0);
    } catch {
      return new (oc as any).BRepPrimAPI_MakeBox_2(0, 0, 0, w, h, d);
    }
  }
  throw new Error('MakeBox overloads not found');
}

function makeCylinder(r: number, h: number) {
  if ((oc as any).BRepPrimAPI_MakeCylinder_1) return new (oc as any).BRepPrimAPI_MakeCylinder_1(r, h);
  if ((oc as any).BRepPrimAPI_MakeCylinder_2) {
    const axis = new (oc as any).gp_Ax2_2(
      new (oc as any).gp_Pnt_3(0, 0, 0),
      new (oc as any).gp_Dir_4(0, 0, 1),
      new (oc as any).gp_Dir_4(1, 0, 0)
    );
    return new (oc as any).BRepPrimAPI_MakeCylinder_2(axis, r, h);
  }
  throw new Error('MakeCylinder overloads not found');
}

function listCutOverloads() {
  const keys = Object.keys(oc as any).filter((k: string) => k.startsWith('BRepAlgoAPI_Cut'));
  log(`Available Cut overloads: ${keys.join(', ') || '(none)'}`);
  // Also check what Cut_1 actually is
  if ((oc as any).BRepAlgoAPI_Cut_1) {
    const ctor = (oc as any).BRepAlgoAPI_Cut_1;
    log(`Cut_1 type: ${typeof ctor}, length: ${ctor.length}`);
  }
  return keys;
}

function performCut(baseShape: any, toolShape: any) {
  // Systematically try each numbered variant to find the 2-parameter constructor
  const variants = ['BRepAlgoAPI_Cut_1', 'BRepAlgoAPI_Cut_2', 'BRepAlgoAPI_Cut_3', 'BRepAlgoAPI_Cut_4'];
  
  for (const variantName of variants) {
    if (oc[variantName]) {
      try {
        log(`Trying ${variantName} with 2 params...`);
        const cut = new oc[variantName](baseShape, toolShape);
        const result = cut.Shape();
        log(`SUCCESS: ${variantName} worked!`);
        return result;
      } catch (e: any) {
        log(`${variantName} failed: ${e.message}`);
      }
    }
  }
  
  throw new Error('No Cut variant accepted 2 parameters');
}

function random(min: number, max: number) {
  return Math.random() * (max - min) + min;
}
function randomInt(min: number, max: number) {
  return Math.floor(random(min, max));
}

function runBooleanTest(iter: number) {
  const boxW = randomInt(40, 120);
  const boxH = randomInt(30, 80);
  const boxD = randomInt(30, 90);
  
  // Create box maker and extract shape
  const boxMaker = makeBox(boxW, boxH, boxD);
  const boxShape = boxMaker.Shape();
  log(`Box maker type: ${boxMaker?.constructor?.name}, shape: ${boxShape?.constructor?.name}, typeof: ${typeof boxShape}`);
  
  let shape = boxShape;
  let holes = randomInt(2, 7);
  const holeTimes: number[] = [];
  try {
    for (let i = 0; i < holes; i++) {
      const r = randomInt(5, Math.min(20, boxW / 3));
      const h = boxH + 5;
      const cylMaker = makeCylinder(r, h);
      let cylShape = cylMaker.Shape();
      
      // Translate cylinder
      if ((oc as any).gp_Trsf_1 && (oc as any).BRepBuilderAPI_Transform_2 && (oc as any).gp_Vec_4) {
        const tx = random(r, boxW - r);
        const ty = random(r, boxD - r);
        const tr = new (oc as any).gp_Trsf_1();
        tr.SetTranslation_1(new (oc as any).gp_Vec_4(tx, ty, 0));
        cylShape = new (oc as any).BRepBuilderAPI_Transform_2(cylShape, tr, false).Shape();
      }
      
      // Only try cut on first iteration to see detailed logs
      if (i === 0) {
        log(`About to cut - shape valid: ${!!shape}, cylShape valid: ${!!cylShape}`);
      }
      
      const start = performance.now();
      shape = performCut(shape, cylShape);
      const end = performance.now();
      holeTimes.push(end - start);
      
      // Stop after first hole if we succeeded to verify
      if (i === 0) {
        log(`First cut succeeded! Continuing...`);
      }
    }
    return { success: true, holes, holeTimes };
  } catch (e: any) {
    return { success: false, holesCompleted: holeTimes.length, error: e.message, holeTimes };
  }
}

function summarize(data: any[]) {
  const times = data.filter((d) => d.success).flatMap((d) => d.holeTimes);
  const totalCuts = times.length;
  const avg = times.reduce((a, b) => a + b, 0) / Math.max(1, totalCuts);
  const min = Math.min(...times);
  const max = Math.max(...times);
  const std = Math.sqrt(times.reduce((a, t) => a + Math.pow(t - avg, 2), 0) / Math.max(1, totalCuts));
  const success = data.filter((d) => d.success).length;
  const fail = data.length - success;
  return { avg, min, max, std, success, fail, totalCuts };
}

export async function initBenchmark() {
  const statusEl = document.getElementById('status');
  const runBtn = document.getElementById('runBtn') as HTMLButtonElement;
  if (!statusEl || !runBtn) return;

  const loaded = await loadOC();
  oc = loaded.oc;
  initMs = loaded.initMs;
  statusEl.textContent = 'Ready';
  statusEl.className = 'status ready';
  runBtn.disabled = false;
  metric('Init Time', `${initMs.toFixed(0)} ms`, initMs < 3000 ? 'pass' : 'fail');
  log(`Initialization complete in ${initMs.toFixed(0)} ms`);
}

export async function runBenchmark() {
  const runBtn = document.getElementById('runBtn') as HTMLButtonElement;
  const exportBtn = document.getElementById('exportBtn') as HTMLButtonElement;
  const metricsEl = document.getElementById('metrics');
  const summaryEl = document.getElementById('summary');
  if (!runBtn || !exportBtn || !metricsEl || !summaryEl) return;

  runBtn.disabled = true;
  exportBtn.disabled = true;
  results = [];
  metricsEl.innerHTML = '';
  metric('Init Time', `${initMs.toFixed(0)} ms`, initMs < 3000 ? 'pass' : 'fail');
  listCutOverloads();
  log('Running 100 boolean cut sequences...');
  const startBatch = performance.now();
  for (let i = 0; i < 100; i++) {
    const r = runBooleanTest(i);
    results.push(r);
    if (!r.success) log(`FAIL ${i}: ${r.error}`);
    if (i % 10 === 0) log(`Progress ${i}/100`);
  }
  const endBatch = performance.now();
  const summary = summarize(results);
  metric('Cuts Executed', summary.totalCuts.toString(), '');
  metric(
    'Sequences Success',
    `${summary.success}/100`,
    summary.fail === 0 ? 'pass' : summary.fail < 10 ? 'warn' : 'fail'
  );
  metric('Sequences Fail', summary.fail.toString(), summary.fail === 0 ? 'pass' : 'fail');
  metric(
    'Avg Cut Time',
    `${summary.avg.toFixed(2)} ms`,
    summary.avg < 50 ? 'pass' : summary.avg < 120 ? 'warn' : 'fail'
  );
  metric('Min Cut Time', `${summary.min.toFixed(2)} ms`);
  metric('Max Cut Time', `${summary.max.toFixed(2)} ms`, summary.max < 250 ? 'pass' : 'warn');
  metric('Std Dev', `${summary.std.toFixed(2)} ms`);
  metric('Batch Duration', `${(endBatch - startBatch).toFixed(0)} ms`);
  summaryEl.innerHTML = `<h3>Summary</h3><pre>${JSON.stringify(summary, null, 2)}</pre>`;
  exportBtn.disabled = false;
  log('Benchmark complete.');
}

export function exportResults() {
  const payload = { initMs, timestamp: new Date().toISOString(), results, summary: summarize(results) };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'boolean-benchmark.json';
  a.click();
  URL.revokeObjectURL(a.href);
  log('Exported boolean-benchmark.json');
}
