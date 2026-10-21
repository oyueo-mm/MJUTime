import {it,expect} from 'vitest'
import {campusRegister,featureEvidence} from './campus-evidence'
import {monthIndex,buildingKnown,events} from './timeline'
it('keeps five documented older buildings through every intermediate month, independently of occupancy',()=>{
  for(const b of campusRegister.slice(0,5)){
    const start=monthIndex(b.completed[0],b.completed[1])
    expect(buildingKnown(b.id,start-1)).toBe(false)
    for(let month=start;month<=monthIndex(2026,10);month++)expect(buildingKnown(b.id,month)).toBe(true)
  }
  for(const year of [1985,1990,2000,2001,2010,2020,2026]){
    expect(buildingKnown('462990137',monthIndex(year,1))).toBe(true)
    expect(buildingKnown('462990141',monthIndex(year,12))).toBe(true)
  }
  expect(buildingKnown('1127358152',monthIndex(2020,12))).toBe(false)
  expect(events.find(e=>e.id==='library')!.date.month).toBe(3) // physical completion January is separate
})
it('does not turn a reference field or road into an observed capture, or carry it across redevelopment',()=>{
  expect(featureEvidence('01-university-field',monthIndex(2000,6))).toBe('reference')
  expect(featureEvidence('01-road',monthIndex(2000,6))).toBe('reference')
  expect(featureEvidence('01-university-field',monthIndex(2001,9))).toBe('observed')
  expect(featureEvidence('01-university-field',monthIndex(2020,6))).toBe('hidden')
  expect(featureEvidence('85-west-roof',monthIndex(1990,1))).toBe('hidden')
})
