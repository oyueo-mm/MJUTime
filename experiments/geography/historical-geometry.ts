import registration from './data/aerial-registration.json'
import type {Point} from './spatial'

type Epoch=1985|2001
type Matrix=number[][]
const affine=([u,v]:Point,m:Matrix):Point=>[u*m[0][0]+v*m[1][0]+m[2][0],u*m[0][1]+v*m[1][1]+m[2][1]]
export function imageToWorld(p:Point,year:Epoch):Point{
  return affine(year===1985?affine(p,registration['1985'].matrix):p,registration['2001'].matrix)
}
export interface PhotoFeature {
  id:string;year:Epoch;kind:'roof'|'field'|'road';name:string;pixels:Point[]
  height:null;displayHeight:number;source:'aerial';identity:string
}
// Hand-traced visible roof / ground edges, not copied present-day footprints.
// A shallow 3m extrusion communicates observed mass; actual heights are unknown.
export const photoFeatures:PhotoFeature[]=[
  {id:'85-east-roof',year:1985,kind:'roof',name:'홍은동 동측 지붕',pixels:[[621,682],[635,671],[699,745],[686,757]],identity:'고교 권역; 당시 동별 명칭 미확정',height:null,displayHeight:3,source:'aerial'},
  {id:'85-west-roof',year:1985,kind:'roof',name:'홍은동 서측 지붕',pixels:[[396,680],[494,666],[498,699],[401,713]],identity:'당시 사용기관·현존 건물과의 동일성 미확인',height:null,displayHeight:3,source:'aerial'},
  {id:'85-field',year:1985,kind:'field',name:'홍은동 비건축 운동장',pixels:[[445,738],[501,722],[553,777],[503,812]],identity:'사진 판독; 기관별 점유 경계 미확인',height:null,displayHeight:0,source:'aerial'},
  {id:'85-road',year:1985,kind:'road',name:'학교 서측 도로 중심선',pixels:[[321,646],[379,714],[441,793],[494,863]],identity:'폭 미확인; 선으로만 표시',height:null,displayHeight:0,source:'aerial'},
  {id:'01-main',year:2001,kind:'roof',name:'남가좌동 본관 지붕',pixels:[[263,832],[344,817],[349,835],[267,851]],identity:'사진 위치와 현재 본관 대응 추정',height:null,displayHeight:3,source:'aerial'},
  {id:'01-union',year:2001,kind:'roof',name:'남가좌동 동측 지붕',pixels:[[353,810],[379,803],[384,820],[357,828]],identity:'현 학생회관 위치 대응 추정; 1985 외형 증거 아님',height:null,displayHeight:3,source:'aerial'},
  {id:'01-college-main',year:2001,kind:'roof',name:'전문대 본관 권역 지붕',pixels:[[394,419],[472,403],[477,428],[398,445]],identity:'2001.08 준공·이전 기록과 09.13 사진 대조; 동일 부지 과거 지붕과 구조 연속성 미확인',height:null,displayHeight:3,source:'aerial'},
  {id:'01-college-engineering',year:2001,kind:'roof',name:'전문대 공학관 권역 지붕',pixels:[[388,382],[465,364],[471,383],[395,402]],identity:'공식 준공 기록과 사진 대조; 세부 동 식별은 추정',height:null,displayHeight:3,source:'aerial'},
  {id:'01-east-roof',year:2001,kind:'roof',name:'홍은동 동측 지붕',pixels:[[590,406],[602,398],[662,462],[651,471]],identity:'고교 권역; 현재 윤곽 재사용 아님',height:null,displayHeight:3,source:'aerial'},
  {id:'01-university-field',year:2001,kind:'field',name:'남가좌동 운동장',pixels:[[270,865],[344,849],[354,900],[282,917]],identity:'현재 MCC 권역과 겹침; 정합 오차 고려 필요',height:null,displayHeight:0,source:'aerial'},
  {id:'01-college-field',year:2001,kind:'field',name:'홍은동 운동장',pixels:[[441,458],[468,445],[513,491],[485,512]],identity:'사진 판독; 학교 점유 경계 미확인',height:null,displayHeight:0,source:'aerial'},
  {id:'01-road',year:2001,kind:'road',name:'남가좌동 동측 진입로',pixels:[[391,809],[404,849],[383,897],[359,929]],identity:'도로 중심선; 폭·당시 지반고 미확인',height:null,displayHeight:0,source:'aerial'},
]
export const featuresFor=(year:number)=>photoFeatures.filter(f=>f.year===year)
export const worldRing=(feature:PhotoFeature)=>feature.pixels.map(p=>imageToWorld(p,feature.year))
