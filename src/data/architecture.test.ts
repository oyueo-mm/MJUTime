import { describe, expect, it } from 'vitest'
import { buildings, CURRENT_YEAR, eventPosition, events } from './history'
import { architecture, geoToWorld, terrainHeight } from './architecture'
import { buildingExists } from '../lib/time'

describe('architecture and historical evidence remain independent',()=>{
  it('preserves the five official opening years and IDs',()=>{
    expect(Object.fromEntries(buildings.filter(b=>b.firstVerifiedYear).map(b=>[b.id,b.firstVerifiedYear]))).toEqual({dorm:2006,library:2010,mcc:2021,science:2008,chapel:2008})
  })
  it('gives every model a source, confidence and explicit uncertainty',()=>{
    for(const b of buildings){
      expect(architecture[b.id]).toBeDefined()
      expect(b.sourceReferences.length).toBeGreaterThan(0)
      expect(b.estimated.length).toBeGreaterThan(10)
      expect(b.isConceptual).toBe(b.modelConfidence==='C')
      expect(b.position.every(Number.isFinite)).toBe(true)
      expect(b.dimensions.every(value=>value>0)).toBe(true)
      expect(b.name).not.toContain('?')
    }
  })
  it('uses consistent east/north orientation and the official POI anchors',()=>{
    expect(geoToWorld('humanities',37.5801,126.9231)).toEqual([0,0,0])
    expect(architecture.library.position[0]).toBeGreaterThan(architecture['h-student'].position[0])
    expect(architecture.dorm.position[2]).toBeLessThan(architecture['h-main'].position[2])
    expect(architecture.mcc.position[2]).toBeGreaterThan(architecture['h-main'].position[2])
    expect(architecture.science.position[0]).toBeGreaterThan(architecture.chapel.position[0])
    expect(architecture.science.position[2]).toBeGreaterThan(architecture.chapel.position[2])
    expect(terrainHeight('nature',0,15)).toBeGreaterThan(terrainHeight('nature',0,-15))
  })
  it('does not assign historical existence to a newly documented facade',()=>{
    const unknown=buildings.filter(b=>b.firstVerifiedYear===null)
    expect(unknown.some(b=>b.modelConfidence==='B')).toBe(true)
    expect(unknown.some(b=>b.modelConfidence==='C')).toBe(true)
    for(const b of unknown){expect(buildingExists(b,CURRENT_YEAR-1)).toBe(false);expect(buildingExists(b,CURRENT_YEAR)).toBe(true)}
  })
  it('attaches markers above their relocated architecture rather than stale coordinates',()=>{
    for(const event of events.filter(e=>e.buildingId)){
      const b=buildings.find(b=>b.id===event.buildingId)!
      const position=eventPosition(event)
      expect(position[0]).toBe(b.position[0]);expect(position[2]).toBe(b.position[2])
      expect(position[1]).toBeGreaterThan(b.baseHeight+b.dimensions[1])
    }
  })
})
