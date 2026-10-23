import * as THREE from 'three'
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js'

/** Shared allocation, not a shared building shape. One draw per material. */
export class Builder {
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
  finish(){
    for(const [color,parts] of this.parts){
      const g=mergeGeometries(parts);parts.forEach(p=>p.dispose())
      if(g)this.group.add(new THREE.Mesh(g,new THREE.MeshStandardMaterial({color,roughness:color==='#78afb0'?.38:.82})))
    }
    this.parts.clear();return this.group
  }
}
