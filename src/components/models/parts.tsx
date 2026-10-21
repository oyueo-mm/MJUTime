import { createContext, useContext, useEffect, useLayoutEffect, useMemo, useRef, type ReactNode } from 'react'
import * as THREE from 'three'
import type { Vec3 } from '../../data/history'

const unitBox = new THREE.BoxGeometry(1,1,1)
const Palette = createContext<(color: string) => THREE.MeshStandardMaterial>(() => { throw new Error('Model palette missing') })
export function ModelPalette({ children, selected = false }: { children: ReactNode; selected?: boolean }) {
  const materials = useMemo(() => new Map<string,THREE.MeshStandardMaterial>(), [selected])
  const material = (color: string) => {
    if (!materials.has(color)) materials.set(color,new THREE.MeshStandardMaterial({ color: new THREE.Color(color).lerp(new THREE.Color('#85b4ff'),selected ? .045 : 0), roughness: .78, transparent: true, emissive: selected ? '#03060a' : '#000000' }))
    return materials.get(color)!
  }
  useEffect(() => () => materials.forEach(value => value.dispose()), [materials])
  return <Palette.Provider value={material}>{children}</Palette.Provider>
}
export function Block({ p, s, c, r = 0, name }: { p: Vec3; s: Vec3; c: string; r?: number; name?: string }) {
  const material = useContext(Palette)(c)
  return <mesh name={name} geometry={unitBox} material={material} position={p} scale={s} rotation={[0,r,0]} castShadow receiveShadow />
}
export interface Part { p: Vec3; s: Vec3; r?: number; c?: string }
export function Repeated({ parts, color = '#6d929b', name }: { parts: Part[]; color?: string; name?: string }) {
  const ref = useRef<THREE.InstancedMesh>(null)
  const material = useContext(Palette)(color)
  useLayoutEffect(() => {
    const object = new THREE.Object3D()
    parts.forEach((part,i) => { object.position.set(...part.p);object.scale.set(...part.s);object.rotation.set(0,part.r ?? 0,0);object.updateMatrix();ref.current!.setMatrixAt(i,object.matrix);ref.current!.setColorAt(i,new THREE.Color(part.c ?? '#ffffff')) })
    ref.current!.instanceMatrix.needsUpdate = true
    if(ref.current!.instanceColor)ref.current!.instanceColor.needsUpdate = true
    ref.current!.computeBoundingSphere()
  },[parts,material])
  return <instancedMesh ref={ref} name={name} args={[unitBox,material,parts.length]} castShadow receiveShadow />
}
export type PlanPoint = [number,number]
export function Mass({ plan, bottom, height, color, name }: { plan: PlanPoint[]; bottom: number; height: number; color: string; name?: string }) {
  const geometry = useMemo(() => {
    const shape = new THREE.Shape();plan.forEach(([x,z],i)=> i ? shape.lineTo(x,-z) : shape.moveTo(x,-z));shape.closePath()
    const g = new THREE.ExtrudeGeometry(shape,{ depth:height,bevelEnabled:false,curveSegments:1 });g.rotateX(-Math.PI/2);return g
  },[plan,height])
  useEffect(()=>()=>geometry.dispose(),[geometry])
  return <mesh name={name} geometry={geometry} material={useContext(Palette)(color)} position={[0,bottom,0]} castShadow receiveShadow />
}
export function Cylinder({ p, radius, height, color, segments = 32, scale = [1,1,1] }: { p: Vec3;radius:number;height:number;color:string;segments?:number;scale?:Vec3 }) {
  return <mesh position={p} scale={scale} material={useContext(Palette)(color)} castShadow receiveShadow><cylinderGeometry args={[radius,radius,height,segments]} /></mesh>
}
export function windowGrid(width:number, floors:number, cols:number, bottom:number, pitch:number, depth:number, winWidth = .34, winHeight = .4):Part[] {
  return [-1,1].flatMap(side=>Array.from({length:floors*cols},(_,i)=>({p:[(i%cols+.5)*width/cols-width/2,bottom+Math.floor(i/cols)*pitch,side*(depth/2+.025)] as Vec3,s:[winWidth,winHeight,.035] as Vec3})))
}
export function Steps({ width, count, rise, run, z, color = '#d5d4c8', bottom = 0 }: { width:number;count:number;rise:number;run:number;z:number;color?:string;bottom?:number }) {
  const parts = useMemo(()=>Array.from({length:count},(_,i)=>({p:[0,bottom+(i+1)*rise/2,z-i*run] as Vec3,s:[width,(i+1)*rise,run+.02] as Vec3})),[width,count,rise,run,z,bottom])
  return <Repeated parts={parts} color={color} />
}
export function curvedPlan(points:PlanPoint[], count=42):PlanPoint[] {
  return new THREE.CatmullRomCurve3(points.map(([x,z])=>new THREE.Vector3(x,0,z)),true,'centripetal').getPoints(count).slice(0,-1).map(p=>[p.x,p.z])
}
export function edgeParts(plan:PlanPoint[], y:number, height:number, thickness=.05):Part[] {
  return plan.map(([x,z],i)=>{const [nx,nz]=plan[(i+1)%plan.length];return {p:[(x+nx)/2,y,(z+nz)/2],s:[Math.hypot(nx-x,nz-z)+.015,height,thickness],r:-Math.atan2(nz-z,nx-x)}})
}
