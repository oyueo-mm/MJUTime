import * as THREE from 'three'
import {buildingKnown,projectStage,trackedBuildings} from './timeline'
import {heightAt,mapData,type Point} from './spatial'

/** Owned geometries allocated once; month changes only retarget transforms/materials. */
export class TimeScene{
  readonly group=new THREE.Group()
  readonly buildings=new Map<string,{pivot:THREE.Group;mesh:THREE.Mesh;target:number}>()
  readonly housing=new Map<string,{pivot:THREE.Group;mesh:THREE.Mesh;edges:THREE.LineSegments;target:number}>()
  private housingStage='unknown'
  private hongBoundary:THREE.LineLoop
  private project=new THREE.Group()
  private stage='unknown'
  private phaseMaterial=new THREE.MeshStandardMaterial({color:'#d09549',transparent:true,opacity:.75})
  private phaseMesh=new THREE.Mesh(new THREE.BoxGeometry(24,28,24),this.phaseMaterial)
  private phaseEdges=new THREE.LineSegments(new THREE.EdgesGeometry(this.phaseMesh.geometry),new THREE.LineBasicMaterial({color:'#ad7836'}))
  private lastTime=0
  private suppressBuildings=false
  constructor(){
    const area=mapData.areas.find(a=>a.id==='1126398129')!
    this.hongBoundary=new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(area.p.map(([x,z])=>new THREE.Vector3(x,heightAt(x,z)+2,z))),new THREE.LineBasicMaterial({color:'#bb7f43'}))
    this.hongBoundary.visible=false;this.group.add(this.hongBoundary)
    // Approximate address-region marker, NOT a reconstructed building or district boundary.
    this.project.position.set(-620,heightAt(-620,195),195)
    this.phaseMesh.position.y=14;this.phaseEdges.position.y=14
    this.project.add(this.phaseMesh,this.phaseEdges);this.group.add(this.project);this.project.visible=false
  }
  adopt(id:string,geometry:THREE.BufferGeometry,center:Point,base:number){
    const definition=trackedBuildings.find(b=>b.id===id)!
    geometry.translate(-center[0],-base,-center[1])
    const mesh=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color:definition.color,roughness:.9}))
    const pivot=new THREE.Group();pivot.position.set(center[0],base,center[1]);pivot.add(mesh);pivot.scale.y=.001;pivot.visible=false
    this.group.add(pivot);this.buildings.set(id,{pivot,mesh,target:0})
  }
  adoptHousing(id:string,geometry:THREE.BufferGeometry,center:Point,base:number){
    geometry.translate(-center[0],-base,-center[1])
    const mesh=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color:'#6d9c96',roughness:.9}))
    const edges=new THREE.LineSegments(new THREE.EdgesGeometry(geometry),new THREE.LineBasicMaterial({color:'#bb944c',transparent:true,opacity:.7}))
    const pivot=new THREE.Group();pivot.position.set(center[0],base,center[1]);pivot.add(mesh,edges);pivot.visible=false;pivot.scale.y=.001
    this.group.add(pivot);this.housing.set(id,{pivot,mesh,edges,target:0})
  }
  update(value:number,suppressBuildings=false){
    this.suppressBuildings=suppressBuildings
    for(const [id,b] of this.buildings)b.target=buildingKnown(id,value)?1:0
    this.housingStage=projectStage('hongeun2',value)
    const completed=this.housingStage==='completion'||this.housingStage==='approval'
    const construction=this.housingStage==='construction-report'
    this.hongBoundary.visible=this.housingStage!=='unknown'
    ;(this.hongBoundary.material as THREE.LineBasicMaterial).color.set(completed?'#43877a':this.housingStage==='demolition-complete'?'#bf7853':'#bb944c')
    for(const b of this.housing.values()){
      b.target=completed||construction?1:0;b.mesh.visible=completed;b.edges.visible=construction
    }
    const stage=projectStage('namgajwa1',value)
    if(stage===this.stage)return
    this.stage=stage;this.project.visible=stage!=='unknown'
    const solid=stage==='completion'||stage==='approval'
    this.phaseMesh.visible=solid;this.phaseEdges.visible=!solid
    this.phaseMaterial.color.set(stage==='approval'?'#3975cc':'#3e9c81')
    ;(this.phaseEdges.material as THREE.LineBasicMaterial).color.set(stage==='demolition-report'?'#d16c48':'#bc9440')
    // Symbol changes categorically at source dates, never a fabricated monthly construction %.
    this.project.scale.y=stage==='demolition-report'?.15:1
  }
  tick(time:number){
    const dt=Math.min(.05,this.lastTime?(time-this.lastTime)/1000:.016);this.lastTime=time
    for(const b of this.buildings.values()){
      b.pivot.scale.y=THREE.MathUtils.lerp(b.pivot.scale.y,Math.max(.001,b.target),1-Math.exp(-12*dt))
      b.pivot.visible=!this.suppressBuildings&&(b.target===1||b.pivot.scale.y>.005)
    }
    for(const b of this.housing.values()){
      b.pivot.scale.y=THREE.MathUtils.lerp(b.pivot.scale.y,Math.max(.001,b.target),1-Math.exp(-12*dt))
      b.pivot.visible=!this.suppressBuildings&&(b.target===1||b.pivot.scale.y>.005)
    }
  }
  debug(){return{knownBuildings:[...this.buildings].filter(([,b])=>b.target===1).map(([id])=>id),projectStage:this.stage,housingStage:this.housingStage,housingCount:this.housing.size,buildingScales:Object.fromEntries([...this.buildings].map(([id,b])=>[id,b.pivot.scale.y]))}}
}
