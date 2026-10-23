import {events,monthIndex,splitMonth,type TimeEvent} from './timeline'

export interface SpatialChange {id:string;events:TimeEvent[];uncertain:boolean}
/** Administrative records stay records; no mesh visibility creates an event. */
export function changesBetween(from:number,to:number):TimeEvent[]{
  const lo=Math.min(from,to),hi=Math.max(from,to)
  if(lo===hi)return []
  return events.filter(e=>{
    if(!e.position||e.category==='observation')return false
    if(e.date.month){const at=monthIndex(e.date.year,e.date.month);return lo<at&&at<=hi}
    if(e.date.untilYear)return splitMonth(lo).year<=e.date.untilYear&&splitMonth(hi).year>=e.date.year
    // No January anchor invented for a year/period-only record.
    return splitMonth(lo).year<=e.date.year&&splitMonth(hi).year>=e.date.year
  })
}
export function clusterChanges(records:TimeEvent[]):SpatialChange[]{
  const groups:SpatialChange[]=[]
  for(const event of records){
    const group=groups.find(g=>{const p=g.events[0].position!,q=event.position!;return Math.hypot(p[0]-q[0],p[1]-q[1])<38})
    if(group){group.events.push(event);group.uncertain||=!event.date.month}
    else groups.push({id:event.id,events:[event],uncertain:!event.date.month})
  }
  return groups
}
export const recordKind=(event:TimeEvent)=>event.category==='observation'?'관측 기록 · 준공/철거 이력 아님':event.category==='uncertain-transition'?'시기 불확실 · 비교 구간은 철거 기간 아님':['demolition-report','demolition-complete','construction-report','approval'].includes(event.category)?'행정 기록 · 실제 작업일과 구분':event.category==='occupancy'||event.category==='relocation'?'기관·공간 사용 변화 · 건물 철거와 별도':'물리 시설·개관 기록'
