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
    // Left hall rises four exposed tiers toward the street; right hall's lower
    // two levels support a roof terrace. Central gap is an outdoor circulation.
    for(const [x0,x1,left] of [[-435,-374,true],[-351,-239,false]] as const){
      const p=piece(x0,x1,302,417)
      volume(p,base,base+f*(left?4:2),'#819b9c')
      for(let n=1;n<=(left?4:2);n++)slab(p,base+n*f,'#e2e4da')
      slab(p,base+f*(left?4:2)+.35,'#8fa67c')
      // Window/solid ratio is a photo-based simplification; not measured bays.
      for(let n=0;n<(left?4:2);n++){
        const front=piece(x0,x1,left?388:380,417)
        volume(front,base+n*f+.65,base+(n+1)*f-.45,'#66868b')
      }
    }
    // Terraced setback on the upper part of the right hall, observed in photo.
    const back=piece(-351,-239,303,334)
    volume(back,base+f*2,base+f*3,'#8eaaaa');slab(back,base+f*3,'#8fa67c')
    // Central stair and landings connect street -> sunken court -> campus.
    for(let n=0;n<32;n++){
      const z=410-n*2.75,y=base+n*(f*2/32)
      const g=new THREE.BoxGeometry(22,.45,2.9);g.translate(-362,y,z);this.add(g,'#d6d9ce')
    }
    // Roof-to-campus landing; its metric levels and width remain estimated.
    slab(piece(-375,-350,303,325),base+f*2,'#d6d9ce')
    // Interior retaining edges reveal the sunken level without a fictional cross.
    for(const x of [-374,-351]){const g=new THREE.BoxGeometry(.7,f*2,85);g.translate(x,base+f,363);this.add(g,'#d6d9ce')}
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
  get debug(){return{active:this.active,levels:mccLevels,objects:this.group.children.length}}
}
