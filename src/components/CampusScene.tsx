import { useEffect, useLayoutEffect, useMemo, useRef, type ComponentRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { buildings, CURRENT_YEAR, type Building, type Campus, type HistoryEvent, type Vec3 } from '../data/history'
import { buildingExists, visibleEvents } from '../lib/time'

export interface SceneProps {
  campus: Campus
  year: number
  selected: HistoryEvent | null
  onSelect: (event: HistoryEvent) => void
  labels: boolean
  cameraCommand: { kind: 'reset' | 'in' | 'out'; id: number }
  reducedMotion: boolean
  onFailure: () => void
}
declare global {
  interface Window {
    __MJUTIME_DEBUG__?: () => { buildings: { id: string; visible: boolean; scaleY: number; y: number }[]; camera: number[]; calls: number; geometries: number; frame: number }
  }
}

function Box({ position, size, color, ...rest }: { position: Vec3; size: Vec3; color: string; castShadow?: boolean; receiveShadow?: boolean }) {
  return <mesh position={position} castShadow receiveShadow {...rest}><boxGeometry args={size} /><meshStandardMaterial color={color} roughness={0.82} transparent /></mesh>
}

function Windows({ width, height, depth, modern }: { width: number; height: number; depth: number; modern: boolean }) {
  const ref = useRef<THREE.InstancedMesh>(null)
  const matrices = useMemo(() => {
    const result: THREE.Matrix4[] = []
    const rows = Math.max(2, Math.floor(height / .72))
    const cols = Math.max(3, Math.floor(width / .65))
    const sideCols = Math.max(2, Math.floor(depth / .7))
    const obj = new THREE.Object3D()
    for (let row = 0; row < rows; row++) {
      for (const sign of [-1, 1]) {
        for (let col = 0; col < cols; col++) {
          obj.position.set(-width / 2 + (col + .5) * width / cols, .55 + row * (height - .6) / rows, sign * (depth / 2 + .025))
          obj.rotation.y = 0
          obj.scale.set(modern ? width / cols * .81 : .32, modern ? .46 : .35, .035)
          obj.updateMatrix(); result.push(obj.matrix.clone())
        }
        for (let col = 0; col < sideCols; col++) {
          obj.position.set(sign * (width / 2 + .025), .55 + row * (height - .6) / rows, -depth / 2 + (col + .5) * depth / sideCols)
          obj.rotation.y = Math.PI / 2
          obj.scale.set(.34, .35, .035)
          obj.updateMatrix(); result.push(obj.matrix.clone())
        }
      }
    }
    return result
  }, [width, height, depth, modern])
  useLayoutEffect(() => {
    matrices.forEach((matrix, i) => ref.current!.setMatrixAt(i, matrix))
    ref.current!.instanceMatrix.needsUpdate = true
  }, [matrices])
  return <instancedMesh ref={ref} args={[undefined, undefined, matrices.length]}><boxGeometry /><meshStandardMaterial color={modern ? '#53848b' : '#677f87'} roughness={.37} metalness={.14} transparent /></instancedMesh>
}

function BuildingModel({ building, exists, selected, reducedMotion }: { building: Building; exists: boolean; selected: boolean; reducedMotion: boolean }) {
  const root = useRef<THREE.Group>(null)
  const progress = useRef(exists ? 1 : 0)
  const [w, h, d] = building.dimensions
  const modern = ['mcc', 'library', 'science'].includes(building.appearance)
  useFrame((_, delta) => {
    if (!root.current) return
    progress.current = reducedMotion ? Number(exists) : THREE.MathUtils.damp(progress.current, Number(exists), 6, Math.min(delta, .1))
    if (Math.abs(progress.current - Number(exists)) < .001) progress.current = Number(exists)
    root.current.visible = progress.current > .001
    root.current.scale.y = Math.max(.001, progress.current)
    root.current.position.y = .44 - (1 - progress.current) * .65
    root.current.traverse(child => {
      if (child instanceof THREE.Mesh) {
        const materials = Array.isArray(child.material) ? child.material : [child.material]
        materials.forEach(material => { material.opacity = progress.current })
        child.castShadow = progress.current > .5
      }
    })
  })
  return <group>
    <group ref={root} name={`building-${building.id}`} position={[building.position[0], .44, building.position[2]]} visible={exists} scale={[1, exists ? 1 : .001, 1]}>
      <Box position={[0, .13, 0]} size={[w + .45, .26, d + .45]} color="#cac6ba" />
      <Box position={[0, h / 2 + .2, 0]} size={[w, h, d]} color={selected ? '#d3e4f9' : building.color} />
      <Windows width={w} height={h} depth={d} modern={modern} />
      <Box position={[0, h + .3, 0]} size={[w + .2, .22, d + .2]} color={building.appearance === 'chapel' ? '#7d9695' : '#b3b9b4'} />
      <Box position={[0, h + .45, 0]} size={[w * .5, .2, d * .5]} color="#c5c7bb" />
      {building.appearance === 'classic' && <>
        <Box position={[0, h / 2, d / 2 + .1]} size={[1.1, h, .3]} color="#ede8dc" />
        <Box position={[0, h + .65, 0]} size={[1.4, .5, d * .65]} color="#c4b49f" />
      </>}
      {building.appearance === 'dorm' && <Box position={[-w / 2 - .08, h / 2, 0]} size={[.3, h + .15, d + .15]} color="#ece7dc" />}
      {building.appearance === 'library' && <>
        <Box position={[0, h * .51, d / 2 + .14]} size={[w * .7, h * .6, .18]} color="#89a5a7" />
        {[-2, -1, 0, 1, 2].map(x => <Box key={x} position={[x, h * .5, d / 2 + .27]} size={[.12, h * .76, .18]} color="#e9e6db" />)}
        <Box position={[0, 1, d / 2 + .5]} size={[w + .3, .2, 1.1]} color="#e8e5d7" />
      </>}
      {building.appearance === 'mcc' && <>
        <Box position={[0, h + .5, 0]} size={[w * .9, .18, d * .85]} color="#95b78c" />
        <Box position={[0, .6, d / 2 + .08]} size={[w * .95, .8, .16]} color="#759798" />
        <Box position={[1, h * .55, .3]} size={[1.6, h + .25, d + .5]} color="#f2eee2" />
      </>}
      {building.appearance === 'chapel' && <>
        <mesh position={[0, h + .45, 0]} rotation={[0, Math.PI / 4, 0]} castShadow><coneGeometry args={[w * .78, 1.4, 4]} /><meshStandardMaterial color="#78988d" transparent /></mesh>
        <Box position={[w * .34, h + 1, 0]} size={[.16, 2.3, .16]} color="#d3c7b6" />
        <Box position={[w * .34, h + 1.6, 0]} size={[.95, .15, .16]} color="#d3c7b6" />
      </>}
      {[0, 1, 2, 3].map(step => <Box key={step} position={[0, .06 + step * .06, d / 2 + .9 - step * .16]} size={[1.8, .12 + step * .12, .9 - step * .15]} color="#dedcd1" />)}
    </group>
    {selected && <mesh position={[building.position[0], .47, building.position[2]]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[Math.max(w, d) * .6, Math.max(w, d) * .6 + .1, 64]} /><meshBasicMaterial color="#347bff" transparent opacity={.8} /></mesh>}
  </group>
}

function Tree({ position, size = 1, pine = false }: { position: Vec3; size?: number; pine?: boolean }) {
  return <group position={position} scale={size}>
    <mesh position={[0, .55, 0]} castShadow><cylinderGeometry args={[.09, .14, 1.1, 5]} /><meshStandardMaterial color="#ad9170" /></mesh>
    <mesh position={[0, 1.4, 0]} castShadow>{pine ? <coneGeometry args={[.68, 1.9, 7]} /> : <icosahedronGeometry args={[.77, 1]} />}<meshStandardMaterial color={pine ? '#5d8c71' : '#80a775'} flatShading /></mesh>
    {!pine && <mesh position={[.32, 1.2, .14]} castShadow><icosahedronGeometry args={[.52, 0]} /><meshStandardMaterial color="#95b982" flatShading /></mesh>}
  </group>
}

function Landscape({ campus }: { campus: Campus }) {
  const trees = useMemo(() => Array.from({ length: campus === 'nature' ? 55 : 36 }, (_, i) => {
    const side = i % 4
    const along = (Math.floor(i / 4) / (campus === 'nature' ? 14 : 9) - .5) * 23
    return { x: side < 2 ? along : (side === 2 ? -11.7 : 11.7), z: side < 2 ? (side === 0 ? -9.5 : 8.8) : along * .72, size: .7 + ((i * 17) % 7) * .09 }
  }), [campus])
  return <group>
    <RoundedBox args={[27, .65, 23]} radius={.65} smoothness={3} position={[0, -.04, 0]} receiveShadow><meshStandardMaterial color="#d6d9cd" roughness={1} /></RoundedBox>
    <RoundedBox args={[26.8, .24, 22.8]} radius={.4} smoothness={2} position={[0, .34, 0]} receiveShadow><meshStandardMaterial color="#bccda8" roughness={1} /></RoundedBox>
    <Box position={[0, .48, 0]} size={[22, .06, 2.1]} color="#dadbd0" />
    <Box position={[-3, .48, .3]} size={[1.7, .07, 17]} color="#d9d9cf" />
    <Box position={[3.1, .48, -3]} size={[1.4, .07, 11]} color="#e1e0d4" />
    <Box position={[0, .49, 2.7]} size={[5.8, .07, 4]} color="#e6dfcf" />
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, .54, 2.6]} receiveShadow><circleGeometry args={[1.28, 48]} /><meshStandardMaterial color="#b2c3ac" /></mesh>
    <mesh position={[0, .73, 2.6]} receiveShadow><cylinderGeometry args={[.7, .9, .35, 32]} /><meshStandardMaterial color="#b9bcb5" /></mesh>
    <mesh position={[0, 1.04, 2.6]}><icosahedronGeometry args={[.45, 0]} /><meshStandardMaterial color="#879d9d" metalness={.5} roughness={.3} /></mesh>
    <Box position={[0, .47, 10.4]} size={[25, .08, 1.1]} color="#b6bdb7" />
    {Array.from({ length: 16 }, (_, i) => <Box key={i} position={[-11 + i * 1.5, .52, 10.4]} size={[.65, .015, .04]} color="#f8f6e9" />)}
    {trees.map((tree, i) => <Tree key={i} position={[tree.x, .45, tree.z]} size={tree.size} pine={campus === 'nature' && i % 3 !== 0} />)}
    {[-5, -2, 2, 5].map(x => <group key={x} position={[x, .5, 6.7]}><Box position={[0, .4, 0]} size={[1.2, .12, .45]} color="#b39e7f" /><Box position={[-.4, .19, 0]} size={[.09, .4, .35]} color="#7e8b86" /><Box position={[.4, .19, 0]} size={[.09, .4, .35]} color="#7e8b86" /></group>)}
    {campus === 'nature' && <group position={[0, -1.1, -11]}>
      {[-8, 0, 7].map((x, i) => <mesh key={x} position={[x, 0, -2 - i]} scale={[1.8, .5, 1.2]}><icosahedronGeometry args={[4.5, 1]} /><meshStandardMaterial color={i % 2 ? '#b5c5a9' : '#c8d2bc'} flatShading /></mesh>)}
    </group>}
  </group>
}

