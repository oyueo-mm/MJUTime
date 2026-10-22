# 지리 데이터 실험

`experiment/geographic-history` 전용. 기존 React 화면·main·Pages 워크플로는 변경하지 않는다.

```sh
npm run dev:geo
# http://127.0.0.1:4188/MJUTime/geography.html
npm run build:geo
npx vitest run --config experiments/geography/vitest.config.ts
npx playwright test --config experiments/geography/playwright.config.ts
```

별도 HTML과 Three.js 장면만 추가했다. 다섯 교육기관의 실제 OSM 윤곽과 도로, 공개 고도를 표시한다. 연도 버튼은 기록 비교이며 과거 건축 복원 완성을 의미하지 않는다. [자체 렌더링·조사 결과](RESULTS.md).

기본은 고정 3D 세로 스크롤 여행: 아래로 현재→과거, 위로 과거→현재. 날짜 입력·재생·사건 탐색도 스크롤 위치와 동기화된다. **자유 탐험** 버튼으로 휠 줌·한 손가락 회전·두 손가락 확대/이동을 쓴다. WASD, Q/E, Alt 정밀 이동, Shift 가속, 드래그 회전, 우클릭 이동, 더블클릭 지면 이동·학교 바로가기를 보존했다. 방향은 `story-scroll.ts`의 `direction`에서 바꿀 수 있다.

연도·월 슬라이더/날짜 입력, 재생·일시정지, 1/6/24/120개월/초, 이전·다음 사건을 지원한다. 학교 이동은 날짜 유지, 날짜가 확인된 사건 선택은 해당 월로 이동한다. 끝에서 재생하면 가장 이른 월 단위 기록부터 시작한다. 1985/2001/2026 버튼은 관측 월 바로가기다. 카메라 감도 기본 0.5×와 개별 설정은 이 브라우저에 저장된다.

월말 단위 요약이며 자료의 일·월·연도·기간 해상도를 보존한다. **종합관·학생회관·미래관·국제관·행정동은 공식 대장 준공 근거로 중간 월에도 유지**된다. 당시 외형은 현 OSM 윤곽 참조·층고 추정이다. 1985·1997·2001·2006·2016 항공 전사와 별도이며, 운동장·도로만 관측 사이 참조 형상으로 유지한다. 주택 지붕·나지는 촬영 월만 표시한다. [복원 근거·오차·미완성 사항](RESTORATION_NOTES.md).

홍은2의 현재 단지 OSM 윤곽 8개 동: 철거완료 기록→착공 참조 격자→완료 이후 참조 매스로 전환한다. 공식 지구계·옛 개별 건물·월별 공정률 복원은 아니다. 남가좌1은 주소 권역의 단계 기호, 범위 밖 홍은13은 기록만 제공한다. 신고·실제 완료 기록·인가·고시일은 분리한다. 새로 조사한 항공사진의 열람 여부와 미확인 월은 `data/additional-aerial.json`에 기록한다.

현재 공간은 `data/current-map.json`, 기관 사용·이전은 `history.ts`, 준공 근거는 `campus-evidence.ts`, 항공사진 전사는 `historical-geometry.ts`, 월별 사건·사업 단계는 `timeline.ts`로 분리했다. **국소 아핀 실험이며 정사복원이 아니다.** 항공 전사 지붕 높이는 미확인으로 3m 표현용이다. MCC는 `mcc.ts`의 두 홀·계단·옥상·국소 지반 모델이며 실제 표고·선큰 깊이는 추정이다. 기관 이전을 건물 철거로 해석하지 않는다.

`data/current-map.json`의 OSM 유래 건물·도로·학교 윤곽은 **© OpenStreetMap contributors, ODbL 1.0**의 추출·파생 데이터이다. [원 데이터와 이용 조건](https://www.openstreetmap.org/copyright) / [ODbL](https://opendatacommons.org/licenses/odbl/1-0/). 파일에 추출 API·수집 시각·원본 SHA256·OSM ID를 포함했다. OSM 변경 시각·start_date를 검증된 준공일로 쓰지 않는다.

고도는 [Terrain Tiles](https://registry.opendata.aws/terrain-tiles/)의 z13 Terrarium 두 장에서 샘플링했다. Mapzen Terrain Tiles / USGS SRTM·GMTED2010 출처를 표시한다. [원자료](https://github.com/tilezen/joerd/blob/master/docs/data-sources.md) / [출처 표시](https://github.com/tilezen/joerd/blob/master/docs/attribution.md). 격자 보간은 해상도를 높이지 않으며 최신 측량·과거 지형을 보증하지 않는다. 벽 하단을 DEM에 접합했으나 실제 옹벽·절토면은 복원하지 않는다.

재수집이 필요할 때만 `node experiments/geography/fetch.mjs` → `python experiments/geography/prepare.py .preview/geo/osm-full.xml .preview/geo`를 실행한다. Python 도구는 Pillow가 필요하다. 원본 학교 사진·항공사진·참고 사이트 코드는 재배포하지 않는다. `screenshots/`는 자체 렌더링만 포함한다.

`python experiments/geography/register_aerial.py`(numpy 필요)로 대응점·행렬·RMS·점 제외 검증을 재생성한다. 좌표는 폭 1100px 미리보기 기준이다. 원사진은 아래 RESULTS의 NGII 식별자로 열람한다. 정합을 원본 전체/도시 전체로 외삽하지 않는다.
