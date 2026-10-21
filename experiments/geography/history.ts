// Geography, physical existence, occupancy, relocation and urban change are separate.
// A school moving does NOT imply demolition or construction of every campus building.
export type Year = 1985 | 2001 | 2026
export const sources = {
  newspaper:{title:'명대신문 · 명지, 그 역사를 담은 현장 (2010)',url:'https://news.mju.ac.kr/news/articleView.html?idxno=1357'},
  foundation:{title:'명지학원 공식 연혁',url:'https://emc.mju.ac.kr/mjuins/4388/subview.do'},
  college:{title:'명지전문대학 공식 2000년대 연혁',url:'https://www.mjc.ac.kr/ibuilder.do?menu_idx=84&per_menu_idx=12&tabCnt=6'},
  elementary:{title:'명지초등학교 공식 학교역사',url:'https://www.myongji.net/subpage.php?p=m15'},
  affiliates:{title:'명지학원 산하기관 · 현 주소',url:'https://emc.mju.ac.kr/mjuins/4390/subview.do'},
  high:{title:'명지고등학교 · 한국민족문화대백과사전',url:'https://encykorea.aks.ac.kr/Article/E0018395'},
  redevelopment:{title:'서울시 정비사업 정보몽땅 · 남가좌1 (2015)',url:'https://cleanup.seoul.go.kr/cleanup/bidpblanc/vscr.do?cpage=1201&othbcListSn=306781&searchCode=SJ&searchValue=&signguCd='},
  aerial:{title:'국토정보플랫폼 · 항공사진',url:'https://map.ngii.go.kr/ms/map/Aerial.do'},
  university:{title:'명지대학교 공식 연혁 · 2000년대',url:'https://mjhistory.mju.ac.kr/mjukr/161/subview.do'},
  library:{title:'명지대학교 공식 연혁 · 2010년대',url:'https://www.mju.ac.kr/mjukr/160/subview.do'},
  mcc:{title:'명지대학교 공식 연혁 · MCC',url:'https://emc.mju.ac.kr/mjukr/9418/subview.do'},
}
export type SourceId = keyof typeof sources
export const buildingExistence = [
  {id:'old-main',name:'당시 본관',observedYears:[1985],geometry:'unknown',source:'newspaper'},
  {id:'college-main',name:'전문대 본관',firstVerified:'2001-08',geometry:'current-outline-only',source:'college'},
  {id:'college-engineering',name:'전문대 공학관',firstVerified:'2001-08',geometry:'current-outline-only',source:'college'},
  {id:'elementary-schoolhouse',name:'홍은동 초등학교 신축교사',firstVerified:'1997-05-16',geometry:'current-outline-only',source:'elementary'},
  {id:'dorm',osmId:'462990142',name:'인문생활관',firstVerified:'2006-02',geometry:'current-outline-only',source:'university'},
  {id:'library',osmId:'462990139',name:'방목학술정보관',firstVerified:'2010-03',geometry:'current-outline-only',source:'library'},
  {id:'mcc',name:'MCC관',firstVerified:'2021-08',geometry:'not-mapped-separately',source:'mcc'},
] as const
export const relocations = [
  {institution:'elementary',date:'1976-02-28',from:'남가좌동 4-2',to:'남가좌동 50-3',source:'elementary'},
  {institution:'elementary',date:'1997-06-09',from:'남가좌동 50-3',to:'홍은동 신축교사',source:'elementary'},
  {institution:'college',date:'2001-08',from:'남가좌동 50-3',to:'홍은3동 356-1',source:'college'},
] as const
export const occupancy = [
  {snapshot:1985,institution:'명지대 야간학과',site:'당시 본관',source:'newspaper',precision:'1984년 이후 시기 서술; 정확한 점유 경계 미확인'},
  {snapshot:1985,institution:'국제대학',site:'당시 학생회관',source:'newspaper',precision:'1984년 이후 시기 서술; 기간 말단 미확인'},
  {snapshot:1985,institution:'명지국민학교',site:'남가좌동 50-3 · 옛 사회교육원 자리',source:'newspaper',precision:'주소·이전 연혁 교차 확인; 정확한 과거 윤곽 미확인'},
  {snapshot:1985,institution:'명지전문대',site:'당시 경상관',source:'newspaper',precision:'1984년 이후 시기 서술; 과거 동별 좌표 미확인'},
  {snapshot:2001,institution:'명지전문대학',site:'홍은동 · 8월 이전 이후',source:'college',precision:'연말 기준; 신축 본관·공학관 존재 확인'},
  {snapshot:2001,institution:'명지초등학교',site:'홍은동 · 1997년 이전 이후',source:'elementary',precision:'기관 위치 확인; 2001년 건물 외형 미확인'},
] as const
export const urbanChanges = [
  {id:'namgajwa-1',category:'urban-redevelopment',location:'남가좌동 369-10 일대',documentDate:'2015-08-26',source:'redevelopment',statement:'주택재건축 감리 공고; 철거일·완공일·1985/2001 지구계는 별도 검증 필요',geometry:null},
] as const
// Catalog and image observation are evidence, not georeferenced historical geometry.
export const aerialEvidence = [
  {yearField:1985,objectId:2662182,collection:'서울특별시청1985년2차',zoneCode:'198510A0302',course:21,photo:6,viewed:true,orthorectificationVerified:false,observation:'권역의 저층 시가지와 넓은 비건축 공간을 열람. 동별 기관명·정확한 경계는 판독하지 않음'},
  {yearField:2001,objectId:2729075,collection:'서울특별시청2001년1차',zoneCode:'200109A0301',course:25,photo:12,viewed:true,orthorectificationVerified:false,observation:'캠퍼스 주변 저층 블록과 운동장 형태를 열람. 원사진 프레임·방향 및 위치 오차가 있어 3D 윤곽으로 전사하지 않음'},
] as const
export interface HistoricalMarker {label:string;lon:number;lat:number;source:SourceId;note:string}
export const historicalMarkers:Record<1985|2001,HistoricalMarker[]> = {
  1985:[
    {label:'남가좌동 50-3 · 네 기관의 기록',lon:126.922749,lat:37.580054,source:'newspaper',note:'명지대·국제대·국민학교·전문대 / 동별 좌표 미확인'},
    {label:'명지고등학교 · 홍은동 권역',lon:126.92737,lat:37.58437,source:'high',note:'1973년 홍은동 이전 · 당시 외형 미확인'},
  ],
  2001:[
    {label:'명지대학교 · 남가좌동',lon:126.9228,lat:37.5801,source:'newspaper',note:'기관 위치 · 당시 형상 미확인'},
    {label:'명지전문대학 · 8월 이전',lon:126.9254,lat:37.58457,source:'college',note:'연말 기준 · 본관·공학관 준공 확인'},
    {label:'명지초등학교 · 홍은동',lon:126.92862,lat:37.58336,source:'elementary',note:'1997년 이전 확인 · 당시 형상 미확인'},
    {label:'명지중·고 · 홍은동',lon:126.9271,lat:37.5846,source:'affiliates',note:'중학교 신축 이전 시점 자료 차이 · 동별 외형 미확인'},
  ],
}
export const yearNotes:Record<Year,{title:string;paragraphs:string[];sourceIds:SourceId[]}> = {
  1985:{title:'같은 권역, 다른 사용기관',paragraphs:['명대신문은 1984년 이후 남가좌동에 명지대 야간학과·국제대학·명지국민학교·명지전문대가 함께 있던 시기를 서술합니다. 1985년 비교에는 이 시기 기록을 사용하며 점유 경계와 기간 말단은 미확인입니다.','초등학교 공식 연혁의 1976년 남가좌동 50-3 이전과 교차 확인했습니다. 동별 좌표가 확인되지 않아 네 기관을 같은 권역 표식으로 묶었습니다.','공식 1985년 항공사진을 열람해 주변 저층 시가지와 넓은 비건축 공간을 확인했습니다. 영상 정합·당시 건물 윤곽은 미검증입니다. 빈 공간은 “건물이 없었다”는 뜻이 아닙니다.'],sourceIds:['newspaper','elementary','high','aerial']},
  2001:{title:'전문대의 홍은동 이전',paragraphs:['2001년 8월 이후, 연말 기준입니다. 전문대 공식 연혁에서 남가좌동 50-3 → 홍은3동 356-1 이전과 본관·공학관 준공이 확인됩니다.','초등학교는 1997년 6월 9일 신축교사로 이전했습니다. 중학교 교사 이전은 법인 1997년 12월과 다른 연혁의 2000년 기록에 차이가 있어 정밀한 날짜·형상은 확정하지 않았습니다.','2001년 1차 항공사진을 열람했으나 정사보정과 정확한 촬영일은 미검증입니다. 기관 이전을 옛 건물 철거로, 현재 OSM 윤곽을 당시 존재의 증거로 해석하지 않습니다.'],sourceIds:['college','elementary','foundation','aerial']},
  2026:{title:'현재 공간의 지리 데이터 실험',paragraphs:['OSM 공식 API에서 직접 받은 건물 윤곽·도로와 공개 고도 래스터를 결합했습니다. 두 캠퍼스를 임의로 붙이지 않고 하나의 실제 좌표계로 표현합니다.','건물 2,667개 중 height 태그는 172개입니다. 나머지는 층수 × 3m 또는 9m 표시용 높이이며 실측 외형이 아닙니다. MCC의 독립 윤곽 등 누락도 있습니다.','2026은 현재 비교 시점입니다. OSM 수집일이 촬영일·준공일을 뜻하지 않습니다. 재개발 공고와 실제 건물 존재는 따로 관리합니다.'],sourceIds:['affiliates','redevelopment','aerial']},
}
