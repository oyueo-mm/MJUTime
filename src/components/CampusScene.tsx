import { useEffect, useMemo, useRef, type ComponentRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { buildings, eventPosition, CURRENT_YEAR, type Building, type Campus, type HistoryEvent, type Vec3 } from '../data/history'
import { buildingExists, visibleEvents } from '../lib/time'
import { ModelPalette } from './models/parts'
import { confidenceLabels } from '../data/architecture'
import { LandmarkModel } from './models/Landmarks'
import CampusLandscape from './CampusLandscape'

export interface SceneProps {
  campus: Campus
  year: number
  selected: HistoryEvent | null
  onSelect: (event: HistoryEvent) => void
  labels: boolean
  inspectedId: string | null
  onInspect: (building: Building) => void
  cameraCommand: { kind: 'reset' | 'in' | 'out'; id: number }
  reducedMotion: boolean
  onFailure: () => void
}
declare global {
  interface Window {
    __MJUTIME_DEBUG__?: () => { buildings: { id: string; visible: boolean; scaleY: number; y: number; position: number[]; rotationY: number; modelType: string; signature: string[] }[]; camera: number[]; calls: number; triangles: number; geometries: number; frame: number; frameMs: number[]; firstFrameMs: number; renderer: string }
  }
}

function BuildingModel({ building, exists, selected, reducedMotion, onInspect }: { building: Building; exists: boolean; selected: boolean; reducedMotion: boolean; onInspect: (building: Building) => void }) {
  const root = useRef<THREE.Group>(null)
  const progress = useRef(exists ? 1 : 0)
  const lastOpacity = useRef(-1)
  useFrame((_, delta) => {
    if (!root.current) return
    progress.current = reducedMotion ? Number(exists) : THREE.MathUtils.damp(progress.current, Number(exists), 6, Math.min(delta, .1))
    if (Math.abs(progress.current - Number(exists)) < .001) progress.current = Number(exists)
    root.current.visible = progress.current > .001
    root.current.scale.y = Math.max(.001, progress.current)
    root.current.position.y = building.baseHeight - (1 - progress.current) * .65
    if(lastOpacity.current !== progress.current) {
      lastOpacity.current = progress.current
      root.current.traverse(child => {
        if(child instanceof THREE.Mesh) {
          const materials = Array.isArray(child.material) ? child.material : [child.material]
          materials.forEach(material=>{material.opacity=progress.current})
          child.castShadow=progress.current>.5
        }
      })
    }
  })
  return <group>
    <group ref={root} name={`building-${building.id}`} position={[building.position[0],building.baseHeight,building.position[2]]} rotation={[0,building.rotation,0]} visible={exists} scale={[1,exists?1:.001,1]} onClick={event=>{if(event.delta<5&&exists){event.stopPropagation();onInspect(building)}}}>
      <ModelPalette selected={selected}><LandmarkModel building={building}/></ModelPalette>
    </group>
    {selected&&<mesh position={[building.position[0],building.baseHeight+.05,building.position[2]]} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[Math.max(...building.footprint)*.59,Math.max(...building.footprint)*.59+.09,64]}/><meshBasicMaterial color="#347bff" transparent opacity={.8}/></mesh>}
  </group>
}

// React DOM owns annotations; Three only projects their positions. This avoids
// nested React roots during rapid marker removal or campus changes.
export function SceneAnnotations({ campus, year, labels, selected, onSelect, onInspect }: Pick<SceneProps, 'campus' | 'year' | 'labels' | 'selected' | 'onSelect' | 'onInspect'>) {
  return <div className="scene-annotations">
    {labels && buildings.filter(building => building.campus === campus && buildingExists(building, year)).map(building => <div className="screen-anchor label-anchor" data-building-anchor={building.id} key={building.id}><button aria-label={`${building.name} 건물 정보`} title={`${building.modelConfidence} · ${confidenceLabels[building.modelConfidence]}`} onClick={()=>onInspect(building)} className={`building-label ${selected?.buildingId === building.id ? 'is-selected' : ''}`}>{building.name.replace(' · 개념 모형', '')}<i>{building.modelConfidence}</i></button></div>)}
    {visibleEvents(campus, year).map(event => <div className="screen-anchor marker-anchor" data-event-anchor={event.id} key={event.id}><button className={`event-marker ${event.year === year ? 'current' : ''}`} aria-label={`${event.year}년 ${event.title} 사건 보기`} onClick={() => onSelect(event)}><span>!</span>{event.year === year && <i />}</button></div>)}
    {year !== CURRENT_YEAR && <div className="screen-anchor" data-site-anchor="true"><div className="past-site-label">역사 자료 기반 · 개념 부지</div></div>}
  </div>
}