// React DOM owns annotations; Three only projects their positions. This avoids
// nested React roots during rapid marker removal or campus changes.
export function SceneAnnotations({ campus, year, labels, selected, onSelect }: Pick<SceneProps, 'campus' | 'year' | 'labels' | 'selected' | 'onSelect'>) {
  return <div className="scene-annotations">
    {labels && buildings.filter(building => building.campus === campus && buildingExists(building, year)).map(building => <div className="screen-anchor label-anchor" data-building-anchor={building.id} key={building.id}><div className={`building-label ${selected?.buildingId === building.id ? 'is-selected' : ''}`}>{building.name.replace(' · 개념 모형', '')}{building.isConceptual && <i>개념</i>}</div></div>)}
    {visibleEvents(campus, year).map(event => <div className="screen-anchor marker-anchor" data-event-anchor={event.id} key={event.id}><button className={`event-marker ${event.year === year ? 'current' : ''}`} aria-label={`${event.year}년 ${event.title} 사건 보기`} onClick={() => onSelect(event)}><span>!</span>{event.year === year && <i />}</button></div>)}
    {year !== CURRENT_YEAR && <div className="screen-anchor" data-site-anchor="true"><div className="past-site-label">역사 자료 기반 · 개념 부지</div></div>}
  </div>
}

