import * as THREE from 'three'
import {Builder} from './architecture-batch'
import {heightAt,type Point} from './spatial'
import {localFootprint,facadeEvidence,type CampusFeature} from './integrated-evidence'

export const bangmokEvidence={
  level:'B — 부분 근거 기반',
  sources:[facadeEvidence.library.source,'https://www.aurum.re.kr/Bits/BuildingDoc.aspx?mm=4&num=1907&ss=1','https://bizhrd.mju.ac.kr/default/img/2024_guide_01.pdf'],
  observed:'곡면 녹청 유리·상부 연결 띠와 열린 공간·흰 프레임·원형 기둥·옥상 정원·보행교',
  estimated:'OSM 외곽 안에서 구간 분할·곡률·중정 폭·지붕/채광창 배치·층고·출입 표고 추정. 실측 아님',
}
function rounded(ring:Point[]){
  const shape=new THREE.Shape(),cut=1.8
  for(let i=0;i<ring.length;i++){
    const a=ring[(i+ring.length-1)%ring.length],b=ring[i],c=ring[(i+1)%ring.length]
    const point=(p:Point):Point=>{const t=Math.min(.24,cut/Math.hypot(p[0]-b[0],p[1]-b[1]));return[b[0]+(p[0]-b[0])*t,b[1]+(p[1]-b[1])*t]}
    const u=point(a),v=point(c);if(!i)shape.moveTo(u[0],-u[1]);else shape.lineTo(u[0],-u[1]);shape.quadraticCurveTo(b[0],-b[1],v[0],-v[1])
  }
  shape.closePath();return shape
}
function clipped(ring:Point[],axis:number,bound:number,greater:boolean):Point[]{
  const out:Point[]=[]
  for(let i=0;i<ring.length;i++){
    const a=ring[i],b=ring[(i+1)%ring.length],inside=(p:Point)=>greater?p[axis]>=bound:p[axis]<=bound
    if(inside(a))out.push(a)
    if(inside(a)!==inside(b)){const t=(bound-a[axis])/(b[axis]-a[axis]);out.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t])}
  }return out
}
/** Dedicated stepped/pierced architecture; no photo texture or copied mesh. */
export function makeBangmokLibrary(f:CampusFeature){
  const ring=localFootprint(f),base=Math.max(...ring.map(p=>heightAt(...p))),height=f.properties.heightMetres!,builder=new Builder()
  const center:Point=[ring.reduce((s,p)=>s+p[0],0)/ring.length,ring.reduce((s,p)=>s+p[1],0)/ring.length]
  const white='#eeeede',glass='#78afb0',dark='#34565b'
  const volume=(shape:THREE.Shape,bottom:number,top:number,color:string,ground=false)=>{
    const g=new THREE.ExtrudeGeometry(shape,{depth:top-bottom,bevelEnabled:false,curveSegments:5});g.rotateX(-Math.PI/2);g.translate(0,base+bottom,0)
    if(ground){const p=g.getAttribute('position');for(let i=0;i<p.count;i++)if(p.getY(i)<base+bottom+.01)p.setY(i,heightAt(p.getX(i),p.getZ(i))-.45);g.computeVertexNormals()}
    builder.add(g,color)
  }
  const south=clipped(ring,1,222,true),north=clipped(ring,1,201,false),spine=clipped(clipped(clipped(ring,0,-193,true),1,201,true),1,222,false)
  // Recessed entrance glass under an open upper court. Heights remain proxies.
  volume(rounded(ring),0,3.05,dark,true)
  for(const p of [south,north,spine])volume(rounded(p),3.05,height-.1,glass)
  const roof=rounded(ring),hole=new THREE.Path()
  hole.moveTo(-216,-202);hole.lineTo(-197,-202);hole.quadraticCurveTo(-188,-212,-197,-222);hole.lineTo(-216,-222);hole.closePath();roof.holes.push(hole)
  // Top ribbon crosses the void; the opening below distinguishes the silhouette.
  volume(roof,height-2.5,height,glass);volume(roof,height,height+.24,white)
  const facade=(p:Point[],bottom:number,top:number)=>{
    const pts=rounded(p).getPoints(5)
    for(let i=0;i<pts.length-1;i++){
      const a=pts[i],b=pts[i+1],dx=b.x-a.x,dz=-(b.y-a.y),len=Math.hypot(dx,dz);if(len<.15)continue
      const x=(a.x+b.x)/2,z=-(a.y+b.y)/2,angle=-Math.atan2(dz,dx)
      for(let y=bottom;y<=top+.01;y+=3)builder.box(len,.16,.28,x,base+y,z,white,angle)
      const bays=Math.max(1,Math.round(len/1.6))
      for(let n=0;n<bays;n++){const t=(n+.5)/bays;builder.box(.12,top-bottom,.24,a.x+dx*t,base+(bottom+top)/2,-a.y+dz*t,'#b6cfc6',angle)}
    }
  }
  for(const p of [south,north,spine])facade(p,3.05,height)
  facade(ring,height-2.5,height)
  // Ground-storey mullions differ from the dense vertical translucent upper skin.
  facade(ring,.3,3)
  for(const [x,z] of [[-217,202],[-216,219]]){
    const g=new THREE.CylinderGeometry(.65,.65,height-2.6,12);g.translate(x,base+(height-2.6)/2,z);builder.add(g,white)
  }
  builder.box(18,.25,12,-207,base+3.18,211,'#b9af94')
  // The garden follows the south lobe, leaving a broad circulation rim.
  const garden=south.map(([x,z])=>[center[0]+(x-center[0])*.82,238+(z-238)*.78] as Point)
  volume(rounded(garden),height+.25,height+.36,'#839878')
  // Roof planting and low skylights: simplified layout, never a surveyed plan.
  builder.box(20,.2,23,-174,base+height+.36,236,'#839878')
  for(const z of [229,239]){builder.box(9,.65,2.3,-173,base+height+.7,z,white);builder.box(8,.12,1.8,-173,base+height+1.08,z,'#93b8b6')}
  const group=builder.finish()
  for(const child of group.children)(child as THREE.Mesh).geometry.translate(-center[0],-base,-center[1])
  group.position.set(center[0],base,center[1]);group.userData={id:f.id,evidence:f.properties,base,height,ring,center,facade:facadeEvidence.library,architecture:bangmokEvidence,modelType:'bangmok-pierced-ribbon'}
  return group
}
