# 지리·역사 공간 실험 · 2026-10-22

`experiment/geographic-history` 전용. **main·공개 사이트·배포 워크플로는 변경하지 않는다.** 실행: `npm run dev:geo` → http://127.0.0.1:4188/MJUTime/geography.html

| 1985 항공사진 국소 전사 | 2001 전문대 이전 | 현재 MCC 권역 |
| --- | --- | --- |
| ![1985](screenshots/desktop-1985-registered.png) | ![2001](screenshots/desktop-2001-relocation.png) | ![현재](screenshots/desktop-2026-mcc.png) |

[1985 국제대학 사용 기록](screenshots/desktop-1985-occupancy.png) · [2001 운동장](screenshots/desktop-2001-field.png) · [현재 전체](screenshots/desktop-2026.png) · [북쪽 위](screenshots/desktop-2026-top.png) · [모바일](screenshots/mobile-2026-mcc.png). 사진 원본은 재배포하지 않으며 캡처는 자체 렌더링이다.

| 개선 | 구현·정확성 범위 |
| --- | --- |
| 자유 탐험 | 지도에 초점을 두고 WASD, Q/E 높이, Shift 가속. 드래그 회전·우클릭 이동·휠 확대·더블클릭 지면 이동. 학교 5곳 바로 이동 시 연도 유지. 모바일 한 손가락 회전·두 손가락 확대/이동·방향 버튼 길게 누르기. |
| 현재 지도 | 독립 수집 OSM 건물 2,667개·도로 1,262개 연결 조각·학교 5곳과 DEM. +X 동쪽, −Z 북쪽, 원점 126.9265/37.58275, 미터 단위. 벽 하단을 DEM에 접합하고 운동장 면을 세분화해 경사면 가림을 수정했다. 옹벽·절토면·최신 지형은 미복원. 도로 폭은 종류별 표현값이다. |
| 주요 건물 점검 | OSM 종합관 `462990137`, 방목 `462990139`, 학생회관 `462990141`, 생활관 `462990142`, MCC `1127358152`, 전문대 본관 `795977922`·공학관 `1123968177`, 중·고 교사 `463033409/463033408` 확인. **기존 MCC 누락 설명은 잘못되어 정정했다.** 초교 권역의 이름 없는 교사 후보 `780472249`를 임의 실명·과거 교사로 확정하지 않았다. 중·고 윤곽은 학교 부지 전체가 아니다. |
| 1985 실제 3D | 사진에서 홍은동 지붕 2개·운동장 1개·도로 중심선 1개를 수작업 전사. 동별 사용기관·현재 건물과의 구조 연속성은 미확인. 남가좌동 대학은 선택 사진 프레임 밖이므로 과거 건물을 생성하지 않았다. |
| 2001 실제 3D | 남가좌동 지붕 2개·운동장, 홍은동 지붕 3개·운동장, 진입로 중심선 전사. 현재 MCC 권역과 2001 운동장 위치를 비교할 수 있다. 당시 도로 폭·건물 높이는 미확인이다. |
| 국제대학 | 명대신문의 1984년 이후 학생회관 사용 기록을 1985 비교에 표시. 선택하면 **현재** 학생회관 위치를 점선으로 참조한다. 당시 윤곽·점유 경계·정확한 사용 종료일로 주장하지 않는다. |
| 기관 이전 | 2001.08 전문대와 1997.06 초교 이전을 출발 권역→현재 주소 권역의 3D 이동선으로 표시. 통학로가 아니며 옛 경상관 등의 확정 좌표가 아니다. 이전을 신축·철거로 해석하지 않는다. |
| 도시 재개발 | 2015 남가좌1 공고를 별도 도시 변화 기록으로 유지. 검증된 지구계·개별 철거/완공일을 확보하지 못해 과거 아파트나 도로를 임의 생성·삭제하지 않는다. |

**정합 결과와 한계:** 정사영상이 아닌 공개 스캔 미리보기다. SIFT 자동 정합은 안정적인 대응점이 부족해 기각했다. 수동 국소 아핀의 대응점·행렬·잔차는 [JSON](data/aerial-registration.json), 재생성은 `python experiments/geography/register_aerial.py`(numpy)이다. 폭 1100px 미리보기 좌표를 사용한다.

- 2001→OSM: 지붕 중심 6개, 적합 RMS **5.77m**, 하나씩 제외한 검증 최대 **23.61m**. 현재 OSM와 수동 지붕 중심의 대응값이며 독립 측량 정확도가 아니다.
- 1985→2001: 같은 두 지붕의 모서리 8개, RMS **1.99px**, 하나씩 제외 시 최대 **4.98px**. 같은 지붕 모서리끼리 상관되어 있고 공간 범위가 좁다. 도시 전체 정합으로 해석하면 안 된다.
- 지형·지붕 시차·렌즈 왜곡을 보정하지 않았다. 25m 주의 범위도 통계적 오차 보증이 아니다. **지붕 높이는 null, 3m는 표시용 돌출**, 지반은 현재 DEM이다. 빈 곳은 미조사 영역이다. 기관·동 이름 대응은 사진 관찰과 분리해 추정으로 기록했다.

