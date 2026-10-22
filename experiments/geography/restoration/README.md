# 역사공간 복원 파이프라인 · 2026-10-22

작업 기준 커밋 `22f6df0`, 브랜치 `experiment/geographic-history` 전용. 공개 Pages 배포를 수행하지 않는다.

## 실제 결과와 한계

**완성된 과거 정밀 복원이 아니다.** 공식 사실 조사, 기존 정합 감사, 날짜별 존재/용도 데이터, 현재 윤곽 참조 GeoJSON, Three.js 추정 매스, 허가된 로컬 원본의 일괄 후보 추출까지 구현했다. 자동 사이트 로그인·비공개 API 역공학·스크린샷 반복·Google Earth 데이터 추출은 구현하지 않았다.

`catalog.json`은 출처 13건의 접근 상태와 용도별 이용 조건, 주요 건물 9개, 사용자 보고 Google Earth 날짜 4개, 원본 확보 여부를 기록한다. `images`는 현재 빈 배열이다. **과거 항공사진 자동 추출 실적은 0장**이며, 후보 추출기는 직접 만든 합성 도형으로만 검증했다. 후보를 역사적 건물로 자동 승격하지 않는다.

| 시점 | 현재 윤곽 참조 매스 | 과거 형상 확정 | 옛 체육관 |
| --- | ---: | ---: | --- |
| 2002-12-31 | 5개 | 0개 | 존재/윤곽 미확인 |
| 2006-12-31 | 6개 | 0개 | 존재/윤곽 미확인 |
| 2010-12-31 | 7개 | 0개 | 철거일/윤곽 미확인 |
| 2026-10-22 | 8개 | 별도 항공측량 없음 | 현 도서관으로 대체 서술만 확보 |

각 연도 말은 비교용 스냅숏이며 실제 사진 촬영일이 아니다. 2026은 작업일 기준이다. 완공 이후 존치는 추정, 완공 이전 상태는 미확인이다. 준공 전이라고 건물 부재로 확정하지 않는다. `geometry:null`은 미조사/미확인이고 부재가 아니다. 확정 철거 기록이 입력된 경우에만 `absent`를 반환한다. 층수 근거와 층고 가정(3m)을 분리한다. 1970~1971년, 과거 개별 교사, 주변 주택가 복원은 미완료다.

## 새로 확인한 사실

