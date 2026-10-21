export type Campus = 'humanities' | 'nature'
export type Vec3 = [number, number, number]
export interface HistoryEvent {
  id: string
  year: number
  month?: number
  title: string
  description: string
  campus: Campus | 'all'
  buildingId?: string
  position: Vec3
  category: 'campus' | 'milestone' | 'building'
  sourceUrl: string
  evidenceLevel: 'official'
  secondarySourceUrl?: string
}
export interface Building {
  id: string
  name: string
  campus: Campus
  position: Vec3
  dimensions: Vec3
  appearance: 'classic' | 'dorm' | 'library' | 'mcc' | 'science' | 'chapel'
  firstVerifiedYear: number | null
  modelConfidence: 'simplified'
  isConceptual: boolean
  color: string
}

export const MIN_YEAR = 1948
// Use the visitor's Korea calendar year, including at the UTC year boundary.
export const CURRENT_YEAR = Number(new Intl.DateTimeFormat('en-US', { year: 'numeric', timeZone: 'Asia/Seoul' }).format(new Date()))
export const campusInfo = {
  humanities: { name: '인문캠퍼스', city: '서울', english: 'HUMANITIES CAMPUS', location: '서울특별시 서대문구', contextYear: 1976 },
  nature: { name: '자연캠퍼스', city: '용인', english: 'NATURAL SCIENCES CAMPUS', location: '경기도 용인시 처인구', contextYear: 1979 },
}
const source = (page: number) => `https://mjhistory.mju.ac.kr/mjukr/${page}/subview.do`
export const events: HistoryEvent[] = [
  { id: 'seoul-move', year: 1976, month: 1, title: '남가좌동에서 시작된 새 장', description: '대학본부가 남가좌동 캠퍼스로 이전했습니다. 오늘날 인문캠퍼스로 이어지는 장소에서 새로운 역사를 시작한 시점입니다. 이 사건은 본부 이전이며, 화면 속 기본 건물의 신축을 의미하지 않습니다.', campus: 'humanities', position: [0, 1, 1], category: 'campus', sourceUrl: source(163), evidenceLevel: 'official' },
  { id: 'yongin-start', year: 1979, month: 7, title: '용인캠퍼스 착공', description: '용인캠퍼스 착공식이 열렸습니다. 자연 속 배움의 터전을 조성하기 시작한 사건입니다. 당시 개별 건물의 완공 시점과 배치가 확인되지 않아 이 시기에는 개념 부지만 표시합니다.', campus: 'nature', position: [0, 1, 1], category: 'campus', sourceUrl: source(163), evidenceLevel: 'official' },
  { id: 'headquarters-move', year: 1983, month: 3, title: '대학본부, 용인으로 이전', description: '대학본부가 용인캠퍼스로 이전했습니다. 행정 중심의 이동을 기록한 사건으로, 특정 건물의 신축 연도로 사용하지 않습니다.', campus: 'nature', position: [0, 1, 1], category: 'campus', sourceUrl: source(163), evidenceLevel: 'official' },
  { id: 'university', year: 1983, month: 9, title: '종합대학교로 승격', description: '명지대학이 종합대학교로 승격했습니다. 교육의 영역을 넓혀 가는 학교 전체의 전환점으로, 캠퍼스 중앙의 역사 마커에 표시합니다.', campus: 'all', position: [1, 1, 2], category: 'milestone', sourceUrl: source(162), evidenceLevel: 'official' },
  { id: 'dual-campus', year: 1989, month: 10, title: '두 캠퍼스, 각자의 전문성으로', description: '계열별 캠퍼스 이원화가 인가되었습니다. 서울에는 인문·법정·경상 계열을, 용인에는 이과·공과·예체능 계열을 배치하는 체계입니다. 이 행정적 변화는 건물 신축으로 표현하지 않습니다.', campus: 'all', position: [0, 1, 1], category: 'milestone', sourceUrl: source(162), evidenceLevel: 'official' },
  { id: 'campus-names', year: 2002, month: 3, title: '인문과 자연이라는 이름', description: '서울캠퍼스는 인문캠퍼스, 용인캠퍼스는 자연캠퍼스로 이름을 바꾸었습니다. 두 캠퍼스의 특성을 담은 현재의 명칭이 이때부터 사용됩니다.', campus: 'all', position: [0, 1, 1], category: 'milestone', sourceUrl: source(161), evidenceLevel: 'official' },
  { id: 'dorm-opening', year: 2006, month: 2, title: '인문캠퍼스 생활관 개관', description: '인문캠퍼스 생활관이 신축 개관했습니다. 공식 연혁에 지하 2층, 지상 7층 규모로 기록되어 있습니다. 배움과 일상이 가까워진 캠퍼스의 변화를 만나보세요.', campus: 'humanities', buildingId: 'dorm', position: [-7, 7.4, -4.5], category: 'building', sourceUrl: source(161), evidenceLevel: 'official' },
  { id: 'science-opening', year: 2008, month: 10, title: '차세대과학관 개관', description: '자연캠퍼스에 차세대과학관이 문을 열었습니다. 지상 7층 규모의 연구동으로, 연구와 실험을 위한 교육 환경이 확장되었습니다.', campus: 'nature', buildingId: 'science', position: [-6, 6.8, -4], category: 'building', sourceUrl: source(161), evidenceLevel: 'official' },
  { id: 'chapel-opening', year: 2008, month: 12, title: '60주년채플관 개관', description: '자연캠퍼스에 60주년채플관이 개관했습니다. 문화와 종교 행사를 위한 공간으로, 공식 연혁에는 지상 4층, 약 2,000명 수용 규모로 소개되어 있습니다.', campus: 'nature', buildingId: 'chapel', position: [6, 5.4, 3], category: 'building', sourceUrl: source(161), evidenceLevel: 'official' },
  { id: 'library-opening', year: 2010, month: 3, title: '지식을 잇는 방목학술정보관', description: '인문캠퍼스 방목학술정보관이 신축 개관했습니다. 자료와 학습, 만남이 모이는 도서관을 단순화된 모형으로 표현했습니다. 연도 단위 탐색이므로 해당 연도부터 건물을 표시합니다.', campus: 'humanities', buildingId: 'library', position: [0, 6.1, -6], category: 'building', sourceUrl: 'https://www.mju.ac.kr/mjukr/160/subview.do', evidenceLevel: 'official' },
  { id: 'mcc-opening', year: 2021, month: 8, title: '캠퍼스의 새로운 연결, MCC관', description: '인문캠퍼스 MCC관이 신축되고 봉헌예배가 열렸습니다. 교육 공간인 베리타스홀과 상업·복지 공간인 코이노니아홀이 함께하는 교육복합시설입니다.', campus: 'humanities', buildingId: 'mcc', position: [6.4, 3.7, 3.5], category: 'building', sourceUrl: 'https://emc.mju.ac.kr/mjukr/9418/subview.do', evidenceLevel: 'official' },
]

