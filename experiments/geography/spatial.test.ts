import {describe,it,expect} from 'vitest'
import {heightAt,inRing,mapData,project} from './spatial'
import {buildingExistence,historicalMarkers,occupancy,relocations,urbanChanges} from './history'
describe('geographic experiment evidence boundaries',()=>{
  it('keeps real independent OSM features, IDs and the five institutions',()=>{
    expect(mapData.buildings).toHaveLength(2667)
    expect(new Set(mapData.buildings.map(b=>b.id)).size).toBe(2667)
    expect(mapData.sites.map(s=>s.id)).toEqual(['university','college','elementary','middle','high'])
    expect(mapData.meta.osmApi).toContain('api.openstreetmap.org')
  })
  it('projects east/north consistently, in metre units',()=>{
    const [x,z]=project(...mapData.meta.origin as [number,number]);expect(x).toBeCloseTo(0);expect(z).toBeCloseTo(0)
    expect(project(126.9275,37.58275)[0]).toBeGreaterThan(88)
    expect(project(126.9265,37.58375)[1]).toBeLessThan(-110)
    expect(mapData.sites.find(s=>s.id==='college')!.center[1]).toBeLessThan(mapData.sites[0].center[1])
  })
  it('samples the actual DEM deterministically without exaggeration',()=>{
    expect(mapData.terrain.verticalExaggeration).toBe(1)
    expect(heightAt(...mapData.terrain.min as [number,number])).toBe(mapData.terrain.heights[0])
    expect(heightAt(0,0)).toBe(heightAt(0,0))
    expect(Math.max(...mapData.terrain.heights)).toBeGreaterThan(240)
  })
  it('separates measured tags from height proxies',()=>{
    expect(mapData.buildings.filter(b=>b.heightBasis==='osm-height')).toHaveLength(172)
    expect(mapData.buildings.filter(b=>b.heightBasis==='placeholder').every(b=>b.height===9)).toBe(true)
    expect(inRing([1,1],[[0,0],[2,0],[2,2],[0,2]])).toBe(true)
  })
  it('does not interpret a relocation or OSM start date as demolition',()=>{
    expect(relocations.find(r=>r.institution==='college')?.date).toBe('2001-08')
    expect(buildingExistence.some(b=>b.geometry==='unknown')).toBe(true)
    expect(urbanChanges[0].geometry).toBeNull()
    expect(occupancy.filter(o=>o.snapshot===1985)).toHaveLength(4)
    expect(historicalMarkers[1985].every(m=>Boolean(m.source)&&Boolean(m.note))).toBe(true)
    expect(historicalMarkers[2001].every(m=>Boolean(m.source))).toBe(true)
  })
})
