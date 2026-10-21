import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { terrainHeight } from '../data/architecture'
import { buildings, type Campus, type Vec3 } from '../data/history'
import { Block, ModelPalette, Repeated, type Part } from './models/parts'

const natureOutline:[number,number][]=[[-18,-24],[7,-28],[19,-22],[25,-9],[25,16],[18,24],[4,26],[-18,21],[-23,5],[-22,-12]]
const urbanOutline:[number,number][]=[[-19,-12],[16,-12],[20,-7],[19,13],[4,19],[-17,17],[-20,7]]
function inside(x:number,z:number,outline:[number,number][]) {
  let result=false
  for(let i=0,j=outline.length-1;i<outline.length;j=i++) {
    const [xi,zi]=outline[i], [xj,zj]=outline[j]
    if((zi>z)!==(zj>z)&&x<(xj-xi)*(z-zi)/(zj-zi)+xi)result=!result
  }
  return result
}
function Terrain({campus}:{campus:Campus}) {
  const {top,sides}=useMemo(()=>{
    const outline=campus==='nature'?natureOutline:urbanOutline
    const top=new THREE.BufferGeometry(), sides=new THREE.BufferGeometry()
    const vertices:number[]=[],colors:number[]=[],walls:number[]=[]
    const color=new THREE.Color()
    // The perimeter and surface share exactly the same contour, without grid-edge gaps.
    const triangles=THREE.ShapeUtils.triangulateShape(outline.map(([x,z])=>new THREE.Vector2(x,z)),[])
    for(const triangle of triangles) {
      for(const index of triangle) {
        const [px,pz]=outline[index]
        vertices.push(px,terrainHeight(campus,px,pz),pz)
        color.set(campus==='nature'?'#b9c9a7':'#c4cdb6');colors.push(color.r,color.g,color.b)
      }
    }
    outline.forEach(([x,z],i)=>{const [nx,nz]=outline[(i+1)%outline.length];const h=terrainHeight(campus,x,z),nh=terrainHeight(campus,nx,nz);walls.push(x,-.9,z,nx,nh,nz,x,h,z,x,-.9,z,nx,-.9,nz,nx,nh,nz)})
    top.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));top.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));top.computeVertexNormals()
    sides.setAttribute('position',new THREE.Float32BufferAttribute(walls,3));sides.computeVertexNormals()
    return{top,sides}
  },[campus])
  useEffect(()=>()=>{top.dispose();sides.dispose()},[top,sides])
  return <group><mesh geometry={top} receiveShadow><meshStandardMaterial vertexColors roughness={1} side={THREE.DoubleSide}/></mesh><mesh geometry={sides} castShadow receiveShadow><meshStandardMaterial color="#b7bbac" side={THREE.DoubleSide}/></mesh></group>
}
function roadParts(campus:Campus,nodes:[number,number][],width:number):Part[] {
  return nodes.slice(1).map(([x,z],i)=>{const [px,pz]=nodes[i];return{p:[(x+px)/2,terrainHeight(campus,(x+px)/2,(z+pz)/2)+.045,(z+pz)/2],s:[Math.hypot(x-px,z-pz)+.2,.08,width],r:-Math.atan2(z-pz,x-px)}})
}
function Forest({campus}:{campus:Campus}) {
  const trunks=useRef<THREE.InstancedMesh>(null), crowns=useRef<THREE.InstancedMesh>(null), pines=useRef<THREE.InstancedMesh>(null)
  const trees=useMemo(()=>{
    const points:{p:Vec3;size:number;pine:boolean}[]=[]
    const count=campus==='nature'?170:62
    for(let i=0;i<count*5 && points.length<count;i++) {
      const x=((i*73.17)%47)-23,z=((i*41.79)%53)-27
      if(!inside(x,z,campus==='nature'?natureOutline:urbanOutline))continue
      const onBuilding=buildings.some(b=>b.campus===campus&&Math.abs(x-b.position[0])<b.dimensions[0]/2+1&&Math.abs(z-b.position[2])<b.dimensions[2]/2+1.4)
      const onWalk=campus==='humanities'?(z>-.8&&z<16&&x>-12&&x<8):Math.abs(x-3)<2.7
      if(onBuilding||onWalk)continue
      points.push({p:[x,terrainHeight(campus,x,z),z],size:.65+(i%7)*.075,pine:campus==='nature'&&i%3!==0})
    }
    return points
  },[campus])
  const broad=trees.filter(t=>!t.pine),pine=trees.filter(t=>t.pine)
  useLayoutEffect(()=>{
    const object=new THREE.Object3D()
    const set=(mesh:THREE.InstancedMesh,list:typeof trees,y:number,scale:Vec3)=>{
      list.forEach((tree,i)=>{object.position.set(tree.p[0],tree.p[1]+y*tree.size,tree.p[2]);object.scale.set(scale[0]*tree.size,scale[1]*tree.size,scale[2]*tree.size);object.updateMatrix();mesh.setMatrixAt(i,object.matrix);mesh.setColorAt(i,new THREE.Color(i%3?'#89a97b':'#71986f'))});mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;mesh.computeBoundingSphere()
    }
    set(trunks.current!,trees,.55,[.11,1.1,.11]);set(crowns.current!,broad,1.4,[.75,.85,.75]);set(pines.current!,pine,1.5,[.72,1.9,.72])
  },[trees])
  return <group>
    <instancedMesh ref={trunks} args={[undefined,undefined,trees.length]} castShadow><cylinderGeometry args={[1,1,1,5]}/><meshStandardMaterial color="#9a866b" /></instancedMesh>
    <instancedMesh ref={crowns} args={[undefined,undefined,broad.length]} castShadow><icosahedronGeometry args={[1,1]}/><meshStandardMaterial color="#ffffff" flatShading /></instancedMesh>
    <instancedMesh ref={pines} args={[undefined,undefined,pine.length]} castShadow><coneGeometry args={[1,1,7]}/><meshStandardMaterial color="#e4ecdc" flatShading /></instancedMesh>
  </group>
}
export default function CampusLandscape({campus}:{campus:Campus}) {
  const roads=useMemo(()=>campus==='humanities'?
    [...roadParts(campus,[[-18,16],[5,18],[19,11]],1.6),...roadParts(campus,[[8,14],[8,3],[5,-1],[5,-7]],1.1),...roadParts(campus,[[-17,-.2],[-4,-.2],[5,-.2],[15,-3]],.8)]:
    [...roadParts(campus,[[3,-26],[4,-18],[2,-9],[2,0],[5,7],[10,12],[19,15]],1.5),...roadParts(campus,[[-14,-17],[-8,-15],[0,-14],[8,-14]],.8),...roadParts(campus,[[7,10],[12,10],[18,10]],.8)], [campus])
  return <group name={`landscape-${campus}`}><Terrain campus={campus}/><Forest campus={campus}/><ModelPalette>
    <Repeated parts={roads} color="#c6c9c0" />
    {campus==='humanities'?<>
      <Block p={[-5,.5,1.95]} s={[13,.1,4.1]} c="#dddbcf" />
      <Block p={[12.3,.5,-2.9]} s={[8.9,.1,2.5]} c="#deddd1" />
      <Repeated parts={Array.from({length:12},(_,i)=>({p:[8, .54,13.2+i*.16],s:[1.15,.025,.07]}))} color="#f1efdf" />
    </>:<>
      {/* Broad terrain context, not fabricated historical building foundations. */}
      <mesh position={[-15,terrainHeight(campus,-15,-4)+.06,-4]} rotation={[-Math.PI/2,0,.2]} scale={[1,2,1]}><circleGeometry args={[2.2,22]}/><meshStandardMaterial color="#91b5b0" roughness={.35}/></mesh>
      {[-18,-15,-10].map((x,i)=><mesh key={x} position={[x,2+i*.3,6+i*6]} scale={[2.1,.85,1.9]}><icosahedronGeometry args={[3.2,1]}/><meshStandardMaterial color={i%2?'#9eaf8b':'#acba99'} flatShading/></mesh>)}
    </>}
  </ModelPalette></group>
}
