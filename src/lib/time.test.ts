import { describe, expect, it } from 'vitest'
import { buildings, CURRENT_YEAR, events, MIN_YEAR } from '../data/history'
import { buildingExists, clampYear, eventYear, visibleEvents } from './time'

const building = (id: string) => buildings.find(item => item.id === id)!
describe('historical time state', () => {
  it('uses verified opening years at their exact boundary', () => {
    for (const item of buildings.filter(item => item.firstVerifiedYear !== null)) {
      expect(buildingExists(item, item.firstVerifiedYear! - 1)).toBe(false)
      expect(buildingExists(item, item.firstVerifiedYear!)).toBe(true)
    }
  })
  it('does not place present Yongin buildings before construction began', () => {
    buildings.filter(item => item.campus === 'nature').forEach(item => expect(buildingExists(item, 1978)).toBe(false))
  })
  it('does not invent a construction year for conceptual buildings', () => {
    const item = building('h-main')
    expect(item.firstVerifiedYear).toBeNull()
    expect(buildingExists(item, 1983)).toBe(false)
    expect(buildingExists(item, CURRENT_YEAR)).toBe(true)
  })
  it('is deterministic after rapid forward and backward changes', () => {
    const item = building('mcc')
    const jumps = [CURRENT_YEAR, 1979, 2021, 1948, CURRENT_YEAR, 2005, 2008, 2021, 2010]
    expect(jumps.map(year => buildingExists(item, year))).toEqual([true, false, true, false, true, false, false, true, false])
    expect(buildingExists(item, 2010)).toBe(false)
  })
  it('clamps years and rejects non-finite values', () => {
    expect(clampYear(0)).toBe(MIN_YEAR)
    expect(clampYear(9999)).toBe(CURRENT_YEAR)
    expect(clampYear(NaN)).toBe(CURRENT_YEAR)
    expect(clampYear(2005.9)).toBe(2006)
  })
  it('moves through distinct event years in both directions', () => {
    expect(eventYear(1988, 1)).toBe(1989)
    expect(eventYear(2008, -1)).toBe(2006)
    expect(eventYear(2008, 1)).toBe(2010)
    expect(eventYear(2021, 1)).toBe(CURRENT_YEAR)
    expect(eventYear(1948, -1)).toBe(MIN_YEAR)
  })
  it('shows exact-year and past building markers, with one central marker', () => {
    expect(visibleEvents('humanities', 2005).some(event => event.buildingId === 'dorm')).toBe(false)
    expect(visibleEvents('humanities', 2006).some(event => event.buildingId === 'dorm')).toBe(true)
    expect(visibleEvents('nature', 2008).filter(event => event.buildingId)).toHaveLength(2)
    expect(visibleEvents('humanities', 2026).filter(event => !event.buildingId)).toHaveLength(1)
    expect(visibleEvents('nature', 1978)).toHaveLength(0)
  })
  it('keeps administrative events separate from architecture and ensures source integrity', () => {
    for (const event of events) {
      expect(event.sourceUrl).toMatch(/^https:\/\/(.*\.)?mju\.ac\.kr\//)
      if (event.buildingId) expect(building(event.buildingId).firstVerifiedYear).toBe(event.year)
      else expect(event.category).not.toBe('building')
    }
    expect(new Set(events.map(event => event.id)).size).toBe(events.length)
  })
})
