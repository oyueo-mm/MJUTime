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
  {id:'old-main',name:'당시 본관',periodReference:'1984년 이후 시기 서술',snapshot:1985,snapshotIsPeriodProxy:true,geometry:'unknown',source:'newspaper'},
  {id:'college-main',name:'전문대 본관',firstVerified:'2001-08',geometry:'current-outline-only',source:'college'},
  {id:'college-engineering',name:'전문대 공학관',firstVerified:'2001-08',geometry:'current-outline-only',source:'college'},
  {id:'elementary-schoolhouse',name:'홍은동 초등학교 신축교사',firstVerified:'1997-05-16',geometry:'current-outline-only',source:'elementary'},
  {id:'dorm',osmId:'462990142',name:'인문생활관',firstVerified:'2006-02',geometry:'current-outline-only',source:'university'},
  {id:'library',osmId:'462990139',name:'방목학술정보관',firstVerified:'2010-03',geometry:'current-outline-only',source:'library'},
  {id:'mcc',osmId:'1127358152',name:'MCC관',firstVerified:'2021-08',geometry:'current-outline-only',source:'mcc'},
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
// Capture dates are read from the frame; local registration is NOT orthorectification.
export const aerialEvidence = [
  {yearField:1985,captureDate:'1985-10-21',objectId:2662182,collection:'서울특별시청1985년2차',zoneCode:'198510A0302',course:21,photo:6,viewed:true,orthorectificationVerified:false,observation:'원사진 날짜 판독. 홍은동 두 지붕·운동장·도로 국소 아핀 전사; 남가좌동 대학 부지는 프레임 밖. 고도·기관별 점유 미확인'},
  {yearField:2001,captureDate:'2001-09-13',objectId:2729075,collection:'서울특별시청2001년1차',zoneCode:'200109A0301',course:25,photo:12,viewed:true,orthorectificationVerified:false,observation:'원사진 날짜 판독. 여섯 OSM 지붕 중심 대응점으로 국소 아핀 정합; 정사영상 아님. 지붕·운동장·도로 일부 전사'},
] as const
export interface HistoricalMarker {label:string;lon:number;lat:number;source:SourceId;note:string}
export const historicalMarkers:Record<1985|2001,HistoricalMarker[]> = {
  1985:[
    {label:'남가좌동 50-3 · 네 기관의 기록',lon:126.922749,lat:37.580054,source:'newspaper',note:'명지대·국제대·국민학교·전문대 / 동별 좌표 미확인'},
    {label:'명지고등학교 · 홍은동 권역',lon:126.92737,lat:37.58437,source:'high',note:'1973년 이전 · 사진 국소 전사 / 동별 기관명 추정'},
  ],
  2001:[
    {label:'명지대학교 · 남가좌동',lon:126.9228,lat:37.5801,source:'newspaper',note:'지붕·운동장 일부 전사 · 미조사 영역 생략'},
    {label:'명지전문대학 · 8월 이전',lon:126.9254,lat:37.58457,source:'college',note:'9월 13일 사진 · 준공 기록 / 동 식별 추정'},
    {label:'명지초등학교 · 홍은동',lon:126.92862,lat:37.58336,source:'elementary',note:'1997년 이전 확인 · 당시 형상 미확인'},
    {label:'명지중·고 · 홍은동',lon:126.9271,lat:37.5846,source:'affiliates',note:'중학교 신축 이전 시점 자료 차이 · 동별 외형 미확인'},
  ],
}
export const yearNotes:Record<Year,{title:string;paragraphs:string[];sourceIds:SourceId[]}> = {
  1985:{title:'같은 권역, 다른 사용기관',paragraphs:['명대신문은 1984년 이후 명지대 야간학과(본관)·국제대학(학생회관)·명지국민학교(옛 사회교육원 자리)·명지전문대(경상관)의 공간 사용을 서술합니다. 정확한 점유 기간 말단·경계는 미확인입니다.','국제대학 기록 선택 시 현재 학생회관 위치를 점선으로 참조합니다. 이는 당시 건물 윤곽의 복원이 아닙니다.','1985.10.21 사진에서 홍은동 지붕 2개·운동장·도로를 국소 정합해 옮겼습니다. 지붕 높이는 미확인으로 3m 표시용입니다. 남가좌동 대학 부지는 사진 범위 밖이며 빈 곳은 건물 부재를 뜻하지 않습니다.'],sourceIds:['newspaper','elementary','high','aerial']},
  2001:{title:'전문대의 홍은동 이전',paragraphs:['전문대 공식 연혁의 2001년 8월 이전 이후, 9월 13일 항공사진 기준입니다. 남가좌동 50-3 → 홍은3동 356-1 이전과 본관·공학관 준공이 확인됩니다. 이동선은 기관 이전이며 옛 건물 철거를 뜻하지 않습니다.','초등학교는 1997년 6월 9일 신축교사로 이전했습니다. 중학교 교사 이전 날짜는 자료 간 차이가 있어 확정하지 않았습니다.','사진에서 지붕 5개·운동장 2개·진입로 일부를 전사했습니다. 정합 RMS 5.8m, 대응점 하나씩 제외 시 최대 23.6m입니다. 독립 측량 정확도가 아니며 지붕 시차·지형 오차가 남습니다. 높이 3m는 표현용, 지반은 현재 DEM입니다.'],sourceIds:['college','elementary','foundation','aerial']},
  2026:{title:'현재 공간의 지리 데이터 실험',paragraphs:['OSM 공식 API의 건물 2,667개·도로와 공개 DEM을 실제 좌표계로 결합했습니다. 건물 벽 하단이 경사면에 닿도록 보정했으나 실제 옹벽·절토면 복원은 아닙니다.','height 태그는 172개이며 나머지는 층수 × 3m 또는 9m 표시용입니다. MCC(1127358152)·본관·도서관·생활관·전문대 본관·공학관 윤곽이 있습니다. 기존 MCC 누락 설명을 정정합니다. 중·고교 OSM은 부지 전체가 아닌 교사 윤곽이므로 점유 범위로 확대하지 않습니다.','2026은 현재 비교 시점이며 OSM 수집일은 촬영일·준공일이 아닙니다. 남가좌1 재개발 2015 공고는 별도 도시 변화 기록입니다. 검증된 지구계·철거일이 없어 과거 아파트를 임의로 지우지 않습니다.'],sourceIds:['affiliates','redevelopment','mcc']},
}