function ProjectAnnotations({ campus, year, reducedMotion }: Pick<SceneProps, 'campus' | 'year' | 'reducedMotion'>) {
  const { camera, size, gl, scene } = useThree()
  const point = useMemo(() => new THREE.Vector3(), [])
  useFrame(({ clock }) => {
    const overlay = gl.domElement.closest('.scene')?.querySelector('.scene-annotations')
    if (!overlay) return
    const project = (element: HTMLElement, position: Vec3, visible = true) => {
      point.set(...position).project(camera)
      // Half-pixel quantization avoids perpetual layout jitter on a floating target.
      const x = Math.round((point.x + 1) * size.width) / 2
      const y = Math.round((1 - point.y) * size.height) / 2
      const transform = `translate(${x}px,${y}px) translate(-50%,-50%)`
      if (element.style.transform !== transform) element.style.transform = transform
      element.style.visibility = visible && point.z > -1 && point.z < 1 ? 'visible' : 'hidden'
    }
    overlay.querySelectorAll<HTMLElement>('[data-building-anchor]').forEach(element => {
      const building = buildings.find(item => item.id === element.dataset.buildingAnchor)!
      const model = scene.getObjectByName(`building-${building.id}`)
      project(element, [building.position[0], building.dimensions[1] + 1.2, building.position[2]], (model?.scale.y ?? 0) > .85)
    })
    visibleEvents(campus, year).forEach(event => {
      const element = overlay.querySelector<HTMLElement>(`[data-event-anchor="${event.id}"]`)
      if (element) project(element, [event.position[0], event.position[1] + .9 + (reducedMotion ? 0 : Math.sin(clock.elapsedTime * 2 + event.year) * .13), event.position[2]])
    })
    const site = overlay.querySelector<HTMLElement>('[data-site-anchor]')
    if (site) project(site, [0, .6, -7.8])
  })
  return null
}

