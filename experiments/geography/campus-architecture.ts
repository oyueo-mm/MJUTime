import * as THREE from 'three'
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js'
import {heightAt,type Point} from './spatial'
import {campusDefinitions,integratedIds,localFootprint,presenceAt,facadeEvidence,type CampusFeature} from './integrated-evidence'

/** One cached geometry batch per material/building; dates do not rebuild facades. */
class Builder {
  readonly group=new THREE.Group()
  private parts=new Map<string,THREE.BufferGeometry[]>()
  add(g:THREE.BufferGeometry,color:string){
    if(g.index){const flat=g.toNonIndexed();g.dispose();g=flat}
    if(!this.parts.has(color))this.parts.set(color,[])
    this.parts.get(color)!.push(g)
  }
  box(w:number,h:number,d:number,x:number,y:number,z:number,color:string,angle=0){
    const g=new THREE.BoxGeometry(w,h,d);g.rotateY(angle);g.translate(x,y,z);this.add(g,color)
  }
  finish(){for(const [color,parts] of this.parts){const g=mergeGeometries(parts);parts.forEach(p=>p.dispose());if(g)this.group.add(new THREE.Mesh(g,new THREE.MeshStandardMaterial({color,roughness:.82}))) }this.parts.clear();return this.group}
}
export function makeCampusBuilding(f:CampusFeature){
  const ring=localFootprint(f),height=f.properties.heightMetres!,floors=f.properties.above??Math.round(height/3),base=Math.max(...ring.map(p=>heightAt(...p)))
  const center:Point=[ring.reduce((s,p)=>s+p[0],0)/ring.length,ring.reduce((s,p)=>s+p[1],0)/ring.length]
  const dorm=f.id==='462990142',library=f.id==='462990139',main=f.id==='462990137',builder=new Builder()
  const wall=dorm?'#b78468':library?'#aac8c7':'#ddd8ca',glass=library?'#67999e':'#516d7c'
  const g=new THREE.ExtrudeGeometry(new THREE.Shape(ring.map(([x,z])=>new THREE.Vector2(x,-z))),{depth:height,bevelEnabled:false,curveSegments:1});g.rotateX(-Math.PI/2)
  const p=g.getAttribute('position')
  for(let i=0;i<p.count;i++)p.setY(i,p.getY(i)<.01?heightAt(p.getX(i),p.getZ(i))-.45:base+height)
  g.computeVertexNormals();builder.add(g,wall)
  // Windows are inferred spacing; the current photo is not proof of an old facade.
  for(let i=0;i<ring.length;i++){
    const a=ring[i],b=ring[(i+1)%ring.length],dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz)
    if(len<1)continue
    const angle=-Math.atan2(dz,dx),nx=dz/len,nz=-dx/len,mx=(a[0]+b[0])/2,mz=(a[1]+b[1])/2
    // Ring winding is not assumed: select the outward normal using center.
    const sign=(mx-center[0])*nx+(mz-center[1])*nz>=0?1:-1
    const ox=nx*sign*.16,oz=nz*sign*.16
    for(let floor=0;floor<floors;floor++){
      const y=base+(floor+.53)*height/floors
      if(library)builder.box(len,.16,.26,mx+ox,base+(floor+1)*height/floors,mz+oz,'#dddccf',angle)
      const bays=Math.max(1,Math.floor(len/(dorm?4.2:main?5:4)))
      for(let bay=0;bay<bays;bay++){
        const t=(bay+.5)/bays,x=a[0]+dx*t+ox,z=a[1]+dz*t+oz
        builder.box(len/bays*(library?.86:main?.72:.57),height/floors*(library?.72:.46),.18,x,y,z,glass,angle)
      }
      if(!library)builder.box(len,.22,.25,mx+ox,base+(floor+1)*height/floors-.12,mz+oz,'#f0eee3',angle)
    }
    // Raised coping follows the actual polygon; no fictitious gabled lecture blocks.
    builder.box(len,.5,.45,mx,base+height+.25,mz,'#b8b9ae',angle)
  }
  // Small roof equipment is illustrative, not a claimed historic installation.
  if(!library)builder.box(7,1.5,4,center[0],base+height+.75,center[1],'#bfc2b9')
  const group=builder.finish();for(const child of group.children)(child as THREE.Mesh).geometry.translate(-center[0],-base,-center[1]);group.position.set(center[0],base,center[1]);group.userData={id:f.id,evidence:f.properties,base,height,ring,center,facade:main?facadeEvidence.main:dorm?facadeEvidence.dorm:library?facadeEvidence.library:facadeEvidence.other}
  return group
}
export class IntegratedCampus {
  readonly group=new THREE.Group()
  readonly models=new Map<string,{group:THREE.Group;feature:CampusFeature;present:boolean}>()
  private lastTime=0
  constructor(){
    for(const feature of campusDefinitions){if(!integratedIds.has(feature.id))continue;const group=makeCampusBuilding(feature);group.scale.y=.001;this.models.set(feature.id,{group,feature,present:false});this.group.add(group)}
  }
  update(month:number){for(const model of this.models.values())model.present=presenceAt(model.feature,month)}
  tick(time:number){const dt=Math.min(.05,this.lastTime?(time-this.lastTime)/1000:.016);this.lastTime=time;for(const m of this.models.values()){m.group.scale.y=THREE.MathUtils.lerp(m.group.scale.y,m.present?1:.001,1-Math.exp(-15*dt));m.group.visible=m.feature.id==='462990139'?m.present:m.present||m.group.scale.y>.005}}
  debug(){return{pipelineIds:[...this.models].filter(([,m])=>m.present).map(([id])=>id),pipelineModels:this.models.size,libraryRendered:this.models.get('462990139')!.group.visible,pipelineScales:Object.fromEntries([...this.models].map(([id,m])=>[id,m.group.scale.y])),grounded:[...this.models.values()].every(m=>m.group.userData.ring.every(([x,z]:Point)=>Number.isFinite(heightAt(x,z))))}}
}
