import { Component, Suspense, lazy, useEffect, useRef, useState, type ReactNode } from 'react'
import { ArrowDownLeft, ArrowLeft, ArrowRight, BookOpen, Check, ChevronRight, CircleHelp, Compass, ExternalLink, Flag, History, Layers3, MapPin, Maximize, Minus, MousePointer2, Pause, Play, Plus, RotateCcw, X } from 'lucide-react'
import { buildings, campusInfo, CURRENT_YEAR, events, MIN_YEAR, type Building, type Campus, type HistoryEvent } from './data/history'
import { confidenceLabels } from './data/architecture'
import { buildingExists, campusEvents, clampYear, eventYear } from './lib/time'

const CampusScene = lazy(() => import('./components/CampusScene'))
const SceneAnnotations = lazy(() => import('./components/CampusScene').then(module => ({ default: module.SceneAnnotations })))
const PROTOTYPE_NOTE = '프로토타입: 건물 형태와 배치는 역사적 사실을 정확하게 복원한 것이 아닌 단순화된 시각화입니다.'
class SceneBoundary extends Component<{ children: ReactNode; onFailure: () => void }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch() { this.props.onFailure() }
  render() { return this.state.failed ? null : this.props.children }
}
function supportsWebGL() {
  try {
    const context = document.createElement('canvas').getContext('webgl2')
    if (!context) return false
    context.getExtension('WEBGL_lose_context')?.loseContext()
    return true
  } catch { return false }
}
function useReducedMotion() {
  const [reduced, setReduced] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches)
  useEffect(() => {
    const query = matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(query.matches)
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])
  return reduced
}

