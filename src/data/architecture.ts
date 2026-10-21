import type { Campus, Vec3 } from './history'

export type Confidence = 'A' | 'B' | 'C'
export type ModelType = 'library' | 'mcc' | 'dorm' | 'chapel' | 'science' | 'main' | 'student' | 'mirae' | 'international' | 'administration' | 'engineering' | 'hambak' | 'concept'
export interface ArchitecturalDefinition {
  modelType: ModelType
  position: Vec3
  rotation: number
  dimensions: Vec3
  footprint: [number, number]
  baseHeight: number
  roofType: 'flat' | 'terraced' | 'curved-parapet' | 'auditorium'
  modelConfidence: Confidence
  sourceReferences: { title: string; url: string }[]
  observed: string
  estimated: string
  floors: number | null
  geoAnchor: [number, number] | null
  facadeProperties: { wall: string; glass: string; glazing: 'limited' | 'grid' | 'ribbon' | 'u-glass' }
  inspectionOffset?: Vec3
}

export const confidenceLabels: Record<Confidence, string> = { A: '근거 기반 단순화', B: '부분 근거 기반', C: '개념 모형' }
export const campusOrigins = {
  humanities: { latitude: 37.580100, longitude: 126.923100 },
  nature: { latitude: 37.222550, longitude: 127.187500 },
}
/** Official map POI anchors, not surveyed corners. +X east / -Z north, ~10m per unit. */
export function geoToWorld(campus: Campus, latitude: number, longitude: number): Vec3 {
  const origin = campusOrigins[campus]
  return [Number(((longitude - origin.longitude) * 111320 * Math.cos(origin.latitude * Math.PI / 180) / 10).toFixed(3)), 0,
    Number((-(latitude - origin.latitude) * 111320 / 10).toFixed(3))]
}
export function terrainHeight(campus: Campus, _x: number, z: number) {
  return campus === 'humanities' ? .44 : .6 + Math.max(0, Math.min(1, (z + 24) / 48)) * 2.3
}
const guide = { title: '공식 인문캠퍼스 안내도 · PDF 42쪽', url: 'https://bizhrd.mju.ac.kr/default/img/2024_guide_01.pdf' }
const natureGuide = { title: '공식 자연캠퍼스 안내도', url: 'https://gsit.mju.ac.kr/bbs/mjukr/147/5556/download.do' }
const gallery = (n: number) => ({ title: '학교 공식 갤러리 외관 사진', url: `https://klec.mju.ac.kr/images/gallery/${n}.jpg` })
const palette = { wall: '#e1e2d9', glass: '#749a9e', glazing: 'grid' as const }
function define(campus: Campus, geo: [number, number] | null, dimensions: Vec3, modelType: ModelType, modelConfidence: Confidence, options: Partial<ArchitecturalDefinition>): ArchitecturalDefinition {
  const position = geo ? geoToWorld(campus, ...geo) : [0, 0, 0] as Vec3
  return { modelType, position, rotation: 0, dimensions, footprint: [dimensions[0], dimensions[2]],
    baseHeight: terrainHeight(campus, position[0], position[2]), roofType: 'flat', modelConfidence,
    sourceReferences: [campus === 'humanities' ? guide : natureGuide], observed: '안내도의 상대적 매스와 위치', estimated: '치수·회전·지붕 상세·창 개수는 추정입니다.', floors: null, geoAnchor: geo, facadeProperties: palette, ...options }
}
export const architecture: Record<string, ArchitecturalDefinition> = {
  library: define('humanities', [37.580750,126.924498], [10.8,4.2,5], 'library','A', {
    roofType: 'curved-parapet', floors: 4, rotation: -.08, inspectionOffset: [-14,11,18],
    sourceReferences: [gallery(4), guide, { title: '공식 발전기금본부 전경', url: 'https://giving.mju.ac.kr/images/common/img_vision_photo_31.gif' }, { title: 'AURUM 건축자산·설계자 설명', url: 'https://www.aurum.re.kr/Bits/BuildingDoc.aspx?mm=4&num=1907&ss=1' }],
    observed: '곡면 U-GLASS, 열린 상부 띠와 테라스, 목재 매스, 원형 기둥·보행교', estimated: '곡률·패널 간격·후면·옥상 세부는 추정입니다.',
    facadeProperties: { wall: '#d9e2d4', glass: '#83b7af', glazing: 'u-glass' },
  }),
  mcc: define('humanities', [37.579150,126.922500], [16,4.3,9.8], 'mcc','A', {
    roofType: 'terraced', floors: 4, rotation: -.04, inspectionOffset: [9,11,23],
    sourceReferences: [gallery(1), guide, { title: '공식 MCC 주출입구 사진', url: 'https://www.mju.ac.kr/CrossEditor/binary/images/000155/20230613144401594_PFNCBGFT.png' }],
    observed: '좌측 베리타스홀·우측 코이노니아홀, 중앙 외부 계단, 녹화 옥상과 단차·필로티', estimated: '지하·지상 레벨 경계, 계단 단수·테라스 치수는 추정입니다.',
    facadeProperties: { wall: '#d1d0c5', glass: '#567e82', glazing: 'ribbon' },
  }),
  dorm: define('humanities', [37.580800,126.923064], [8.8,5.8,3.8], 'dorm','A', {
    roofType: 'curved-parapet', floors: 7, inspectionOffset: [3,12,-19],
    sourceReferences: [gallery(6), guide, { title: '생활관 공식 소개 · 층수/월 표기 차이 있음', url: 'https://dorm.mju.ac.kr/dorm/6639/subview.do' }],
    observed: '길고 휘어진 벽돌색 입면, 흰 상단 띠·저층부, 반복 창과 중앙 수직 유리', estimated: '출입구의 정확한 위치·반경·창 개수·옥상 상세는 추정입니다. 층수·월 자료 차이는 조사 문서에 기록했습니다.',
    facadeProperties: { wall: '#b47a64', glass: '#91adb5', glazing: 'grid' },
  }),
  'h-main': define('humanities', [37.580300,126.922549], [11.8,7.7,2.8], 'main','B', { floors: 10, sourceReferences: [gallery(3), guide], observed: '10층 이용 안내, 긴 수평 매스, 반복 창·밝은 양 끝 코어', estimated: '외형 근거와 별개로 신축 연도는 미확인입니다. 현재 연도에만 표시합니다.' }),
  'h-education': define('humanities', [37.580104,126.921604], [4.6,3.4,3.3], 'mirae','B', { observed: '공식 안내도의 미래관 위치, 낮은 수평 매스·짙은 상단', estimated: '정확한 층수·측면·옥상·신축 연도는 미확인입니다.' }),
  'h-student': define('humanities', [37.580300,126.923450], [3,4.7,3.1], 'student','B', { observed: '안내도의 격자 입면·도서관 쪽 연결 관계' }),
  'h-international': define('humanities', [37.580900,126.923826], [3.2,5.7,3], 'international','B', { observed: '안내도·항공 사진의 직립 매스, 어두운 창과 평지붕' }),
  'h-admin': define('humanities', [37.580098,126.924244], [5.5,2.8,3.1], 'administration','B', { observed: '정문 옆 낮은 곡면 전면·격자 유리 입면' }),
  chapel: define('nature', [37.223850,127.186885], [6.6,4.5,7.5], 'chapel','B', {
    roofType: 'auditorium', floors: 4, rotation: .35,
    sourceReferences: [{ title: '공식 연혁 외관 사진', url: 'https://www.mju.ac.kr/sites/mjukr/images/sub01/history07.JPG' }, natureGuide],
    observed: '백색 곡면 강당·수평 이음선, 낮은 전면 로비와 넓은 계단', estimated: '작은 공식 사진에 근거한 부분 모델입니다. 곡률·옥상·측면·출입구 상세는 추정입니다.',
    facadeProperties: { wall: '#e9e6dc', glass: '#749a9e', glazing: 'limited' },
  }),
  science: define('nature', [37.221376,127.189260], [7.6,6.3,5], 'science','B', {
    floors: 7, rotation: -.10,
    sourceReferences: [{ title: '과학관 위치가 표기된 공식 조감도', url: 'https://mse.mju.ac.kr/sites/mse/images/sub/content_15.png' }, natureGuide],
    observed: '공식 표기 조감도의 길쭉한 연구동 매스·지붕, 지상 7층 연혁', estimated: '고해상도 정면 사진 미확보: 전면 창·입구·옥상 상세는 추정입니다.',
    facadeProperties: { wall: '#dfdfd4', glass: '#6b9099', glazing: 'grid' },
  }),
  'n-main': define('nature', [37.222550,127.187200], [6.8,4,3], 'engineering','B', { rotation: -.1, observed: '공식 지도·조감도의 제1공학관 위치와 긴 교육동 매스' }),
  'n-hambak': define('nature', [37.221201,127.188545], [5.8,3.7,3.2], 'hambak','B', { rotation: -.1, observed: '공식 안내도에서 과학관 서쪽의 함박관 위치·매스' }),
  'n-education': define('nature', null, [4.5,2.8,3], 'concept','C', { position: [-5,0,7], baseHeight: terrainHeight('nature',-5,7), observed: '주변 교육동 밀도를 표현하는 시연용 매스', estimated: '실재 건물 이름·신축 연도·정확한 위치를 주장하지 않습니다.' }),
}
