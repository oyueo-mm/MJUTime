import {describe,it,expect} from 'vitest'
import * as THREE from 'three'
import {monthIndex,splitMonth,monthLabel,MAX_MONTH,MIN_MONTH,clampMonth,events,eventsInMonth,knownAfter,photoMonth,buildingKnown,projectStage,advancePlayback,trackedBuildings} from './timeline'
import {defaults,sanitizeSettings,movementSpeed} from './camera-settings'
import {TimeScene} from './time-scene'
import aerial from './data/additional-aerial.json'

describe('monthly timeline and source granularity',()=>{
  it('steps December to January and clamps the actual current month',()=>{
    expect(splitMonth(monthIndex(2000,12)+1)).toEqual({year:2001,month:1})
    expect(monthLabel(monthIndex(2006,2))).toBe('2006.02')
    expect(clampMonth(-1)).toBe(MIN_MONTH);expect(clampMonth(MAX_MONTH+1)).toBe(MAX_MONTH)
  })
  it('does not invent a month for year-only or open-ended period evidence',()=>{
    const record={year:1997,precision:'year' as const}
    for(let m=1;m<=12;m++)expect(knownAfter(record,monthIndex(1997,m))).toBe(false)
    expect(knownAfter(record,monthIndex(1998,1))).toBe(true)
    expect(eventsInMonth(monthIndex(1997,2)).some(e=>e.id==='aerial-record-1997'&&!e.date.month)).toBe(true)
    expect(knownAfter(events.find(e=>e.id==='international')!.date,MAX_MONTH)).toBe(false)
    expect(aerial.records.every(r=>r.captureMonth===null&&r.captureDay===null)).toBe(true)
    expect(aerial.records.find(r=>r.catalogYear===2016)!.previewViewed).toBe(false)
  })
  it('reveals verified buildings at their actual record months, not January',()=>{
    for(const [id,y,m] of [['462990142',2006,2],['462990139',2010,3],['1127358152',2021,8],['795977922',2001,8]] as const){
      expect(buildingKnown(id,monthIndex(y,m)-1)).toBe(false);expect(buildingKnown(id,monthIndex(y,m))).toBe(true)
    }
    expect(buildingKnown('unverified',MAX_MONTH)).toBe(false)
    expect(eventsInMonth(monthIndex(2001,7)).some(e=>e.id==='college-move')).toBe(false)
    expect(eventsInMonth(monthIndex(2001,8)).some(e=>e.id==='college-move')).toBe(true)
  })
  it('keeps dated photo observations separate without holding/interpolating their shapes',()=>{
    expect(photoMonth(monthIndex(1985,9))).toBeNull();expect(photoMonth(monthIndex(1985,10))).toBe(1985)
    expect(photoMonth(monthIndex(2001,9))).toBe(2001);expect(photoMonth(monthIndex(2001,10))).toBeNull()
  })
  it('separates demolition report, construction, physical completion and administrative approval',()=>{
    expect(projectStage('namgajwa1',monthIndex(2010,1))).toBe('unknown')
    expect(projectStage('namgajwa1',monthIndex(2010,2))).toBe('demolition-report')
    expect(projectStage('namgajwa1',monthIndex(2016,4))).toBe('demolition-report')
    expect(projectStage('namgajwa1',monthIndex(2016,5))).toBe('construction-report')
    expect(projectStage('namgajwa1',monthIndex(2018,10))).toBe('completion')
    expect(projectStage('namgajwa1',monthIndex(2018,12))).toBe('approval')
    expect(events.find(e=>e.id==='nam-completion')!.recordedAt).toBe('2019-01-02')
    expect(events.filter(e=>e.projectId==='hongeun13').every(e=>!e.position)).toBe(true)
    expect(projectStage('hongeun2',monthIndex(2019,7))).toBe('demolition-report')
    expect(projectStage('hongeun2',monthIndex(2019,8))).toBe('demolition-complete')
    expect(projectStage('hongeun2',monthIndex(2019,10))).toBe('construction-report')
    expect(projectStage('hongeun2',monthIndex(2022,11))).toBe('completion')
    expect(projectStage('hongeun2',monthIndex(2023,12))).toBe('approval')
  })
  it('replays discrete months with carry, stops at the end and caps background elapsed time',()=>{
    const a=advancePlayback(monthIndex(2001,7),.8,.1,6)
    expect(a.value).toBe(monthIndex(2001,8));expect(a.carry).toBeCloseTo(.4)
    expect(advancePlayback(MAX_MONTH-1,0,.25,120)).toEqual({value:MAX_MONTH,carry:0,ended:true})
    expect(advancePlayback(MIN_MONTH,0,1000,1).value).toBe(MIN_MONTH)
  })
})
describe('camera precision and bounded allocations',()=>{
  it('defaults every sensitivity to one half and validates persisted settings',()=>{
    expect(defaults).toEqual({rotate:.5,pan:.5,zoom:.5,move:.5})
    expect(sanitizeSettings({move:50,pan:-1,zoom:NaN})).toEqual({rotate:.5,pan:.1,zoom:.5,move:1.5})
    expect(movementSpeed(420,.5)).toBeCloseTo(movementSpeed(420,1)/2)
    expect(movementSpeed(420,.5,false,true)).toBeCloseTo(movementSpeed(420,.5)*.2)
    expect(movementSpeed(12,.5)).toBeLessThan(10)
  })
  it('retargets existing meshes during rapid rewind without cloning or leaking scene children',()=>{
    const scene=new TimeScene()
    for(const b of trackedBuildings)scene.adopt(b.id,new THREE.BoxGeometry(10,10,10),[0,0],0)
    const meshes=[...scene.buildings.values()].map(b=>b.mesh),count=scene.group.children.length
    for(let i=0;i<100;i++){scene.update(i%2?MAX_MONTH:MIN_MONTH);scene.tick(i*16)}
    scene.update(monthIndex(2006,1));for(let i=100;i<180;i++)scene.tick(i*16)
    expect(scene.debug().knownBuildings).toEqual(['795977922','1123968177'])
    expect(scene.debug().buildingScales['462990142']).toBeLessThan(.005)
    expect([...scene.buildings.values()].map(b=>b.mesh)).toEqual(meshes);expect(scene.group.children).toHaveLength(count)
    scene.group.traverse(o=>{if(o instanceof THREE.Mesh||o instanceof THREE.Line){o.geometry.dispose();(o.material as THREE.Material).dispose()}})
  })
  it('renders documented housing phases without inventing an old building to demolish',()=>{
    const scene=new TimeScene();scene.adoptHousing('reference',new THREE.BoxGeometry(10,10,10),[0,0],0)
    const b=scene.housing.get('reference')!,objects=scene.group.children.length
    scene.update(monthIndex(2019,8));expect(b.target).toBe(0);expect(b.mesh.visible).toBe(false);expect(b.edges.visible).toBe(false)
    scene.update(monthIndex(2019,10));expect(b.target).toBe(1);expect(b.mesh.visible).toBe(false);expect(b.edges.visible).toBe(true)
    scene.update(monthIndex(2022,11));expect(b.mesh.visible).toBe(true);expect(b.edges.visible).toBe(false)
    scene.update(monthIndex(2019,8));expect(b.target).toBe(0);expect(scene.group.children).toHaveLength(objects)
    scene.group.traverse(o=>{if(o instanceof THREE.Mesh||o instanceof THREE.Line){o.geometry.dispose();(o.material as THREE.Material).dispose()}})
  })
})