function CameraRig({ selected, cameraCommand, reducedMotion, campus }: Pick<SceneProps, 'selected' | 'cameraCommand' | 'reducedMotion' | 'campus'>) {
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null)
  const { camera, size } = useThree()
  const desired = useRef<{ position: THREE.Vector3; target: THREE.Vector3 } | null>(null)
  const saved = useRef<{ position: THREE.Vector3; target: THREE.Vector3 } | null>(null)
  const previousSelected = useRef<string | null>(null)
  const home = () => ({ position: new THREE.Vector3(28, 27, 35).multiplyScalar(size.width < 650 ? 1.35 : 1), target: new THREE.Vector3(0, 0, 0) })
  useEffect(() => { desired.current = home(); saved.current = null }, [campus]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!controls.current) return
    if (selected) {
      if (!previousSelected.current) saved.current = { position: camera.position.clone(), target: controls.current.target.clone() }
      const target = new THREE.Vector3(...selected.position); target.y = selected.buildingId ? 2.3 : .8
      desired.current = { position: target.clone().add(new THREE.Vector3(15, 13, 18)), target }
    } else if (previousSelected.current) {
      desired.current = saved.current ?? home(); saved.current = null
    }
    previousSelected.current = selected?.id ?? null
  }, [selected, camera]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!controls.current || cameraCommand.id === 0) return
    const target = controls.current.target.clone()
    desired.current = cameraCommand.kind === 'reset' ? home() : {
      target, position: target.clone().add(camera.position.clone().sub(target).multiplyScalar(cameraCommand.kind === 'in' ? .78 : 1.25).clampLength(16, 85)),
    }
  }, [cameraCommand]) // eslint-disable-line react-hooks/exhaustive-deps
  useFrame((_, delta) => {
    if (!desired.current || !controls.current) return
    const alpha = reducedMotion ? 1 : 1 - Math.exp(-4.7 * Math.min(delta, .1))
    camera.position.lerp(desired.current.position, alpha)
    controls.current.target.lerp(desired.current.target, alpha)
    controls.current.update()
    if (camera.position.distanceTo(desired.current.position) < .015 && controls.current.target.distanceTo(desired.current.target) < .015) desired.current = null
  })
  return <OrbitControls ref={controls} makeDefault enableDamping dampingFactor={.08} minDistance={16} maxDistance={85} minPolarAngle={.25} maxPolarAngle={Math.PI / 2.25} enablePan={false} onStart={() => { desired.current = null }} />
}

