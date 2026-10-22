import {describe,it,expect} from 'vitest'
import * as THREE from 'three'
import {campusDefinitions,restorationSnapshots,presenceAt,localFootprint} from './integrated-evidence'
import {IntegratedCampus} from './campus-architecture'
import {makeOldGym,gymScenarioAt,gymEvidence} from './old-gym'
import {CampusSurfaces} from './campus-surfaces'
import {monthIndex} from './timeline'
import {heightAt,type Point} from './spatial'

const dispose=(root:THREE.Object3D)=>root.traverse(o=>{if(o instanceof THREE.Mesh||o instanceof THREE.Line){o.geometry.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose()}})
describe('GeoJSON restoration integrated in existing terrain',()=>{
  it('loads the four existing GeoJSONs without assigning geometry to the unknown source gym',()=>{
    expect(restorationSnapshots.map(s=>s.year)).toEqual([2002,2006,2010,2026])
    expect(restorationSnapshots.map(s=>s.features.filter(f=>f.geometry).length)).toEqual([5,6,7,8])
    expect(campusDefinitions.find(f=>f.id==='old-humanities-gym')!.geometry).toBeNull()
  })
  it('changes physical presence independently from detailed model allocation and monthly rewinds',()=>{
    const campus=new IntegratedCampus(),groups=[...campus.models.values()].map(m=>m.group)
    for(const [year,count] of [[2002,5],[2006,6],[2010,7],[2026,7]]){
      campus.update(monthIndex(year,12));for(let n=0;n<40;n++)campus.tick(year*1000+n*16)
      expect(campus.debug().pipelineIds).toHaveLength(count)
      expect(campus.debug().grounded).toBe(true)
    }
    for(let i=0;i<60;i++){campus.update(monthIndex(i%2?2002:2026,1));campus.tick(3000000+i*16)}
    expect([...campus.models.values()].map(m=>m.group)).toEqual(groups)
    // Inspect physical geometry contact, not just finite sample heights.
    for(const model of campus.models.values()){
      model.group.scale.y=1;model.group.updateWorldMatrix(true,true)
      const world=new THREE.Vector3();let contacts=0
      model.group.traverse(o=>{if(o instanceof THREE.Mesh){const p=o.geometry.getAttribute('position');for(let i=0;i<p.count;i++){world.fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld);if(Math.abs(world.y-heightAt(world.x,world.z)+.45)<.05)contacts++}}})
      expect(contacts).toBeGreaterThan(2)
    }
    campus.update(monthIndex(2010,12));campus.tick(4000000);campus.update(monthIndex(2006,12));campus.tick(4000016)
    expect(campus.debug().libraryRendered).toBe(false)
    const library=campusDefinitions.find(f=>f.id==='462990139')!
    expect(presenceAt(library,monthIndex(2009,12))).toBe(false)
    expect(presenceAt(library,monthIndex(2010,1))).toBe(true)
    dispose(campus.group)
  })
  it('keeps gym/library geometry and chronology separate and the private photos out of assets',()=>{
    const gym=makeOldGym(),ring=gym.userData.footprint as Point[]
    expect(ring).toHaveLength(4)
    expect(ring).not.toEqual(localFootprint(campusDefinitions.find(f=>f.id==='462990139')!))
    expect(gymEvidence.photoDates).toBeNull();expect(gymEvidence.demolitionDate).toBeNull()
    for(const year of [2002,2006])expect(gymScenarioAt(monthIndex(year,12))).toBe(true)
    for(const month of [monthIndex(2010,1),monthIndex(2026,10)])expect(gymScenarioAt(month)).toBe(false)
    for(let month=monthIndex(2000,1);month<=monthIndex(2026,12);month++){
      const library=presenceAt(campusDefinitions.find(f=>f.id==='462990139')!,month)
      expect(library&&gymScenarioAt(month)).toBe(false)
    }
    // Every low exterior wall touches or penetrates DEM, never hovers above it.
    const world=new THREE.Vector3();gym.updateMatrixWorld(true);let lowVertices=0
    gym.traverse(o=>{if(o instanceof THREE.Mesh){const p=o.geometry.getAttribute('position');for(let i=0;i<p.count;i++){world.fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld);if(Math.abs(world.y-heightAt(world.x,world.z)+.3)<.05)lowVertices++}expect(o.material).not.toHaveProperty('map',expect.any(THREE.Texture))}})
    expect(lowVertices).toBeGreaterThan(0);dispose(gym)
  })
  it('reuses field/parking/approach geometry and removes the old ground layout for MCC',()=>{
    const surfaces=new CampusSurfaces(),children=[...surfaces.group.children]
    surfaces.update(monthIndex(2006,12));expect(surfaces.debug().fieldVisible).toBe(true);expect(surfaces.debug().courtVisible).toBe(true)
    surfaces.update(monthIndex(2010,12));expect(surfaces.debug().courtVisible).toBe(false)
    surfaces.update(monthIndex(2026,10));expect(surfaces.debug().fieldVisible).toBe(false)
    expect(surfaces.group.children).toEqual(children);dispose(surfaces.group)
  })
})