function ProjectAnnotations({ campus, year, labels, reducedMotion }: Pick<SceneProps, 'campus' | 'year' | 'labels' | 'reducedMotion'>) {
  const { camera, size, gl, scene } = useThree()
  const point = useMemo(() => new THREE.Vector3(), [])
  const anchors=useRef<{element:HTMLElement;position:Vec3;building?:Building;event?:HistoryEvent;width:number;height:number}[]>([])
  const boxes=useRef(new Float32Array(120))
  useEffect(()=>{
    const overlay=gl.domElement.closest('.scene')?.querySelector('.scene-annotations')
    if(!overlay)return
    const collect=()=>{
      anchors.current=Array.from(overlay.querySelectorAll<HTMLElement>('.screen-anchor')).map(element=>{
        const building=buildings.find(b=>b.id===element.dataset.buildingAnchor)
        const event=visibleEvents(campus,year).find(e=>e.id===element.dataset.eventAnchor)
        const position:Vec3=building?[building.position[0],building.baseHeight+building.dimensions[1]+.8,building.position[2]]:event?eventPosition(event):[0,.6,-7.8]
        return{element,position,building,event,width:element.offsetWidth||80,height:element.offsetHeight||25}
      }).sort((a,b)=>Number(Boolean(b.event))-Number(Boolean(a.event)))
    }
    collect();const observer=new MutationObserver(collect);observer.observe(overlay,{childList:true,subtree:true})
    return()=>observer.disconnect()
  },[campus,year,labels,gl])
  useFrame(({clock})=>{
    const occupied=boxes.current;let count=2
    occupied.set([0,0,245,size.width<650?110:135,size.width-180,0,180,85])
    for(const anchor of anchors.current){
      let visible=true
      if(anchor.building)visible=(scene.getObjectByName(`building-${anchor.building.id}`)?.scale.y??0)>.85
      point.set(...anchor.position)
      if(anchor.event&&!reducedMotion)point.y+=Math.sin(clock.elapsedTime*2+anchor.event.year)*.13
      point.project(camera)
      let x=(point.x+1)*size.width/2,y=(1-point.y)*size.height/2
      visible=visible&&point.z>-1&&point.z<1&&x>-50&&x<size.width+50&&y>0&&y<size.height
      if(anchor.building){
        let best=Infinity,bx=x-38,by=y+18
        for(const [dx,dy] of labelOffsets){
          const cx=Math.max(anchor.width/2+8,Math.min(size.width-anchor.width/2-8,x+dx)),cy=Math.max(20,Math.min(size.height-35,y+dy))
          let score=0
          for(let i=0;i<count;i++){const j=i*4;score+=Math.max(0,Math.min(cx+anchor.width/2+5,occupied[j]+occupied[j+2])-Math.max(cx-anchor.width/2-5,occupied[j]))*Math.max(0,Math.min(cy+anchor.height/2+4,occupied[j+1]+occupied[j+3])-Math.max(cy-anchor.height/2-4,occupied[j+1]))}
          if(score<best){best=score;bx=cx;by=cy}if(score===0)break
        }
        x=bx;y=by
      }
      const transform=`translate(${Math.round(x*2)/2}px,${Math.round(y*2)/2}px) translate(-50%,-50%)`
      if(anchor.element.style.transform!==transform)anchor.element.style.transform=transform
      anchor.element.style.visibility=visible?'visible':'hidden'
      if(visible&&count<29){occupied.set([x-anchor.width/2-4,y-anchor.height/2-4,anchor.width+8,anchor.height+8],count*4);count++}
    }
  })
  return null
}
const labelOffsets=[[-42,18],[-48,43],[45,18],[0,47],[-65,-15],[65,-15],[0,70]]

function CameraRig({ selected, inspectedId, cameraCommand, reducedMotion, campus }: Pick<SceneProps, 'selected' | 'inspectedId' | 'cameraCommand' | 'reducedMotion' | 'campus'>) {
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null)
  const { camera, size } = useThree()
  const desired = useRef<{ position: THREE.Vector3; target: THREE.Vector3 } | null>(null)
  const saved = useRef<{ position: THREE.Vector3; target: THREE.Vector3 } | null>(null)
  const previousSelected = useRef<string | null>(null)
  const home = () => ({ position: new THREE.Vector3(...(campus==='humanities'?[38,34,45]:[40,40,49]) as Vec3).multiplyScalar(size.width < 650 ? 1.5 : 1), target: new THREE.Vector3(0,1,2) })
  useEffect(() => { desired.current = home(); saved.current = null }, [campus]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!controls.current) return
    const inspected=buildings.find(building=>building.id===inspectedId)
    if (selected || inspected) {
      if (!previousSelected.current) saved.current = { position: camera.position.clone(), target: controls.current.target.clone() }
      const focused=inspected??buildings.find(building=>building.id===selected?.buildingId)
      const target = new THREE.Vector3(...(focused?focused.position:eventPosition(selected!))); target.y = focused ? focused.baseHeight+focused.dimensions[1]*.45 : .8
      desired.current = { position: target.clone().add(new THREE.Vector3(...(focused?.inspectionOffset??[15,13,18]) as Vec3)), target }
    } else if (previousSelected.current) {
      desired.current = saved.current ?? home(); saved.current = null
    }
    previousSelected.current = selected?.id ?? inspectedId
  }, [selected, inspectedId, camera]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!controls.current || cameraCommand.id === 0) return
    const target = controls.current.target.clone()
    desired.current = cameraCommand.kind === 'reset' ? home() : {
      target, position: target.clone().add(camera.position.clone().sub(target).multiplyScalar(cameraCommand.kind === 'in' ? .78 : 1.25).clampLength(16, 115)),
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
  return <OrbitControls ref={controls} makeDefault enableDamping dampingFactor={.08} minDistance={16} maxDistance={115} minPolarAngle={.25} maxPolarAngle={Math.PI / 2.25} enablePan={false} onStart={() => { desired.current = null }} />
}

