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

지도에 초점을 두고 WASD 이동, Q/E 하강·상승, Shift 가속, 드래그 회전, 우클릭 이동, 휠 확대, 더블클릭 지면 이동. 모바일은 한 손가락 회전·두 손가락 확대/이동·방향 버튼 길게 누르기. 학교 선택과 기록 선택으로 바로 이동한다. 연도는 유지된다.

현재 공간은 `data/current-map.json`, 존재·사용기관·이전·도시 재개발은 `history.ts`의 별도 배열, 항공사진 전사 윤곽은 `historical-geometry.ts`이다. 1985.10.21/2001.09.13 사진의 **국소 아핀 실험이며 정사복원이 아니다.** 높이는 미확인으로 3m 표현용, 지반은 현재 DEM이다. 미조사 영역은 비워 두며 현행 윤곽은 비교를 켠 경우에만 보인다. 기관 이전을 건물 철거로 해석하지 않는다.

`data/current-map.json`의 OSM 유래 건물·도로·학교 윤곽은 **© OpenStreetMap contributors, ODbL 1.0**의 추출·파생 데이터이다. [원 데이터와 이용 조건](https://www.openstreetmap.org/copyright) / [ODbL](https://opendatacommons.org/licenses/odbl/1-0/). 파일에 추출 API·수집 시각·원본 SHA256·OSM ID를 포함했다. OSM 변경 시각·start_date를 검증된 준공일로 쓰지 않는다.

고도는 [Terrain Tiles](https://registry.opendata.aws/terrain-tiles/)의 z13 Terrarium 두 장에서 샘플링했다. Mapzen Terrain Tiles / USGS SRTM·GMTED2010 출처를 표시한다. [원자료](https://github.com/tilezen/joerd/blob/master/docs/data-sources.md) / [출처 표시](https://github.com/tilezen/joerd/blob/master/docs/attribution.md). 격자 보간은 해상도를 높이지 않으며 최신 측량·과거 지형을 보증하지 않는다. 벽 하단을 DEM에 접합했으나 실제 옹벽·절토면은 복원하지 않는다.

재수집이 필요할 때만 `node experiments/geography/fetch.mjs` → `python experiments/geography/prepare.py .preview/geo/osm-full.xml .preview/geo`를 실행한다. Python 도구는 Pillow가 필요하다. 원본 학교 사진·항공사진·참고 사이트 코드는 재배포하지 않는다. `screenshots/`는 자체 렌더링만 포함한다.

`python experiments/geography/register_aerial.py`(numpy 필요)로 대응점·행렬·RMS·점 제외 검증을 재생성한다. 좌표는 폭 1100px 미리보기 기준이다. 원사진은 아래 RESULTS의 NGII 식별자로 열람한다. 정합을 원본 전체/도시 전체로 외삽하지 않는다.