- [공식 2000년대 연혁](https://mjhistory.mju.ac.kr/mjukr/161/subview.do): 인문생활관 2006.02 신축 개관, 지하2·지상7층. [시설 소개](https://www.mju.ac.kr/mjukr/7695/subview.do)에는 2006.03 설립으로 기술되어 월 차이를 보존했다. `completed`를 임의의 날짜로 만들지 않고 `knownBy=2006-02-28`에 월말 상한이라는 뜻을 명시했다.
- [공식 2010년대 연혁](https://www.mju.ac.kr/mjukr/160/subview.do): 2010.03 방목학술정보관 신축 개관. 기존 대장 전사 준공일 2010.01.20과 별도다. 기존 시설 PDF 수치는 브랜치 전사에서 상속했으며 이번 실행에서 PDF를 다시 열어 검증하지 않았다.
- [명대신문 1139호](https://news.mju.ac.kr/news/articleView.html?idxno=13137) 검색 색인에 1972년 실내체육관 완공 및 도서관 부지로 교체된 설명이 있다. 이번 원문 열기는 404로 실패했다. 원문·당시 사진·층수·철거일을 확보하지 못해 **과거 체육관 모델을 생성하지 않았다**. 도서관의 현 윤곽을 체육관에 복사하지 않는다.
- [대학사료실 전시 목록](https://archives.mju.ac.kr/servlet/com.kait.mms.cybr.exbt.ExbtLstCmd?pExbtGubun=stop): 2015.09.14~12.18 ‘명지대학교 캠퍼스 변천사’ 전시 확인. [이용안내](https://archives.mju.ac.kr/cybr/intro/Guide.jsp)는 전화·이메일·팩스·직접방문 열람 신청을 안내한다. 열람 개방은 사진 가공 허락으로 취급하지 않았다.
- 1997 행정동, 2001 전문대 이전, MCC 전후 운동장, 주변 정비사업 기록은 기존 `campus-evidence.ts`, `history.ts`, `timeline.ts`를 조사했다. 대학의 공간 인수/기관 이전과 옛 건물 철거는 별개다. 기존 도시변화 코드는 유지했다.

## 자료 취득 및 이용 조건

| 자료 | 이번 확인 | 처리 |
| --- | --- | --- |
| [NGII 정사영상](https://www.data.go.kr/data/15059919/fileData.do) | 이용허락범위 제한 없음; 2010년 이후; TIFF; 로그인·전용 대용량 전송 프로그램 필요 | 목록 차원의 가공 조건 확인. 캠퍼스 도엽/정확 촬영일/해시/원본 미확보. 기존 미리보기 권한으로 전파하지 않음 |
| [NGII 항공사진](https://map.ngii.go.kr/ms/map/Aerial.do) | 이번 공개 웹 열기 실패 | 기존 ID·정합 감사만. 개별 원본 가공 조건 미확인으로 신규 추출 차단 |
| [서울 항공사진](https://aerogis.seoul.go.kr/) | 접근 불가 | 우회 없음. 원본·이용조건 미확인 |
| [사업지구](https://www.data.go.kr/data/15148107/fileData.do) | 3595행, 이용허락범위 제한 없음 | 메타데이터 원본 미다운로드. 사진 라이선스 아님 |
| [촬영기록 코스](https://www.data.go.kr/data/15067483/fileData.do?recommendDataYn=Y) | 1947~2025, 97104행; 사업지구/촬영일/렌즈/코스 키 | 목록만 확인; 원본·개별 조건 미확인. 지구코드에서 촬영 월 추측 금지 |
| OSM 현 윤곽 | 기존 로컬 데이터 | © OpenStreetMap contributors / ODbL-1.0; 파생 DB 동일조건 의무 보존 |
| 대학/신문/사료실 사진 | 공개 사실·목록 조사 | 이미지 다운로드/가공/재배포 허가 확인 안 됨. 사실만 요약 |
| Google Earth | 사용자 보고 날짜만 보존 | 시각적 참고 전용. 다운로드/파생 데이터 생성 차단 |

위 표는 이번 확인의 범위이지 모든 개별 파일에 대한 포괄 허가가 아니다. 새 자료를 사용할 때 해당 파일의 식별자·날짜·조건을 기록해야 한다. 원본 이미지는 저장소에 포함하지 않는다.

## 생성물

- `generated/building-presence.csv`: 4시점 × 9개 건물, 존재·추정등급·용도·층고근거·출처.
- `generated/campus-{2002,2006,2010,2026}.geojson`: WGS84 경위도 순서, 닫힌 외곽선, 현재 윤곽을 이용한 참조 형상. 지역 평면식 역변환이므로 측량용 CRS 변환이 아니다.
- `generated/snapshots.json`: Three.js용 데이터, 로컬 원점과 출처 포함.
- `generated/registration-audit.json`: 기존 5건의 행렬 재적합, 잔차·대조점 하나씩 제외한 오차(LOO), 독립 검증은 `null`.
- `generated/acquisition-plan.json`: 연도별 미취득 원본·차단요인·다음 처리 단계.
- `models.ts`: 기존 Three.js 씬에 넣을 `makeModels` / `disposeModels`. 새 검토 화면은 `restoration.html`.

## 정합 오차 재계산

| 촬영일 | 원본 ID | 적합 RMS | LOO 최대 | 단위 |
| --- | --- | ---: | ---: | --- |
| 1985-10-21 | 2662182 | 1.99 | 4.98 | 2001 미리보기 픽셀 |
| 1997-10-13 | 2762727 | 12.24 | 42.83 | 로컬 m |
| 2001-09-13 | 2729075 | 5.77 | 23.61 | 로컬 m |
| 2006-11-29 | 2748690 | 4.89 | 43.10 | 로컬 m |
| 2016-10-11 | 2700585 | 8.51 | 31.47 | 로컬 m |

1985는 두 지붕의 상관된 꼭짓점으로 2001 미리보기에 정합한 결과다. m 단위도 절대 위치 정확도·95% 신뢰구간·오차 상한이 아니다. OSM 지붕 중심의 대응 추정, 건물 시차·지형·렌즈 왜곡 오차가 남는다. 새 코드는 좌표 중심화 후 아핀 적합, 퇴화 대조점 기각, LOO와 독립 대조점 오차 분리를 제공한다. 자동 영상 간 특징점 매칭·정사보정·높이 복원은 구현하지 않았다.

## 실행

Node 24+, Python 3.12에서 검증했다. 새 함수는 한 줄 포매팅을 사용한다.

```sh
npm ci
python -m pip install -r experiments/geography/restoration/requirements.txt
npm run restore:build
npm run restore:test
npm run dev:geo
```

검토 화면: `http://127.0.0.1:4188/MJUTime/restoration.html`. 실험 빌드에는 기존 `geography.html`과 새 검토 화면이 함께 들어간다. 일반 `npm run build`의 공개 앱 입력은 변경하지 않았다.

허가된 원본과 사이드카를 한 번만 준비하면 반복 스크린샷 없이 실행한다. 사이드카는 실제 파일에 대응해야 한다. 필수 항목: `sourceId`(catalog의 허용 자료), `originalId`, 정확한 `captureDate`, `dateEvidence`, 원본 파일 `sha256`, 등록에 사용한 `[width,height]`의 `pixelSize`, 3×2 픽셀→로컬 m `matrix`, `registrationEvidence`. 축소/크롭 시 크기·변환·해시를 함께 갱신한다. TIFF 자체의 CRS를 자동 해석하지 않으므로 지도 좌표가 있으면 검증된 로컬 변환을 별도로 제공한다. 날짜/해시/행렬 검사는 근거 기록의 진위를 자동 보증하지 않는다.

```sh
node experiments/geography/restoration/run.mjs register controls.json registration.json
node experiments/geography/restoration/run.mjs extract image-metadata.json licensed-image.tif pixel-candidates.json
node experiments/geography/restoration/run.mjs batch local-jobs.json
node experiments/geography/restoration/run.mjs evaluate image-metadata.json licensed-image.tif pixel-candidates.json manual-mask.png metrics.json
```

`controls.json`: `units`는 `local-metres`, `controls`는 `[pixelX,pixelY,localX,localZ]` 행 배열, `checkpoints`는 적합에 사용하지 않은 같은 형식의 대조점이다. 작업 좌표 원점은 `current-map.json`의 `meta.origin`이며 x=동, z=남이다.

`local-jobs.json`: `metadata`, `image`, `output` 경로를 가진 객체 배열이다. 각 작업을 순차 처리하고 실패/차단 이유를 보고한다. 권한 검사를 통과한 작업만 처리한다. 실패 시 비공개 경로나 대체 미리보기로 우회하지 않는다. Python 실행 파일은 `MJUTIME_PYTHON`으로 지정할 수 있다.

추출은 Gaussian 5×5 → Canny 50/150 → 외곽 컨투어 → 면적 ≥25px² → 둘레 1% 단순화다. 출력은 픽셀 좌표 후보 JSON과 WGS84 후보 GeoJSON이며 전부 `unverified`, 신원·높이·정합 정확도는 `null`이다. 도로·수목·그림자도 검출되며 구멍/복잡한 지붕 구조를 정확히 보존하지 않는다. 후보 픽셀 좌표 파일은 RFC7946 GeoJSON으로 오인되지 않게 별도 표시한다. 실자료 수동 정답 마스크가 없어 실제 건물 검출 IoU·정밀도·재현율은 **미측정**이다. `evaluate`가 제공하는 값도 픽셀 영역 지표이며 건물 신원 정답률이 아니다.

## 남은 작업과 최소 수작업

1. 정사영상의 대상 도엽과 실제 촬영일을 선택해 허용 원본을 일괄 확보해야 한다. 이번 환경에서는 공식 로그인/전송 요구 때문에 취득하지 못했다. 일단 원본을 폴더로 확보한 뒤 사이드카를 구성하면 이후 배치는 자동이다.
2. 대학사료실 ‘캠퍼스 변천사’의 개별 사료 식별번호와 옛 체육관·교사 사진/배치도의 가공 조건을 확인해야 한다. 전시 목차만으로 형상을 만들지 않았다.
3. 연도별 4개 이상의 넓게 분산된 대조점과 별도 독립 검증점이 필요하다. 현재 roof-centre 정합을 정사보정으로 대체해야 한다.
4. 후보를 원문 준공/철거 기록 및 사진과 대조해 건물 ID를 검수하고 정답 마스크를 작성해야 한다. 신원 매칭·층수 추출·높이 추정 자동 학습 모델은 미구현이다.
5. 체육관 철거 구간, 생활관 착공/준공일, MCC 공사 전 운동장 경계와 소멸일, 주변 주택의 주소별 동일성을 추가 확인해야 한다. 주변 주택가/아파트를 임의로 생성·철거하지 않았다.

## 검증

`VERIFICATION.md` 참조. 실제 브라우저 렌더 검증은 Chromium 다운로드 실패로 미수행이다. Three.js geometry 생성과 타입·빌드는 검증했으나 이를 화면 QA 통과로 표현하지 않는다.