function Diagnostics() {
  const { scene, camera, gl } = useThree()
  const frameMs=useRef<number[]>([])
  const firstFrame=useRef(0)
  useFrame((_,delta)=>{if(!firstFrame.current)firstFrame.current=performance.now();frameMs.current.push(delta*1000);if(frameMs.current.length>180)frameMs.current.shift()})
  useEffect(() => {
    gl.domElement.dataset.webgl = 'ready'
    const context=gl.getContext(), extension=context.getExtension('WEBGL_debug_renderer_info')
    const renderer=extension?String(context.getParameter(extension.UNMASKED_RENDERER_WEBGL)):'unavailable'
    window.__MJUTIME_DEBUG__ = () => ({
      buildings: buildings.flatMap(building => {
        const object = scene.getObjectByName(`building-${building.id}`)
        const signature:string[]=[];object?.traverse(child=>{if(child.name.startsWith('signature-'))signature.push(child.name)})
        return object ? [{ id: building.id, visible: object.visible, scaleY: object.scale.y, y: object.position.y, position:object.position.toArray(), rotationY:object.rotation.y, modelType:building.modelType, signature }] : []
      }), camera: camera.position.toArray(), calls: gl.info.render.calls, triangles:gl.info.render.triangles, geometries: gl.info.memory.geometries, frame: gl.info.render.frame, frameMs:frameMs.current.slice(), firstFrameMs:firstFrame.current, renderer,
    })
    return () => { delete window.__MJUTIME_DEBUG__ }
  }, [scene, camera, gl])
  return null
}

export default function CampusScene(props: SceneProps) {
  const lowQuality = useMemo(() => window.matchMedia('(max-width: 700px), (prefers-reduced-motion: reduce)').matches || (navigator.hardwareConcurrency ?? 8) <= 4, [])
  const initialCamera: Vec3 = window.innerWidth < 650 ? [57,51,67.5] : [38,34,45]
  return <Canvas className="campus-canvas" shadows={lowQuality ? false : 'soft'} dpr={[1, lowQuality ? 1.25 : 1.75]} camera={{ position: initialCamera, fov: 39, near: .1, far: 250 }} gl={{ antialias: !lowQuality, powerPreference: lowQuality ? 'low-power' : 'high-performance' }} onCreated={({ gl }) => { gl.domElement.addEventListener('webglcontextlost', props.onFailure, { once: true }) }} fallback={<div className="webgl-fallback">이 환경에서는 WebGL을 사용할 수 없습니다. 역사 목록에서 시간 여행을 계속해 보세요.</div>}>
    <color attach="background" args={['#f5f7f8']} />
    <ambientLight intensity={1.0} />
    <hemisphereLight args={['#edf4ff', '#c1bc9e', 1.2]} />
    <directionalLight position={[-15, 25, 12]} intensity={2.3} castShadow={!lowQuality} shadow-mapSize={[1536,1536]} shadow-camera-left={-32} shadow-camera-right={32} shadow-camera-top={32} shadow-camera-bottom={-32} shadow-normalBias={.05} shadow-bias={-.0001} />
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -.6, 0]} receiveShadow><planeGeometry args={[300, 300]} /><shadowMaterial transparent opacity={.11} /></mesh>
    <group key={props.campus}>
      <CampusLandscape campus={props.campus} />
      {buildings.filter(building => building.campus === props.campus).map(building => <BuildingModel key={building.id} building={building} exists={buildingExists(building, props.year)} selected={props.selected?.buildingId === building.id || props.inspectedId===building.id} reducedMotion={props.reducedMotion} onInspect={props.onInspect} />)}
    </group>
    <CameraRig {...props} />
    <Diagnostics />
    <ProjectAnnotations {...props} />
  </Canvas>
}
