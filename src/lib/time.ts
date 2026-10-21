import { CURRENT_YEAR, MIN_YEAR, campusInfo, events, type Building, type Campus } from '../data/history'

export function clampYear(year: number) {
  return Number.isFinite(year) ? Math.min(CURRENT_YEAR, Math.max(MIN_YEAR, Math.round(year))) : CURRENT_YEAR
}
/** Unknown build dates never become invented dates. Undated models appear only in the present. */
export function buildingExists(building: Building, year: number): boolean {
  if (year < campusInfo[building.campus].contextYear) return false
  if (building.firstVerifiedYear === null) return year === CURRENT_YEAR
  return year >= building.firstVerifiedYear
}
export function campusEvents(campus: Campus) {
  return events.filter(event => event.campus === campus || event.campus === 'all')
}
export function eventYear(year: number, direction: -1 | 1) {
  const years = [...new Set(events.map(event => event.year))].sort((a, b) => a - b)
  return direction === 1 ? years.find(y => y > year) ?? CURRENT_YEAR : years.reverse().find(y => y < year) ?? MIN_YEAR
}
export function visibleEvents(campus: Campus, year: number) {
  // Keep one central marker to avoid overlapping administrative events.
  const past = campusEvents(campus).filter(event => event.year <= year)
  const central = past.filter(event => !event.buildingId).at(-1)
  return past.filter(event => event.buildingId || event.id === central?.id)
}
