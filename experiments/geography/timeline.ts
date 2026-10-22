import {sources,type SourceId} from './history'
import {mapData,type Point} from './spatial'
import additionalAerial from './data/additional-aerial.json'
import additionalRegistration from './data/additional-registration.json'
import {campusRegister,legacyCampus,registered,physicallyKnown,registerSource} from './campus-evidence'

export const monthIndex=(year:number,month=1)=>year*12+month-1
export const splitMonth=(value:number)=>({year:Math.floor(value/12),month:value%12+1})
export const monthLabel=(value:number)=>{const {year,month}=splitMonth(value);return `${year}.${String(month).padStart(2,'0')}`}
export const MIN_MONTH=monthIndex(1948,1)
const now=new Date()
export const MAX_MONTH=monthIndex(now.getFullYear(),now.getMonth()+1)
export const clampMonth=(value:number)=>Math.max(MIN_MONTH,Math.min(MAX_MONTH,Math.round(value)))
export interface EvidenceDate {year:number;month?:number;day?:number;precision:'day'|'month'|'year'|'period'}
export interface TimeEvent {
  id:string;date:EvidenceDate;title:string;category:'occupancy'|'relocation'|'opening'|'observation'|'demolition-report'|'demolition-complete'|'construction-report'|'completion'|'approval'
  sourceUrl:string;note:string;position?:Point;from?:Point;buildingId?:string;projectId?:string;recordedAt?:string;dateKind?:'catalog'|'capture'
}
const date=(year:number,month?:number,day?:number):EvidenceDate=>({year,month,day,precision:day?'day':month?'month':'year'})
const url=(id:SourceId)=>sources[id].url
export const projectSources={
  namgajwa:'https://cleanup.seoul.go.kr/cafe/mainIndx/cleanup-prtnelapse/vscr.do?bsnsPk=11410-100008009&cafeId=410100008009I86',
  hongeun:'https://cleanup.seoul.go.kr/cafe/mainIndx/cleanup-prtnelapse/vscr.do?bsnsPk=11410-100003003&cafeId=410100003003O20',
  hongeun2:'https://cleanup.seoul.go.kr/cafe/mainIndx/cleanup-prtnelapse/vscr.do?bsnsPk=11410-100010002&cafeId=410100010002o22',
}
export const events:TimeEvent[]=[
  ...additionalRegistration.records.map(r=>({id:`aerial-capture-${r.year}`,date:date(r.year,r.month,r.day),dateKind:'capture' as const,title:`${r.year} 항공사진 촬영 · 여백 날짜 판독`,category:'observation' as const,sourceUrl:r.sourceUrl,note:`objectId ${r.objectId}, ${r.zone}, ${r.course}/${r.number}. 원본 미리보기 여백 촬영일 확인. 수동 지붕 중심 정합 RMS ${r.fitRmsMetres.toFixed(1)}m, 교차검증 최대 ${r.leaveOneOutMaxMetres.toFixed(1)}m. 정사보정·독립 측량 정확도가 아닙니다.`})),
  ...campusRegister.map(b=>({id:`register-${b.id}`,date:date(b.completed[0],b.completed[1],b.completed[2]),title:`${b.name} · 대장 준공`,category:'completion' as const,buildingId:b.id,position:mapData.buildings.find(d=>d.id===b.id)!.center as Point,sourceUrl:registerSource,note:`2023.02.15 기준 대학 시설 현황(건축물대장 기준). 지하 ${b.below}층·지상 ${b.above}층. 개관·기관 이전일과 별도입니다. 당시 증축·외관은 미확인, 현 OSM 윤곽·층고 추정 모델입니다.`})),
  {id:'elementary-1976',date:date(1976,2,28),title:'국민학교 남가좌동 이전',category:'relocation',sourceUrl:url('elementary'),position:[-326.8,294.5],note:'남가좌동 50-3 이전. 주소 권역 대표점이며 교사 윤곽 미확인.'},
  {id:'international',date:{year:1984,precision:'period'},title:'국제대학 · 학생회관 사용 시기',category:'occupancy',sourceUrl:url('newspaper'),position:[-271.61,268.89],buildingId:'462990141',note:'1984년 이후 시기 서술, 시작 월·종료일 미확인. 현재 학생회관 위치 참조 점선이며 당시 윤곽 복원이 아닙니다.'},
  {id:'photo-1985',date:date(1985,10,21),title:'1985 항공사진 관측',category:'observation',sourceUrl:url('aerial'),position:[85,-174],note:'국소 전사 지붕 2개·운동장·도로. 해당 촬영 월에만 관측 형상 표시. 월 내 날짜 차이는 미확인.'},
  {id:'elementary-build',date:date(1997,5,16),title:'초등학교 홍은동 교사 준공',category:'opening',sourceUrl:url('elementary'),position:[189.87,-57.65],note:'공식 준공 기록. 당시 교사 형상이 검증되지 않아 위치 표식만 표시.'},
  {id:'elementary-move',date:date(1997,6,9),title:'초등학교 홍은동 이전',category:'relocation',sourceUrl:url('elementary'),position:[189.87,-57.65],from:[-326.8,294.5],note:'기관 이전선. 통학로·옛 교사 철거를 뜻하지 않습니다. 출발점은 주소 권역 대표점.'},
  {id:'college-move',date:date(2001,8),title:'전문대 이전 · 본관·공학관 준공',category:'relocation',sourceUrl:url('college'),position:[-150.13,-210.81],from:[-326.8,294.5],note:'남가좌동 50-3 → 홍은3동 356-1. 일 미확인. 이전선은 통학 경로가 아닙니다. 현 OSM 윤곽은 당시 외형의 정확한 복원이 아닙니다.'},
  {id:'photo-2001',date:date(2001,9,13),title:'2001 항공사진 관측',category:'observation',sourceUrl:url('aerial'),position:[-326.8,294.5],note:'국소 전사 지붕 5개·운동장 2개·도로. 월 사이 형상 보간 없음.'},
  {id:'dorm',date:date(2006,2),title:'인문생활관 개관',category:'opening',sourceUrl:url('university'),position:[-303.27,211.55],buildingId:'462990142',note:'개관 월 확인, 일 미확인. 현 OSM 윤곽·표시 높이를 참고 모델로 사용; 준공 후 매월 외형은 미검증.'},
  {id:'nam-demolition',date:date(2010,2,11),title:'남가좌1 철거신고',category:'demolition-report',sourceUrl:projectSources.namgajwa,projectId:'namgajwa1',position:[-620,195],note:'신고 접수일이며 실제 철거 시작·완료일이 아닙니다. 개별 옛 건물은 좌표·철거일 미확인으로 생성·삭제하지 않음.'},
  {id:'library',date:date(2010,3),title:'방목학술정보관 개관',category:'opening',sourceUrl:url('library'),position:[-182.44,219.43],buildingId:'462990139',note:'개관 월 확인. 현 OSM 윤곽 참조, 정확한 당시 외형·이후 변경일 미확인.'},
  {id:'nam-construction',date:date(2016,5,12),title:'남가좌1 착공신고',category:'construction-report',sourceUrl:projectSources.namgajwa,projectId:'namgajwa1',position:[-620,195],note:'공식 착공신고 기록. 3D 격자는 공사 단계 기호이며 실제 건물·공정률·지구계가 아닙니다.'},
  {id:'nam-completion',date:date(2018,10,30),recordedAt:'2019-01-02',title:'남가좌1 공사완료 기록',category:'completion',sourceUrl:projectSources.namgajwa,projectId:'namgajwa1',position:[-620,195],note:'2019.01.02 인가고시 항목의 공사완료일. 2018.10.31 사용허가·12.31 준공인가와 구별. 건물별 완료일 미확인.'},
  {id:'nam-approval',date:date(2018,12,31),title:'남가좌1 준공인가',category:'approval',sourceUrl:projectSources.namgajwa,projectId:'namgajwa1',position:[-620,195],note:'행정 인가일. 3D 단계 기호의 색이 바뀌며 개별 아파트 준공 월로 전파하지 않습니다.'},
  {id:'hong2-demolition',date:date(2019,4,3),title:'홍은2 건축물 철거멸실신고',category:'demolition-report',sourceUrl:projectSources.hongeun2,projectId:'hongeun2',position:[-148,-377],note:'신고일. 현재 단지 위치를 참조하며 실제 옛 건물의 철거 시작일·윤곽을 뜻하지 않음.'},
  {id:'hong2-cleared',date:date(2019,8,21),title:'홍은2 철거완료 · 말소신고 기록',category:'demolition-complete',sourceUrl:projectSources.hongeun2,projectId:'hongeun2',position:[-148,-377],note:'공식 철거완료 항목의 건축물철거말소신고. 실제 철거 작업의 마지막 날은 미확인. 현재 OSM 단지 범위 참조선이며 공식 지구계 아님.'},
  {id:'hong2-construction',date:date(2019,10,8),title:'홍은2 착공신고',category:'construction-report',sourceUrl:projectSources.hongeun2,projectId:'hongeun2',position:[-148,-377],note:'현 OSM 8개 동을 공사 단계의 참조 격자로 표시. 당시 설계·층별 공정률·월별 외형을 복원한 것이 아님.'},
  {id:'hong2-completion',date:date(2022,11,25),recordedAt:'2024-01-03',title:'홍은2 공사완료 기록',category:'completion',sourceUrl:projectSources.hongeun2,projectId:'hongeun2',position:[-148,-377],note:'2024.01.03 인가고시 항목에 기록된 공사완료일. 현재 OSM 윤곽·태그 높이로 참조 모델 표시; 완료 당시 외형은 별도 미검증.'},
  {id:'hong2-approval',date:date(2023,12,29),title:'홍은2 준공인가',category:'approval',sourceUrl:projectSources.hongeun2,projectId:'hongeun2',position:[-148,-377],note:'행정 인가일. 공사완료 기록 2022.11.25 및 고시 2024.01.03과 분리. 공식 고시: 서대문구청 288669.'},
  {id:'hong-demolition',date:date(2020,7,30),title:'홍은13 철거신고 · 지도 범위 밖',category:'demolition-report',sourceUrl:projectSources.hongeun,projectId:'hongeun13',note:'홍은동 11-111. 현 DEM/OSM 범위 밖으로 목록만 제공. 실제 철거일 아님.'},
  {id:'hong-construction',date:date(2021,7,25),title:'홍은13 착공신고 · 지도 범위 밖',category:'construction-report',sourceUrl:projectSources.hongeun,projectId:'hongeun13',note:'정보몽땅 신고일 07.25. 구청 소식지의 실제 착공 서술 07.15와 구별하며 신고 이력을 보존.'},
  {id:'mcc',date:date(2021,8),title:'MCC관 신축·봉헌',category:'opening',sourceUrl:url('mcc'),position:[-345.56,352.7],buildingId:'1127358152',note:'2021.08 공식 연혁. 현 OSM 윤곽 참조. 옛 운동장의 소멸 시점은 미확인으로 임의 철거 월을 설정하지 않음.'},
  {id:'hong-completion',date:date(2025,6,25),recordedAt:'2026-09-09',title:'홍은13 공사완료 기록 · 범위 밖',category:'completion',sourceUrl:projectSources.hongeun,projectId:'hongeun13',note:'2026.09.09 인가고시에 적힌 공사완료일. 신청·완료·인가 날짜를 분리 보존.'},
  {id:'hong-approval',date:date(2026,9,4),title:'홍은13 준공인가 · 지도 범위 밖',category:'approval',sourceUrl:projectSources.hongeun,projectId:'hongeun13',note:'실제 공사완료 기록과 별도 행정 인가. 범위 밖 지형·건물을 임의로 추가하지 않음.'},
  {id:'osm-current',date:date(2026,10,21),title:'현재 OSM 수집',category:'observation',sourceUrl:'https://www.openstreetmap.org/copyright',note:'건물 2,667개와 도로. 수집일은 건물 준공일·항공 촬영일이 아닙니다.'},
  ...additionalAerial.records.map(record=>({id:`aerial-record-${record.catalogYear}`,date:date(record.catalogYear),dateKind:'catalog' as const,title:`${record.catalogYear} 항공사진 ${record.previewViewed?'열람':'목록만 확인'} · 월 미확인`,category:'observation' as const,sourceUrl:additionalAerial.sourceUrl,note:`목록 연도이며 촬영 월·일은 미확인. ${record.observation}`})),
]
export function dateLabel(d:EvidenceDate){return d.precision==='period'?`${d.year}년 이후 · 월/종료 미확인`:d.month?`${d.year}.${String(d.month).padStart(2,'0')}${d.day?'.'+String(d.day).padStart(2,'0'):' · 일 미확인'}`:`${d.year}년 · 월 미확인`}
export const eventMonth=(e:TimeEvent)=>monthIndex(e.date.year,e.date.month??1)
export const eventsInMonth=(value:number)=>events.filter(e=>e.date.precision==='period'?false:e.date.month?eventMonth(e)===value:splitMonth(value).year===e.date.year)
export function knownAfter(d:EvidenceDate,value:number){return d.precision==='period'?false:value>=monthIndex(d.year,d.month??12)+(d.month?0:1)}
export const photoMonth=(value:number):1985|2001|null=>value===monthIndex(1985,10)?1985:value===monthIndex(2001,9)?2001:null
export const referenceEpoch=(value:number):1985|2001|2026=>value>=monthIndex(2026,10)?2026:value>=monthIndex(2001,9)?2001:1985
export const isCurrent=(value:number)=>value===monthIndex(2026,10)
export function projectStage(id:string,value:number){
  const past=events.filter(e=>e.projectId===id&&knownAfter(e.date,value)).sort((a,b)=>eventMonth(a)-eventMonth(b))
  return past.at(-1)?.category??'unknown'
}
export const trackedBuildings=[
  ...legacyCampus.map(b=>({id:b.id,eventId:`register-${b.id}`,color:'#a08b69'})),
  {id:'795977922',eventId:'college-move',color:'#199282'}, {id:'1123968177',eventId:'college-move',color:'#199282'},
  {id:'462990142',eventId:'dorm',color:'#3975cc'}, {id:'462990139',eventId:'library',color:'#3975cc'}, {id:'1127358152',eventId:'mcc',color:'#3975cc'},
]
export const buildingKnown=(id:string,value:number)=>{if(registered(id))return physicallyKnown(id,value);const b=trackedBuildings.find(b=>b.id===id);return b?knownAfter(events.find(e=>e.id===b.eventId)!.date,value):false}
/** Playback advances discrete months; never creates historical intermediate geometry. */
export function advancePlayback(value:number,carry:number,elapsed:number,speed:number){
  const total=carry+Math.max(0,Math.min(elapsed,.25))*speed,steps=Math.floor(total)
  const next=clampMonth(value+steps)
  return {value:next,carry:next===MAX_MONTH?0:total-steps,ended:next===MAX_MONTH}
}