function Diagnostics() {
  const { scene, camera, gl } = useThree()
  useEffect(() => {
    gl.domElement.dataset.webgl = 'ready'
    window.__MJUTIME_DEBUG__ = () => ({
      buildings: buildings.flatMap(building => {
        const object = scene.getObjectByName(`building-${building.id}`)
        return object ? [{ id: building.id, visible: object.visible, scaleY: object.scale.y, y: object.position.y }] : []
      }), camera: camera.position.toArray(), calls: gl.info.render.calls, geometries: gl.info.memory.geometries, frame: gl.info.render.frame,
    })
    return () => { delete window.__MJUTIME_DEBUG__ }
  }, [scene, camera, gl])
  return null
}

export default function CampusScene(props: SceneProps) {
  const lowQuality = useMemo(() => window.matchMedia('(max-width: 700px), (prefers-reduced-motion: reduce)').matches || (navigator.hardwareConcurrency ?? 8) <= 4, [])
  const initialCamera: Vec3 = window.innerWidth < 650 ? [37.8, 36.45, 47.25] : [28, 27, 35]
  return <Canvas className="campus-canvas" shadows={lowQuality ? false : 'soft'} dpr={[1, lowQuality ? 1.25 : 1.75]} camera={{ position: initialCamera, fov: 36, near: .1, far: 200 }} gl={{ antialias: !lowQuality, powerPreference: lowQuality ? 'low-power' : 'high-performance' }} onCreated={({ gl }) => { gl.domElement.addEventListener('webglcontextlost', props.onFailure, { once: true }) }} fallback={<div className="webgl-fallback">이 환경에서는 WebGL을 사용할 수 없습니다. 역사 목록에서 시간 여행을 계속해 보세요.</div>}>
    <color attach="background" args={['#f5f7f8']} />
    <ambientLight intensity={1.6} />
    <hemisphereLight args={['#edf4ff', '#c1bc9e', 1.4]} />
    <directionalLight position={[-15, 25, 12]} intensity={3} castShadow={!lowQuality} shadow-mapSize={[2048, 2048]} shadow-camera-left={-24} shadow-camera-right={24} shadow-camera-top={24} shadow-camera-bottom={-24} shadow-normalBias={.05} shadow-bias={-.0001} />
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -.6, 0]} receiveShadow><planeGeometry args={[300, 300]} /><shadowMaterial transparent opacity={.11} /></mesh>
    <group key={props.campus}>
      <Landscape campus={props.campus} />
      {buildings.filter(building => building.campus === props.campus).map(building => <BuildingModel key={building.id} building={building} exists={buildingExists(building, props.year)} selected={props.selected?.buildingId === building.id} reducedMotion={props.reducedMotion} />)}
    </group>
    <CameraRig {...props} />
    <Diagnostics />
    <ProjectAnnotations {...props} />
  </Canvas>
}
