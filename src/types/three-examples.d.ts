declare module 'three/examples/jsm/controls/OrbitControls' {
  import { EventDispatcher, MOUSE, TOUCH, Camera, Renderer } from 'three'
  import { Vector3 } from 'three'
  export interface OrbitControls extends EventDispatcher {
    target: Vector3
    update(): void
    dispose(): void
    enableDamping: boolean
    enablePan: boolean
    enableZoom: boolean
    enableRotate: boolean
  }
  const OrbitControls: any
  export { OrbitControls }
}

declare module 'three/examples/jsm/exporters/GLTFExporter.js'
declare module 'three/examples/jsm/exporters/USDZExporter.js'
declare module 'three/examples/jsm/exporters/STLExporter.js'
declare module 'three/examples/jsm/controls/OrbitControls.js'
