import * as THREE from 'three'
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js'
import {heightAt,type Point} from './spatial'

/** Independent photo interpretation, NOT the present library footprint.
 * Photos are private local references; no images/textures are bundled.
 * Undated photos + 1972/replacement account do not establish 2002/2006 capture dates.
 */
export const gymEvidence={
  id:'old-humanities-gym',name:'옛 실내체육관',grade:'photo-based-estimate',
  photoFiles:['old-gym-front-and-admin.png','old-gym-long-facade.png','old-gym-demolition.png'],
  photoDates:null,reportedCompletionYear:1972,demolitionDate:null,
  sourceUrl:'https://news.mju.ac.kr/news/articleView.html?idxno=13137',
  observed:['흰 외벽과 어두운 저층부','저층 위 약 4개 창문 띠','긴 입면의 규칙적인 창과 세로 기둥','평지붕·옥상 난간·돌출 코너부','철거 사진의 콘크리트 지붕/바닥판'],
  estimated:['총 5개 외관 층 구분(법정 층수 미확인)','길이 60~80m·폭 28~42m·높이 18~23m','도서관 권역 내 배치·방향·외곽선','2002/2006 시점의 존치와 외장 동일성'],
  // Explicit visualization scenario, not an asserted demolition interval.
  scenario:{fromYear:2002,throughYear:2006,uncertainYears:[2007,2008,2009]},
  center:[-188,211] as Point,rotation:-.055,width:34,length:70,height:20,
}
export const gymScenarioAt=(month:number)=>month>=2002*12&&month<2007*12
export function makeOldGym(){
  const e=gymEvidence,parts=new Map<string,THREE.BufferGeometry[]>(),group=new THREE.Group()
  const add=(g:THREE.BufferGeometry,color:string)=>{if(g.index){const flat=g.toNonIndexed();g.dispose();g=flat}if(!parts.has(color))parts.set(color,[]);parts.get(color)!.push(g)}
  const box=(w:number,h:number,d:number,x:number,y:number,z:number,color:string)=>{const g=new THREE.BoxGeometry(w,h,d);g.translate(x,y,z);add(g,color)}
  box(e.width,e.height,e.length,0,e.height/2,0,'#deded3')
  box(e.width+.1,3.4,e.length+.1,0,1.7,0,'#665f58')
  // Four observed window rows over the darker ground level; exact bay counts inferred.
  for(let floor=0;floor<4;floor++){
    const y=5.1+floor*3.5
    for(const side of [-1,1])for(let bay=0;bay<19;bay++){
      const z=-e.length/2+(bay+.5)*e.length/19
      box(.15,1.8,2.35,side*(e.width/2+.12),y,z,'#40565d')
      box(.22,1.9,.09,side*(e.width/2+.23),y,z,'#bbbdb3')
    }
    for(const side of [-1,1])for(let bay=0;bay<9;bay++){
      const x=-e.width/2+(bay+.5)*e.width/9
      box(2.3,1.8,.15,x,y,side*(e.length/2+.12),'#40565d')
      box(.1,1.9,.22,x,y,side*(e.length/2+.23),'#bbbdb3')
    }
  }
  // Broad blank corner piers and the solid end wall are visible in both elevations.
  for(const side of [-1,1]){
    box(.4,16,5,side*(e.width/2+.22),11.8,e.length/2-3,'#deded3')
    box(5,16,.4,-e.width/2+3,11.8,side*(e.length/2+.22),'#deded3')
  }
  // Broad flat slab + coping. No invented curved or gabled sports-hall roof.
  box(e.width+.5,.45,e.length+.5,0,e.height+.22,0,'#b3b6aa')
  for(const side of [-1,1])box(.4,.8,e.length,side*(e.width/2-.2),e.height+.6,0,'#e6e5da')
  for(const side of [-1,1])box(e.width,.8,.4,0,e.height+.6,side*(e.length/2-.2),'#e6e5da')
  box(7,1.8,7,-e.width/2+4,e.height+.9,e.length/2-4,'#ddddd2')
  for(const [color,geometries] of parts){const geometry=mergeGeometries(geometries);geometries.forEach(g=>g.dispose());if(geometry)group.add(new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color,roughness:.9})))}
  const c=Math.cos(e.rotation),s=Math.sin(e.rotation)
  const corners:Point[]=[[-e.width/2,-e.length/2],[e.width/2,-e.length/2],[e.width/2,e.length/2],[-e.width/2,e.length/2]].map(([x,z])=>[e.center[0]+x*c+z*s,e.center[1]-x*s+z*c])
  const base=Math.max(...corners.map(p=>heightAt(...p)))
  // Skirt each lower vertex to the DEM; the roof stays horizontal on this hillside.
  for(const child of group.children){const mesh=child as THREE.Mesh,p=mesh.geometry.getAttribute('position');for(let i=0;i<p.count;i++)if(p.getY(i)<.01){const x=p.getX(i),z=p.getZ(i);p.setY(i,heightAt(e.center[0]+x*c+z*s,e.center[1]-x*s+z*c)-base-.3)}mesh.geometry.computeVertexNormals()}
  group.position.set(e.center[0],base,e.center[1]);group.rotation.y=e.rotation
  group.userData={...e,base,footprint:corners}
  return group
}