| 실제 열람·근거 | 식별자 / 반영 |
| --- | --- |
| [국토정보플랫폼 항공사진](https://map.ngii.go.kr/ms/map/Aerial.do) | 1985: objectId `2662182`, `198510A0302`, 코스21/사진6, 원사진 날짜 **1985.10.21** 판독. 2001: `2729075`, `200109A0301`, 코스25/사진12, **2001.09.13** 판독. 카탈로그 코드만으로 날짜를 추정하지 않았다. |
| [1985 공개 미리보기](https://map.ngii.go.kr/search/airImage.do?file_nam=198510030200210006&air_type=air&zone_code=198510A0302&ph_course=21&ph_num=6) / [2001 공개 미리보기](https://map.ngii.go.kr/search/airImage.do?file_nam=200109030100250012&air_type=air&zone_code=200109A0301&ph_course=25&ph_num=12) | 지붕·운동장·도로 판독. 다른 인접 프레임도 열람했으나 대학 부지의 신뢰할 만한 1985 윤곽은 확보하지 못했다. 사진을 저장소 자산으로 포함하지 않는다. |
| [명대신문 2010 현장 기사](https://news.mju.ac.kr/news/articleView.html?idxno=1357) | 네 기관의 당시 공간 사용. 검색 색인 본문을 확인했으나 현재 직접 링크는 404여서 영구 열람성에 한계가 있다. 정확한 동별 지적 경계는 미확인. |
| [전문대 공식 2000년대 연혁](https://www.mjc.ac.kr/ibuilder.do?menu_idx=84&per_menu_idx=12&tabCnt=6) | 2001.08 남가좌동50-3→홍은3동356-1, 본관·공학관·주차장 준공. 09.13 항공사진은 이전 이후다. 이전 기록과 사진 지붕의 세부 동 식별은 별개다. |
| [초교 공식 역사](https://www.myongji.net/subpage.php?p=m15) / [법인 연혁](https://emc.mju.ac.kr/mjuins/4388/subview.do) | 1976.02.28 남가좌동, 1997.05.16 신축, 06.09 이전. 중학교 이전 날짜는 자료 차이로 미확정. |
| [현재 기관 주소](https://emc.mju.ac.kr/mjuins/4390/subview.do) / [고교 학술 연혁](https://encykorea.aks.ac.kr/Article/E0018395) | 현 위치 및 1973 홍은동 이전 참고. 당시 모든 건물의 존재 증거로 확대하지 않는다. |
| [서울시 남가좌1 공고](https://cleanup.seoul.go.kr/cleanup/bidpblanc/vscr.do?cpage=1201&othbcListSn=306781&searchCode=SJ&searchValue=&signguCd=) | 2015 재건축 감리 공고만 확인, 지구계·개별 철거일 미확인. |
| [OSM](https://www.openstreetmap.org/#map=16/37.58275/126.92650) / [DEM](https://registry.opendata.aws/terrain-tiles/) | 수집 2026.10.21, 원본 SHA·ID·범위는 current-map.json. OSM © contributors / ODbL. DEM z13 Terrarium 6984/3171·3172, 약15~244m·배율1, Mapzen / USGS SRTM·GMTED. 172개만 height 태그, 나머지 층수×3m 또는9m 표현값. |
| [mju-landing](https://mju-landing.vercel.app/) / [공개 소스](https://github.com/coalfire-create/mju-landing) | 이전 조사 유지: Three.js+GSAP/Lenis, 평면 지면, OSM 가공 데이터. LICENSE 부재로 코드·가공 JSON을 복사하지 않고 OSM API에서 독립 수집했다. |

검증: 실험 Vitest **8개**, 기존 Vitest **13개**, 실험 Playwright **4개**, 기존 Playwright **10개** 통과. 타입 검사·실험/기존 프로덕션 빌드 통과. 실험 Chromium 데스크톱·Pixel7에서 회전·키보드 높이·휠·더블클릭·터치 이동/핀치·연도 반복·점유 기록·이전선·가로 넘침과 오류를 확인했다. 실제 스마트폰·Safari·Firefox·독립 측량 검증은 수행하지 않았다. 과거 도시 전체 복원은 완료되지 않았다.

렌더링 표본(현재 MCC 근접 화면, headless Chromium / ANGLE SwiftShader 소프트웨어 렌더러, 2초 단일 표본): 데스크톱 **41프레임/2.067초 ≈19.8fps, 13 calls/125,832 triangles**, Pixel7 에뮬레이션 **48프레임/2.050초 ≈23.4fps, 10 calls/125,268 triangles**. 서로 화면에 보이는 요소가 달라 calls 차이가 있다. 실제 기기 FPS·GPU 시간·초기 로딩 벤치마크로 일반화하지 않는다.
