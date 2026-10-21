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

현재 공간은 `data/current-map.json`, 건물 존재·사용기관·이전·도시 재개발 기록은 `history.ts`의 별도 배열이다. 과거 동별 좌표가 없는 네 기관은 1985년에 하나의 권역 표식으로 묶었다. 2001은 8월 이전 이후 연말 기준이다. 미검증 과거 건물은 생성하지 않으며 현행 윤곽은 명시적으로 비교를 켠 경우에만 보인다. 기관 이전을 건물 철거로 해석하지 않는다.

`data/current-map.json`의 OSM 유래 건물·도로·학교 윤곽은 **© OpenStreetMap contributors, ODbL 1.0**의 추출·파생 데이터이다. [원 데이터와 이용 조건](https://www.openstreetmap.org/copyright) / [ODbL](https://opendatacommons.org/licenses/odbl/1-0/). 파일에 추출 API·수집 시각·원본 SHA256·OSM ID를 포함했다. OSM 변경 시각·start_date를 검증된 준공일로 쓰지 않는다.

고도는 [Terrain Tiles](https://registry.opendata.aws/terrain-tiles/)의 z13 Terrarium 두 장에서 샘플링했다. Mapzen Terrain Tiles / USGS SRTM·GMTED2010 출처를 표시한다. [원자료](https://github.com/tilezen/joerd/blob/master/docs/data-sources.md) / [출처 표시](https://github.com/tilezen/joerd/blob/master/docs/attribution.md). 격자 보간은 해상도를 높이지 않으며 최신 측량·과거 지형을 보증하지 않는다. 건물 기초는 중심점 고도에 수평 배치해 옹벽·경사 접합의 오차가 있다.

재수집이 필요할 때만 `node experiments/geography/fetch.mjs` → `python experiments/geography/prepare.py .preview/geo/osm-full.xml .preview/geo`를 실행한다. Python 도구는 Pillow가 필요하다. 원본 학교 사진·항공사진·참고 사이트 코드는 재배포하지 않는다. `screenshots/`는 자체 렌더링만 포함한다.
