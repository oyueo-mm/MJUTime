import * as THREE from 'three'
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js'
import {heightAt,inRing,mapData} from './spatial'
import {physicallyKnown} from './campus-evidence'
import {historicalGround,fieldReferenceAt} from './campus-ground'

export const mccFootprint=mapData.buildings.find(b=>b.id==='1127358152')!.p
const t=mapData.terrain,dx=(t.max[0]-t.min[0])/(t.cols-1),dz=(t.max[1]-t.min[1])/(t.rows-1)
export const mccBounds={minX:t.min[0]+Math.floor((-460-t.min[0])/dx)*dx,maxX:t.min[0]+Math.ceil((-220-t.min[0])/dx)*dx,minZ:t.min[1]+Math.floor((290-t.min[1])/dz)*dz,maxZ:t.min[1]+Math.ceil((440-t.min[1])/dz)*dz}
// Source-confirmed topology: two halls, four occupied levels, stepped green roofs,
// central outside stairs. Register: B2 / 2F. These are NOT surveyed floor elevations.
export const mccLevels={floorHeight:3.8,lower:heightAt(-360,415)+.3,below:2,above:2,confidence:'partial-photo / estimated-levels'}
export const inMccPatch=(x:number,z:number)=>x>=mccBounds.minX&&x<=mccBounds.maxX&&z>=mccBounds.minZ&&z<=mccBounds.maxZ
export function mccGround(x:number,z:number,active:boolean,field=false){
  return active&&inRing([x,z],mccFootprint)?mccLevels.lower-.15:historicalGround(x,z,field)
}
function clip(ring:number[][],axis:number,bound:number,keepGreater:boolean):number[][]{
  const out:number[][]=[]
  for(let i=0;i<ring.length;i++){
    const a=ring[i],b=ring[(i+1)%ring.length],inside=(p:number[])=>keepGreater?p[axis]>=bound:p[axis]<=bound
    if(inside(a))out.push(a)
    if(inside(a)!==inside(b)){const f=(bound-a[axis])/(b[axis]-a[axis]);out.push([a[0]+(b[0]-a[0])*f,a[1]+(b[1]-a[1])*f])}
  }
  return out
}
function piece(minX:number,maxX:number,minZ:number,maxZ:number){
  let p=mccFootprint
  for(const [axis,bound,greater] of [[0,minX,1],[0,maxX,0],[1,minZ,1],[1,maxZ,0]])p=clip(p,axis,bound,Boolean(greater))
  return p
}
/** No image textures or externally licensed meshes. All geometry is owned/reused. */
export class MccScene {
  readonly group=new THREE.Group()
  readonly patch:THREE.Mesh
  private batches=new Map<string,THREE.BufferGeometry[]>()
  private active=false
  private field=false
  private target=1
  private lastTime=0
  constructor(){
    const {lower:base,floorHeight:f}=mccLevels
    const volume=(p:number[][],bottom:number,top:number,color:string)=>{
      if(p.length<3)return
      const g=new THREE.ExtrudeGeometry(new THREE.Shape(p.map(([x,z])=>new THREE.Vector2(x,-z))),{depth:top-bottom,bevelEnabled:false,curveSegments:1})
      g.rotateX(-Math.PI/2);g.translate(0,bottom,0);this.add(g,color)
    }
    const slab=(p:number[][],y:number,color:string)=>volume(p,y,y+.35,color)
    const box=(w:number,h:number,d:number,x:number,y:number,z:number,color:string)=>{const g=new THREE.BoxGeometry(w,h,d);g.translate(x,y,z);this.add(g,color)}
    // Street-facing lower terraces; Veritas steps back above the sunken court.
    const west=piece(-435,-378,302,417),east=piece(-347,-239,302,417)
    volume(west,base,base+2*f,'#58787e');volume(east,base,base+2*f,'#58787e')
    const veritas=piece(-435,-378,302,365)
    volume(veritas,base+2*f,base+4*f,'#58787e')
    for(const p of [west,east])for(const n of [1,2])slab(p,base+n*f,'#eeedde')
    for(const n of [3,4])slab(veritas,base+n*f,'#eeedde')
    slab(west,base+2*f+.36,'#889b79');slab(veritas,base+4*f+.36,'#889b79')
    slab(east,base+2*f+.36,'#9ba687')
    // Narrow piers, shaded glazing and a solid roof edge rather than full glass slabs.
    for(const [a,b,left] of [[-435,-378,true],[-347,-239,false]] as const){
      const p=piece(a,b,302,417)
      for(let i=0;i<p.length;i++){
        const u=p[i],v=p[(i+1)%p.length],dx=v[0]-u[0],dz=v[1]-u[1],len=Math.hypot(dx,dz),angle=-Math.atan2(dz,dx)
        const floors=left&&Math.max(u[1],v[1])<=366?4:2
        for(let n=0;n<Math.ceil(len/4);n++){
          const q=(n+.5)/Math.ceil(len/4),g=new THREE.BoxGeometry(.55,f*floors,.65)
          g.rotateY(angle);g.translate(u[0]+dx*q,base+f*floors/2,u[1]+dz*q);this.add(g,'#dedfd0')
        }
      }
    }
    // Rooftop pavilion on the taller west hall (footprint and height estimated).
    box(26,2.6,12,-409,base+4*f+1.8,324,'#9dacab');box(29,.4,14,-409,base+4*f+3.3,324,'#eeedde')
    // Roof sports field confirmed by the official campus guide/photo; not a ground slab.
    const fieldY=base+2*f+.76
    slab(piece(-341,-265,308,358),fieldY,'#719377')
    for(const x of [-337,-269])box(.2,.06,43,x,fieldY+.4,333,'#efeee0')
    for(const z of [311.5,333,354.5])box(68,.06,.2,-303,fieldY+.4,z,'#efeee0')
    const circle=new THREE.TorusGeometry(6,.1,4,40);circle.rotateX(-Math.PI/2);circle.translate(-303,fieldY+.43,333);this.add(circle,'#efeee0')
    // Safety fence around the roof, kept in one material batch.
    for(const z of [308,358]){for(let x=-342;x<=-264;x+=6)box(.15,3,.15,x,fieldY+1.9,z,'#9aaea6');box(78,.1,.1,-303,fieldY+3.4,z,'#9aaea6')}
    // Two broad flights separated by the outdoor sunken landing. North is up-campus.
    const stair=(z0:number,z1:number,y0:number,y1:number,count:number)=>{
      for(let n=0;n<count;n++){const depth=(z0-z1)/count;box(27,.35,depth+.15,-362,y0+(y1-y0)*(n+.5)/count,z0-depth*(n+.5),'#e0dfd2')}
    }
    stair(414,381,base+.2,base+f,18);box(27,.4,12,-362,base+f,375,'#e0dfd2')
    stair(369,333,base+f,base+2*f,18)
    const campusLevel=heightAt(-362,310)+.25
    stair(333,310,base+2*f,campusLevel,12);box(27,.4,7,-362,campusLevel,307,'#e0dfd2')
    // Sunken garden is the lower exterior court, not a fabricated enclosed floor.
    slab(piece(-388,-305,389,417),base+.1,'#d7ceb7')
    for(const x of [-382,-324]){box(9,.5,6,x,base+.55,403,'#c7c6b4');box(8,.25,5,x,base+.93,403,'#899b72')}
    // Garden terraces/retaining edges flank the central circulation.
    for(const x of [-378,-347])box(.65,f,41,x,base+f/2,390,'#dedfd0')
    for(const x of [-376,-349]){box(.2,1,39,x,base+f+.55,350,'#a9b5aa');box(.15,.15,39,x,base+f+1.1,350,'#eef0e3')}
    for(const [color,geometries] of this.batches){
      const merged=mergeGeometries(geometries);geometries.forEach(g=>g.dispose())
      if(merged)this.group.add(new THREE.Mesh(merged,new THREE.MeshStandardMaterial({color,roughness:.85})))
    }
    this.batches.clear()
    // Detailed ground patch replaces coarse DEM cells only in this bounded area.
    const positions:number[]=[],indices:number[]=[],b=mccBounds,step=2.5,cols=Math.ceil((b.maxX-b.minX)/step)+1,rows=Math.ceil((b.maxZ-b.minZ)/step)+1
    for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){
      const x=b.minX+i/(cols-1)*(b.maxX-b.minX),z=b.minZ+j/(rows-1)*(b.maxZ-b.minZ);positions.push(x,heightAt(x,z),z)
      if(i<cols-1&&j<rows-1){const a=j*cols+i;indices.push(a,a+cols,a+1,a+1,a+cols,a+cols+1)}
    }
    const g=new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals()
    this.patch=new THREE.Mesh(g,new THREE.MeshStandardMaterial({color:'#d7dfd0',roughness:1,side:THREE.DoubleSide}))
  }
  private add(g:THREE.BufferGeometry,color:string){if(!this.batches.has(color))this.batches.set(color,[]);if(g.index){const flat=g.toNonIndexed();g.dispose();g=flat}this.batches.get(color)!.push(g)}
  update(month:number){
    const active=physicallyKnown('1127358152',month);this.target=active?1:0
    const field=fieldReferenceAt(month)
    if(active===this.active&&field===this.field)return
    this.active=active;this.field=field
    const p=this.patch.geometry.getAttribute('position')
    for(let i=0;i<p.count;i++)p.setY(i,mccGround(p.getX(i),p.getZ(i),active,field))
    p.needsUpdate=true;this.patch.geometry.computeVertexNormals()
  }
  tick(time:number){
    const dt=Math.min(.05,this.lastTime?(time-this.lastTime)/1000:.016);this.lastTime=time
    this.group.position.y=THREE.MathUtils.lerp(this.group.position.y,this.target?0:-18,1-Math.exp(-12*dt))
    this.group.visible=this.target===1||this.group.position.y> -17.9
  }
  get debug(){return{active:this.active,levels:mccLevels,objects:this.group.children.length,roofField:true,stairFlights:3,campusLanding:heightAt(-362,310)+.25}}
}
