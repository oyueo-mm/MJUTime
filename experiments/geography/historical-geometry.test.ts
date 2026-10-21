import {describe,it,expect} from 'vitest'
import {featuresFor,imageToWorld,photoFeatures,worldRing} from './historical-geometry'
import registration from './data/aerial-registration.json'
import {aerialEvidence,buildingExistence} from './history'
import {mapData,inRing} from './spatial'

describe('historical photo geometry and current audit',()=>{
  it('uses independent traced epochs, never reveals future OSM roofs in the past',()=>{
    expect(featuresFor(1985)).toHaveLength(4)
    expect(featuresFor(2001)).toHaveLength(8)
    expect(featuresFor(2026)).toEqual([])
    expect(photoFeatures.every(f=>f.height===null&&f.source==='aerial')).toBe(true)
    expect(featuresFor(1985).some(f=>/mcc|library|dorm/.test(f.id))).toBe(false)
    for(const f of photoFeatures)expect(worldRing(f).flat().every(Number.isFinite)).toBe(true)
    const [x,z]=imageToWorld([431,420],2001)
    expect(Math.hypot(x+150.13,z+210.81)).toBeLessThan(4)
  })
  it('records the registration limits and image dates, not guessed catalog dates',()=>{
    expect(registration['2001'].rms).toBeCloseTo(5.774,2)
    expect(Math.max(...registration['2001'].leaveOneOut)).toBeGreaterThan(23)
    expect(aerialEvidence.map(a=>a.captureDate)).toEqual(['1985-10-21','2001-09-13'])
    expect(aerialEvidence.every(a=>!a.orthorectificationVerified)).toBe(true)
  })
  it('retains the mapped MCC and major educational buildings',()=>{
    for(const id of ['1127358152','462990137','462990139','462990142','795977922','1123968177','463033408','463033409'])expect(mapData.buildings.some(b=>b.id===id)).toBe(true)
    const mcc=mapData.buildings.find(b=>b.id==='1127358152')!
    expect(inRing(mcc.center,mapData.sites.find(s=>s.id==='university')!.p)).toBe(true)
    expect(buildingExistence.find(b=>b.id==='mcc')!.firstVerified).toBe('2021-08')
  })
})