function RestorationInfo({ building }: { building: Building }) {
  return <details className="restoration-info" data-confidence={building.modelConfidence}>
    <summary><b>{building.modelConfidence}</b>{confidenceLabels[building.modelConfidence]} · 모델 근거</summary>
    <p><strong>확인한 요소</strong>{building.observed}</p>
    <p><strong>추정·자료 한계</strong>{building.estimated}</p>
    <p>외형 신뢰도와 개관 연도의 검증 여부는 별개입니다.</p>
    {building.sourceReferences.map(source=><a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer">{source.title}<ExternalLink size={11}/></a>)}
  </details>
}

export default function App() {
  const [year, setYear] = useState(CURRENT_YEAR)
  const [campus, setCampus] = useState<Campus>('humanities')
  const [playing, setPlaying] = useState(false)
  const [selected, setSelected] = useState<HistoryEvent | null>(null)
  const [inspected, setInspected] = useState<Building | null>(null)
  const [listOpen, setListOpen] = useState(false)
  const [help, setHelp] = useState(false)
  const [labels, setLabels] = useState(true)
  const [webgl, setWebgl] = useState(supportsWebGL)
  const [cameraCommand, setCameraCommand] = useState<{ kind: 'reset' | 'in' | 'out'; id: number }>({ kind: 'reset', id: 0 })
  const reducedMotion = useReducedMotion()
  const closeButton = useRef<HTMLButtonElement>(null)
  const opener = useRef<HTMLElement | null>(null)
  const info = campusInfo[campus]
  const currentEvents = campusEvents(campus).filter(event => event.year === year)
  const latest = campusEvents(campus).filter(event => event.year <= year).at(-1)
  const displayedCount = buildings.filter(building => building.campus === campus && buildingExists(building, year)).length
  const hasPanel = selected || inspected || listOpen || !webgl
  const selectedBuilding = buildings.find(building=>building.id===selected?.buildingId)

  useEffect(() => {
    if (!playing) return
    const timer = window.setInterval(() => setYear(previous => {
      if (previous >= CURRENT_YEAR) { setPlaying(false); return CURRENT_YEAR }
      return previous + 1
    }), 850)
    return () => window.clearInterval(timer)
  }, [playing])
  useEffect(() => {
    if (selected || inspected || listOpen) closeButton.current?.focus()
  }, [selected, inspected, listOpen])
  useEffect(() => {
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') { setSelected(null); setInspected(null); setListOpen(false); setHelp(false); opener.current?.focus() } }
    window.addEventListener('keydown', close)
    return () => window.removeEventListener('keydown', close)
  }, [])

  function changeYear(value: number) {
    setYear(clampYear(value)); setPlaying(false); setSelected(null); setInspected(null)
  }
  function selectEvent(event: HistoryEvent) {
    opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    if (event.campus !== 'all') setCampus(event.campus)
    setYear(event.year); setPlaying(false); setListOpen(false); setInspected(null); setSelected(event)
  }
  function changeCampus(value: Campus) { setCampus(value); setSelected(null); setInspected(null) }
  function navigate(direction: -1 | 1) {
    const next = eventYear(year, direction)
    changeYear(next)
    const matching = events.filter(event => event.year === next)
    if (!matching.some(event => event.campus === campus || event.campus === 'all') && matching[0]?.campus !== 'all' && matching[0]) setCampus(matching[0].campus)
  }
  function closePanel() { setSelected(null); setInspected(null); setListOpen(false); opener.current?.focus() }
  function inspectBuilding(building: Building) { opener.current=document.activeElement as HTMLElement; setSelected(null); setPlaying(false); setListOpen(false); setInspected(building) }
  function openHistory() { opener.current = document.activeElement as HTMLElement; setSelected(null); setInspected(null); setListOpen(value => !value); setHelp(false) }

  return <div className="app-shell">
    <header className="app-header">
      <a href={import.meta.env.BASE_URL} className="brand" aria-label="MJUTime 처음으로">
        <span className="brand-icon"><History size={23} strokeWidth={2} /></span><span>MJU<span className="brand-light">Time</span><i>BETA</i></span>
      </a>
      <span className="header-description">명지대학교 3D 역사 타임머신</span>
      <nav className="campus-switch" aria-label="캠퍼스 선택">
        <button aria-pressed={campus === 'humanities'} onClick={() => changeCampus('humanities')}>인문캠퍼스 <span>서울</span></button>
        <button aria-pressed={campus === 'nature'} onClick={() => changeCampus('nature')}>자연캠퍼스 <span>용인</span></button>
      </nav>
      <button className="icon-button help-button" aria-label="이용 안내" aria-expanded={help} onClick={() => setHelp(value => !value)}><CircleHelp size={20} /></button>
    </header>

    <main className="explorer" aria-label="3D 캠퍼스 시간 여행">
      <section className="scene" aria-label={`${info.name} ${year}년 3D 장면`}>
        {webgl && <SceneBoundary onFailure={() => setWebgl(false)}><Suspense fallback={<div className="scene-loading"><span className="loading-orbit" />캠퍼스를 불러오고 있어요</div>}><CampusScene campus={campus} year={year} selected={selected} onSelect={selectEvent} labels={labels} cameraCommand={cameraCommand} reducedMotion={reducedMotion} onFailure={() => setWebgl(false)} inspectedId={inspected?.id ?? null} onInspect={inspectBuilding} /><SceneAnnotations campus={campus} year={year} selected={selected} onSelect={selectEvent} labels={labels} onInspect={inspectBuilding} /></Suspense></SceneBoundary>}
        {!webgl && <div className="webgl-fallback"><Layers3 size={36} /><h2>텍스트로 떠나는 시간 여행</h2><p>이 환경에서는 WebGL 2를 사용할 수 없습니다.<br />연도 슬라이더와 역사 목록은 계속 이용할 수 있어요.</p></div>}
      </section>

      <div className="scene-heading">
        <div className="eyebrow"><span className="live-dot" /> EXPLORE THROUGH TIME</div>
        <h1>{info.name}<span>{info.city}</span></h1>
        <p><MapPin size={13} />{info.location}</p>
      </div>
      <div className="scene-top-actions">
        <span className="prototype-badge"><span /> INTERACTIVE PROTOTYPE</span>
        <button className={`history-toggle ${listOpen ? 'active' : ''}`} onClick={openHistory} aria-expanded={listOpen}><BookOpen size={16} />역사 목록<span>{events.length}</span></button>
      </div>

      {help && <section className="help-popover" aria-label="이용 안내"><button className="icon-button close-help" aria-label="안내 닫기" onClick={() => setHelp(false)}><X size={17} /></button><h2>시간을 움직여 보세요.</h2><p>하단 슬라이더로 연도를 바꾸면 건물이 부드럽게 등장합니다. 느낌표를 눌러 그 순간의 이야기를 만나세요.</p><ul><li><MousePointer2 size={16} />드래그로 회전 · 휠로 확대</li><li><Maximize size={16} />모바일은 한 손가락 회전 · 두 손가락 확대</li></ul><p className="help-note">연도는 해당 해의 사건을 모두 포함합니다. 되감기는 철거가 아니라 등장 전 상태로의 이동입니다.</p></section>}

      {!hasPanel && <div className="scene-caption"><span className="caption-line" /><span>시간이 쌓여, 캠퍼스가 되다.</span><small>{info.english}</small></div>}

      {year < info.contextYear && <div className="era-notice"><Flag size={17} /><div><strong>아직 이곳에 닿기 전의 이야기</strong><p>{info.contextYear}년 이전의 현 캠퍼스 건물은 표시하지 않습니다.<br />초기 역사의 공간 자료가 부족해 개념 부지만 보여드립니다.</p></div></div>}
      {year >= info.contextYear && year < CURRENT_YEAR && !hasPanel && <div className="past-notice"><span />검증된 개관 연도의 건물만 표시 중 <strong>{displayedCount}동</strong></div>}

      {!hasPanel && latest && year >= info.contextYear && <button className={`moment-preview ${currentEvents.length ? 'is-current' : ''}`} onClick={() => selectEvent(currentEvents[0] ?? latest)}>
        <span className="moment-icon">!</span><span><small>{currentEvents.length ? '이 해의 이야기' : '캠퍼스의 최근 변화'} · {(currentEvents[0] ?? latest).year}</small><strong>{(currentEvents[0] ?? latest).title}</strong></span><ChevronRight size={18} />
      </button>}

      {hasPanel && <aside className={`story-panel ${selected || inspected ? 'detail' : 'list'}`} role={selected || inspected ? 'dialog' : 'region'} aria-modal={selected || inspected ? false : undefined} aria-label={inspected ? `${inspected.name} 건물 정보` : selected ? `${selected.year}년 사건 상세` : '전체 역사 목록'}>
        <div className="panel-topline"><span><BookOpen size={15} />{inspected ? '건축의 모습과 근거' : selected ? '한 장면의 역사' : '명지의 발자취'}</span>{webgl && <button ref={closeButton} className="icon-button" onClick={closePanel} aria-label="사건 패널 닫기"><X size={19} /></button>}</div>
        {inspected ? <><div className="story-content">
          <span className="eyebrow">ARCHITECTURE · v0.2</span><h2>{inspected.name}</h2>
          <p className="story-description">{inspected.observed}</p>
          <div className="model-confidence"><b>{inspected.modelConfidence}</b>{confidenceLabels[inspected.modelConfidence]}</div>
          <p className="story-model-note">{inspected.estimated}</p>
          <p className="story-model-note">{inspected.firstVerifiedYear ? `${inspected.firstVerifiedYear}년 개관 연혁 확인` : '신축 연도 미확인: 현재 연도에만 표시합니다.'}</p>
          <RestorationInfo building={inspected}/>
          <button className="back-to-explore" onClick={closePanel}><ArrowLeft size={15}/>캠퍼스 탐색으로</button>
        </div><div className="story-source-dock"><div className="source-box"><span><Check size={13}/>건축 자료</span><a href={inspected.sourceReferences[0].url} target="_blank" rel="noopener noreferrer">원본 자료 열기<ExternalLink size={14}/></a></div></div></> : selected ? <><div className="story-content" key={selected.id}>
          <div className="story-year">{selected.year}<span>{selected.month ? `${String(selected.month).padStart(2, '0')}월` : 'YEAR'}</span></div>
          <span className="category-tag">{selected.category === 'building' ? '공간의 탄생' : selected.category === 'campus' ? '캠퍼스의 이동' : '역사의 전환점'}</span>
          <h2>{selected.title}</h2><p className="story-description">{selected.description}</p>
          <div className="story-location"><MapPin size={15} />{selected.campus === 'all' ? '명지대학교 · 학교 전체 사건' : campusInfo[selected.campus].name}</div>
          <p className="story-model-note">{selected.buildingId ? '개관 시점은 공식 기록에 근거합니다. 건물의 외형과 위치는 시연용으로 단순화했습니다.' : '이 마커는 역사적 사건의 안내 위치이며, 실제 건물 위치나 신축을 뜻하지 않습니다.'}</p>
          {selectedBuilding && <RestorationInfo building={selectedBuilding}/>}
          <button className="back-to-explore" onClick={closePanel}><ArrowLeft size={15} />캠퍼스 탐색으로</button>
        </div><div className="story-source-dock"><div className="source-box"><span><Check size={13} />공식 자료 확인</span><a href={selected.sourceUrl} target="_blank" rel="noopener noreferrer">명지대학교 공식 연혁<ExternalLink size={14} /></a></div></div></> : <div className="history-list"><h2>시간을 따라 걷다.</h2><p>장면을 선택해 그해의 캠퍼스로 이동하세요.</p>{events.map(event => <button key={event.id} className={`history-row ${event.year === year ? 'at-year' : ''} ${event.year > year ? 'future-event' : ''}`} onClick={() => selectEvent(event)}><span className="history-year">{event.year}<i /></span><span><small>{event.campus === 'all' ? '학교 전체' : campusInfo[event.campus].name}{event.year > year && ' · 다가올 장면'}</small><strong>{event.title}</strong></span><ChevronRight size={15} /></button>)}</div>}
      </aside>}

      <div className="view-controls" aria-label="3D 보기 제어">
        <button className="icon-button" aria-label="카메라 확대" onClick={() => setCameraCommand(command => ({ kind: 'in', id: command.id + 1 }))}><Plus size={19} /></button>
        <button className="icon-button" aria-label="카메라 축소" onClick={() => setCameraCommand(command => ({ kind: 'out', id: command.id + 1 }))}><Minus size={19} /></button>
        <span /><button className="icon-button" aria-label="기본 시점으로" onClick={() => setCameraCommand(command => ({ kind: 'reset', id: command.id + 1 }))}><RotateCcw size={17} /></button>
        <button className={`icon-button ${labels ? 'enabled' : ''}`} aria-label="건물 이름 표시" aria-pressed={labels} onClick={() => setLabels(value => !value)}><Layers3 size={18} /></button>
      </div>
      <div className="scene-bottomline"><div className="legend"><span><i className="legend-verified" />A·B 근거 모델 / C 개념</span><span><i className="legend-concept" />연도 미상 건물은 현재만</span></div><span className="orbit-hint"><MousePointer2 size={13} />드래그하여 회전<span>·</span>스크롤하여 확대</span><div className="north"><Compass size={18} /><span>자유 탐색</span></div></div>
    </main>

    <footer className="time-machine">
      <div className="timeline-main">
        <div className="year-display"><span>지금, 우리가 있는 시간</span><div><output aria-live="off" data-testid="current-year">{year}</output><span>년</span><span className="year-status">{year === CURRENT_YEAR ? '현재' : '과거'}</span></div></div>
        <div className="timeline-track">
          <div className="track-caption"><span><ArrowDownLeft size={13} />슬라이더를 움직여 시간을 여행하세요</span><span>{MIN_YEAR} — {CURRENT_YEAR}</span></div>
          <div className="range-wrap" style={{ '--progress': `${(year - MIN_YEAR) / (CURRENT_YEAR - MIN_YEAR) * 100}%` } as React.CSSProperties}>
            <div className="event-ticks" aria-label="주요 사건 연도">{[...new Set(events.map(event => event.year))].map(eventYear => <button key={eventYear} aria-label={`${eventYear}년으로 이동`} title={`${eventYear} · ${events.filter(event => event.year === eventYear).map(event => event.title).join(', ')}`} className={eventYear <= year ? 'passed' : ''} style={{ left: `${(eventYear - MIN_YEAR) / (CURRENT_YEAR - MIN_YEAR) * 100}%` }} onClick={() => changeYear(eventYear)}><i /></button>)}</div>
            <input aria-label="시간 여행 연도" type="range" min={MIN_YEAR} max={CURRENT_YEAR} step={1} value={year} onChange={event => changeYear(Number(event.target.value))} />
          </div>
          <div className="year-ticks" aria-hidden="true">{[1948, 1960, 1970, 1980, 1990, 2000, 2010, 2020, CURRENT_YEAR].map(tick => <span key={tick} style={{ left: `${(tick - MIN_YEAR) / (CURRENT_YEAR - MIN_YEAR) * 100}%` }}>{tick}</span>)}</div>
        </div>
        <div className="playback-controls"><div><button className="icon-button" aria-label="이전 사건" onClick={() => navigate(-1)} disabled={year <= MIN_YEAR}><ArrowLeft size={18} /></button><button className="play-button" aria-label={playing ? '시간 여행 일시정지' : '자동 시간 여행 재생'} aria-pressed={playing} onClick={() => { setSelected(null); setInspected(null); if (!playing && year >= CURRENT_YEAR) setYear(MIN_YEAR); setPlaying(value => !value) }}>{playing ? <Pause size={21} fill="currentColor" /> : <Play size={21} fill="currentColor" />}</button><button className="icon-button" aria-label="다음 사건" onClick={() => navigate(1)} disabled={year >= CURRENT_YEAR}><ArrowRight size={18} /></button></div><span>{playing ? '시간을 여행하는 중' : '자동 시간 여행'}</span></div>
      </div>
      <div className="timeline-footer"><p><span className="notice-dot">i</span>{PROTOTYPE_NOTE}</p><span>되감기는 철거가 아닌, 등장 전 상태로의 이동입니다.</span></div>
    </footer>
  </div>
}
