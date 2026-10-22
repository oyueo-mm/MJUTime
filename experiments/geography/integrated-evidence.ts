import geo2002 from './restoration/generated/campus-2002.geojson?raw'
import geo2006 from './restoration/generated/campus-2006.geojson?raw'
import geo2010 from './restoration/generated/campus-2010.geojson?raw'
import geo2026 from './restoration/generated/campus-2026.geojson?raw'
import {project,type Point} from './spatial'

export interface CampusFeature {
  id:string
  geometry:{type:string;coordinates:number[][][]}|null
  properties:{name:string;state:string;grade:string;completed?:string|null;knownBy?:string;above?:number|null;below?:number|null;heightMetres:number|null;geometryBasis?:string;geometryGrade?:string;heightBasis?:string;sources:string[]}
}
export const restorationEpochs=[2002,2006,2010,2026] as const
export const restorationSnapshots=[geo2002,geo2006,geo2010,geo2026].map((raw,i)=>({year:restorationEpochs[i],features:(JSON.parse(raw) as {features:CampusFeature[]}).features}))
export const campusDefinitions=restorationSnapshots.at(-1)!.features
export const integratedIds=new Set(campusDefinitions.filter(f=>f.geometry&&f.id!=='1127358152').map(f=>f.id))
export const localFootprint=(f:CampusFeature):Point[]=>f.geometry?f.geometry.coordinates[0].slice(0,-1).map(([lon,lat])=>project(lon,lat)):[]
export function presenceAt(f:CampusFeature,month:number){
  const date=f.properties.completed??f.properties.knownBy
  if(!date||!f.geometry)return false
  const [year,m]=date.split('-').map(Number)
  return month>=year*12+m-1 // UI is an explicitly month-end summary, not an invented day
}
export function surfaceEpoch(month:number):2001|2006|2016|null{
  if(month<2001*12+8||month>2016*12+9)return null
  return month<2006*12+10?2001:month<2016*12+9?2006:2016
}
export const facadeEvidence={
  main:{source:'https://klec.mju.ac.kr/images/gallery/3.jpg',observed:'현 종합관의 밝은 수평 띠와 수직 기둥·줄지은 창',uncertain:'2002/2006 외장 상태·창 간격·층고는 추정'},
  dorm:{source:'https://klec.mju.ac.kr/images/gallery/6.jpg',observed:'곡선형 벽·벽돌색 몸체·밝은 상층부·반복 창',uncertain:'현 사진 참조 외장; 2006 세부 마감 미확인'},
  library:{source:'https://klec.mju.ac.kr/images/gallery/4.jpg',observed:'유리 입면·층별 띠·기둥·상부 연결 매스',uncertain:'OSM 외곽 기준; 내부 구조와 상세 치수 미복원'},
  other:{source:'https://ice1.mju.ac.kr/bbs/mjukr/147/146375/download.do',observed:'건축물 현황의 층수와 준공 기록',uncertain:'창·난간·출입구·옥상 장비는 시각화를 위한 추정'},
}
