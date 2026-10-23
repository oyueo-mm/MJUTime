import {describe,it,expect} from 'vitest'
import {changesBetween,clusterChanges,recordKind} from './spatial-changes'
import {monthIndex,events} from './timeline'

describe('evidence-based interval changes',()=>{
  it('finds physical and occupancy records in both travel directions, without observation noise',()=>{
    const a=monthIndex(2001,7),b=monthIndex(2001,9)
    expect(changesBetween(a,b).map(e=>e.id)).toContain('college-move')
    expect(changesBetween(b,a)).toEqual(changesBetween(a,b))
    expect(changesBetween(a,a)).toEqual([])
    expect(changesBetween(monthIndex(2026,9),monthIndex(2026,10))).toEqual([])
    expect(changesBetween(a,b).some(e=>e.category==='observation')).toBe(false)
  })
  it('keeps uncertain transitions unanchored to any month and separate from actual demolition',()=>{
    const transition=changesBetween(monthIndex(2006,12),monthIndex(2010,1)).find(e=>e.id==='gym-library-transition')!
    expect(transition.date.month).toBeUndefined();expect(transition.category).toBe('uncertain-transition')
    expect(changesBetween(monthIndex(2025,10),monthIndex(2026,10)).some(e=>e.id===transition.id)).toBe(false)
    expect(recordKind(events.find(e=>e.id==='hong2-demolition')!)).toContain('행정 기록')
  })
  it('clusters co-located completion/opening records while preserving every source event',()=>{
    const records=changesBetween(monthIndex(2009,12),monthIndex(2010,3))
    const clusters=clusterChanges(records)
    expect(clusters.flatMap(c=>c.events)).toHaveLength(records.length)
    expect(clusters.some(c=>c.events.some(e=>e.id==='library')&&c.events.some(e=>e.id==='register-462990139'))).toBe(true)
  })
})
