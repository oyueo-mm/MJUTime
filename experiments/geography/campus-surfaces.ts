import * as THREE from 'three'
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js'
import {heightAt,inRing,mapData,type Point} from './spatial'
import {fieldRing,fieldElevation,fieldReferenceAt,historicalGround} from './campus-ground'
import {gymScenarioAt} from './old-gym'

function surface(ring:Point[],color:string,sample:(x:number,z:number)=>number){
  const source=new THREE.ShapeGeometry(new THREE.Shape(ring.map(([x,z])=>new THREE.Vector2(x,z)))).toNonIndexed(),positions:number[]=[]
  const subdivide=(a:Point,b:Point,c:Point)=>{
    if(Math.max(Math.hypot(a[0]-b[0],a[1]-b[1]),Math.hypot(b[0]-c[0],b[1]-c[1]),Math.hypot(c[0]-a[0],c[1]-a[1]))>5){
      const ab:Point=[(a[0]+b[0])/2,(a[1]+b[1])/2],bc:Point=[(b[0]+c[0])/2,(b[1]+c[1])/2],ca:Point=[(c[0]+a[0])/2,(c[1]+a[1])/2]
      subdivide(a,ab,ca);subdivide(ab,b,bc);subdivide(ca,bc,c);subdivide(ab,bc,ca)
    }else for(const [x,z] of [a,b,c])positions.push(x,sample(x,z)+.14,z)
  }
  const p=source.getAttribute('position');for(let i=0;i<p.count;i+=3)subdivide([p.getX(i),p.getY(i)],[p.getX(i+1),p.getY(i+1)],[p.getX(i+2),p.getY(i+2)])
  source.dispose();const g=new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.computeVertexNormals()
  return new THREE.Mesh(g,new THREE.MeshStandardMaterial({color,roughness:1,side:THREE.DoubleSide}))
}
function line(points:Point[],color:string,sample=heightAt){return new THREE.Line(new THREE.BufferGeometry().setFromPoints(points.map(([x,z])=>new THREE.Vector3(x,sample(x,z)+.25,z))),new THREE.LineBasicMaterial({color}))}
/** Cached ground, field, inferred parking stripes and planted edges. */
export class CampusSurfaces {
  readonly group=new THREE.Group()
  private field=new THREE.Group()
  private parking=new THREE.Group()
  private forecourt=new THREE.Group()
  private greenery=new THREE.Group()
  constructor(){
    const flat=()=>fieldElevation
    this.field.add(surface(fieldRing,'#baaa83',flat),line([...fieldRing,fieldRing[0]],'#e9e2c9',flat))
    // Marking layout and fence detail are illustrative, not surveyed field lines.
    const center:Point=[fieldRing.reduce((s,p)=>s+p[0],0)/fieldRing.length,fieldRing.reduce((s,p)=>s+p[1],0)/fieldRing.length]
    const inner=fieldRing.map(([x,z]):Point=>[center[0]+(x-center[0])*.9,center[1]+(z-center[1])*.9])
    this.field.add(line([...inner,inner[0]],'#e2d8bb',flat))
    const sides:number[]=[]
    for(let i=0;i<fieldRing.length;i++){
      const a=fieldRing[i],b=fieldRing[(i+1)%fieldRing.length]
      // Retaining skirt makes the assumed plateau meet the sloping DEM.
      for(const [x,z,top] of [[a[0],a[1],1],[b[0],b[1],1],[a[0],a[1],0],[b[0],b[1],1],[b[0],b[1],0],[a[0],a[1],0]])sides.push(x,top?fieldElevation:heightAt(x,z),z)
    }
    const skirt=new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute(sides,3));skirt.computeVertexNormals();this.field.add(new THREE.Mesh(skirt,new THREE.MeshStandardMaterial({color:'#aaa58e',side:THREE.DoubleSide})))
    const apron:Point[]=[[-417,301],[-279,295],[-277,321],[-414,327]]
    this.parking.add(surface(apron,'#8e9591',heightAt))
    for(let i=0;i<25;i++){
      const x=-410+i*5.1
      this.parking.add(line([[x,304],[x+.3,315]],'#d9d9ca'))
    }
    const markings=this.parking.children.filter(o=>o instanceof THREE.Line) as THREE.Line[]
    const markingGeometry=mergeGeometries(markings.map(l=>l.geometry))
    for(const l of markings){this.parking.remove(l);l.geometry.dispose();(l.material as THREE.Material).dispose()}
    if(markingGeometry)this.parking.add(new THREE.LineSegments(markingGeometry,new THREE.LineBasicMaterial({color:'#d9d9ca'})))
    const courtyard:Point[]=[[-229,251],[-147,249],[-149,276],[-228,278]]
    this.forecourt.add(surface(courtyard,'#a6ad9e',heightAt),line([...courtyard,courtyard[0]],'#e2e3d5'))
    // Campus approaches from observed road context; widths/materials are proxies.
    for(const ring of [
      [[-276,291],[-262,289],[-238,358],[-249,366]],
      [[-249,361],[-239,367],[-300,427],[-311,422]],
    ] as Point[][])this.parking.add(surface(ring,'#a8aaa0',(x,z)=>historicalGround(x,z,true)))
    // Trees are a visual landscape assumption; no historical inventory is asserted.
    const trunks:THREE.BufferGeometry[]=[],crowns:THREE.BufferGeometry[]=[]
    const university=mapData.sites.find(s=>s.id==='university')!
    for(let n=0;n<25;n++){
      const x=-421+n*6,z=301-Math.sin(n*.8)*1.8
      if(!inRing([x,z],university.p))continue
      const y=heightAt(x,z),trunk=new THREE.CylinderGeometry(.3,.4,3,5);trunk.translate(x,y+1.5,z);trunks.push(trunk.toNonIndexed());trunk.dispose()
      const crown=new THREE.IcosahedronGeometry(2.5,1);crown.translate(x,y+4,z);crowns.push(crown)
    }
    for(const [parts,color] of [[trunks,'#82765e'],[crowns,'#82966e']] as const){const g=mergeGeometries(parts);parts.forEach(p=>p.dispose());if(g)this.greenery.add(new THREE.Mesh(g,new THREE.MeshStandardMaterial({color,roughness:1})))}
    this.group.add(this.field,this.parking,this.forecourt,this.greenery)
  }
  update(month:number){const old=fieldReferenceAt(month);this.field.visible=old;this.parking.visible=old;this.forecourt.visible=gymScenarioAt(month);this.greenery.visible=month>=2001*12+8}
  debug(){return{fieldVisible:this.field.visible,parkingVisible:this.parking.visible,courtVisible:this.forecourt.visible,fieldLevel:fieldElevation,groundConfidence:'DEM + inferred flat athletic plateau; no surveyed historic elevation'}}
}