const common = { modelConfidence: 'simplified' as const, isConceptual: false }
export const buildings: Building[] = [
  { ...common, id: 'dorm', name: '생활관', campus: 'humanities', position: [-7, 0, -4.5], dimensions: [3.6, 5.8, 3.2], appearance: 'dorm', firstVerifiedYear: 2006, color: '#d5b9a0' },
  { ...common, id: 'library', name: '방목학술정보관', campus: 'humanities', position: [0, 0, -6], dimensions: [6, 4.4, 3.7], appearance: 'library', firstVerifiedYear: 2010, color: '#e5dccd' },
  { ...common, id: 'mcc', name: 'MCC관', campus: 'humanities', position: [6.4, 0, 3.5], dimensions: [6, 2.5, 4.6], appearance: 'mcc', firstVerifiedYear: 2021, color: '#e7e5dd' },
  { ...common, id: 'h-main', name: '기본 건물 군 · 개념 모형', campus: 'humanities', position: [6.5, 0, -4.8], dimensions: [5, 4.4, 3.1], appearance: 'classic', firstVerifiedYear: null, isConceptual: true, color: '#d9c6ae' },
  { ...common, id: 'h-education', name: '교육동 · 개념 모형', campus: 'humanities', position: [-7.7, 0, 3.7], dimensions: [3.7, 3.1, 5.2], appearance: 'classic', firstVerifiedYear: null, isConceptual: true, color: '#dfcfbb' },
  { ...common, id: 'science', name: '차세대과학관', campus: 'nature', position: [-6, 0, -4], dimensions: [5.5, 5.5, 3.8], appearance: 'science', firstVerifiedYear: 2008, color: '#dedbc9' },
  { ...common, id: 'chapel', name: '60주년채플관', campus: 'nature', position: [6, 0, 3], dimensions: [5, 3.5, 5], appearance: 'chapel', firstVerifiedYear: 2008, color: '#e7d8c5' },
  { ...common, id: 'n-main', name: '기본 건물 군 · 개념 모형', campus: 'nature', position: [4.5, 0, -5.4], dimensions: [7, 3.6, 3], appearance: 'classic', firstVerifiedYear: null, isConceptual: true, color: '#d9c6ae' },
  { ...common, id: 'n-education', name: '교육동 · 개념 모형', campus: 'nature', position: [-7, 0, 3.7], dimensions: [4.2, 3, 4.5], appearance: 'classic', firstVerifiedYear: null, isConceptual: true, color: '#d9c6ae' },
]
