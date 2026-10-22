import * as THREE from 'three'
import {Navigation} from './navigation'
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js'
import {mapData as data,heightAt,inRing,project,type Point} from './spatial'
import {historicalMarkers,yearNotes,sources,type Year} from './history'
import {featuresFor,worldRing,type Epoch} from './historical-geometry'
import {TimeScene} from './time-scene'
import {events,monthIndex,splitMonth,monthLabel,MIN_MONTH,MAX_MONTH,clampMonth,referenceEpoch,photoMonth,isCurrent,eventsInMonth,eventMonth,dateLabel,advancePlayback,trackedBuildings,buildingKnown,projectStage,projectSources} from './timeline'
import {defaults,type CameraSettings} from './camera-settings'
import {registered,registerSource,featureEvidence} from './campus-evidence'
import {MccScene,inMccPatch,mccFootprint} from './mcc'
import {StoryScroll} from './story-scroll'
import {IntegratedCampus} from './campus-architecture'
import {CampusSurfaces} from './campus-surfaces'
import {integratedIds,restorationEpochs} from './integrated-evidence'
import {makeOldGym,gymScenarioAt,gymEvidence} from './old-gym'
import './style.css'

document.querySelector('#map')!.innerHTML=`<header><div><small>MJUTime / GEOGRAPHIC STUDY · 실험 브랜치</small><h1>남가좌동에서 홍은동까지</h1><p>건물의 모양보다, 먼저 실제 공간.</p></div><span class="badge">공개 사이트와 분리된 시제품</span></header><main><div id="viewport" aria-label="남가좌동·홍은동 실제 좌표 3D 지도"><div id="labels"></div><div class="map-tools"><button id="home">사선 보기</button><button id="top">위에서 보기 · 북쪽 ↑</button></div><div class="map-caption"><b id="map-state"></b><span>드래그 회전 · 휠 확대 · 우클릭 이동</span></div></div><aside><small>세 시점의 비교</small><nav aria-label="비교 연도">${[1985,2001,2026].map(y=>`<button data-year="${y}" aria-pressed="${y===2026}">${y}</button>`).join('')}</nav><h2 id="year-title"></h2><div id="notes"></div><label id="context-option" hidden><input id="context" type="checkbox"/> 현재 건물·도로 겹쳐 비교 <em>과거 복원 아님</em></label><div class="source-list" id="sources"></div><div class="limits"><b>확인할 수 있는 것과 없는 것</b><p>윤곽은 OSM 관측값, 지형은 저해상도 DEM입니다. 건물 높이·옹벽·절토면·과거 골목은 정확히 복원하지 않았습니다.</p><p>1985·2001 항공영상의 위치·촬영시점 검증이 완료되지 않아 과거 건물은 표식만 제공합니다.</p></div></aside></main><footer><div class="key"><i style="--key:#3975cc"></i>명지대 <i style="--key:#199282"></i>전문대 <i style="--key:#d59539"></i>초등학교 <i style="--key:#8b69bb"></i>중학교 <i style="--key:#c96879"></i>고등학교</div><p>© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap contributors · ODbL</a> · 고도: <a href="https://registry.opendata.aws/terrain-tiles/" target="_blank" rel="noopener">Mapzen Terrain Tiles / USGS SRTM·GMTED</a><br/>고도 배율 1× · 실제 좌표, 높이 일부 추정 · 학교 경계는 현행 OSM 참조</p></footer>`
const host=document.querySelector<HTMLElement>('#viewport')!
const journey=document.createElement('div');journey.id='journey'
const stage=document.querySelector('main')!;stage.before(journey);journey.append(stage)
journey.insertAdjacentHTML('beforeend','<div id="scroll-track" aria-hidden="true"></div>')
document.querySelector('.limits p:last-child')!.textContent='과거 황토색은 항공사진 국소 전사입니다. 지붕 높이 3m는 표현용이며 정사보정되지 않았습니다. 현재 DEM을 사용하므로 당시 지반고가 아닙니다. 빈 곳은 미조사 영역입니다.'
document.querySelector('.limits')!.insertAdjacentHTML('beforeend','<p><a href="./restoration.html">2002·2006·2010·2026 복원 근거 검토 →</a></p>')
const labelHost=document.querySelector<HTMLElement>('#labels')!
const leaders=document.createElementNS('http://www.w3.org/2000/svg','svg');leaders.id='leaders';host.append(leaders)
const renderer=new THREE.WebGLRenderer({antialias:true})
renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.setClearColor('#eef2f3')
renderer.outputColorSpace=THREE.SRGBColorSpace
host.prepend(renderer.domElement)
const scene=new THREE.Scene()
scene.add(new THREE.AmbientLight('#edf4ff',1.8))
const sun=new THREE.DirectionalLight('#fff5e4',2.5);sun.position.set(-700,1700,700);scene.add(sun)
const desktopQuality=!matchMedia('(pointer: coarse)').matches
renderer.shadowMap.enabled=desktopQuality;renderer.shadowMap.type=THREE.PCFSoftShadowMap
sun.castShadow=desktopQuality;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-400;sun.shadow.camera.right=400;sun.shadow.camera.top=350;sun.shadow.camera.bottom=-350;sun.shadow.camera.far=2600;sun.shadow.normalBias=.6
sun.target.position.set(-300,40,280);scene.add(sun.target)
const camera=new THREE.PerspectiveCamera(38,1,2,15000)
const terrainGroup=new THREE.Group(),currentGroup=new THREE.Group(),markerGroup=new THREE.Group()
const historicalGroup=new THREE.Group(),eventGroup=new THREE.Group()
const timeScene=new TimeScene()
const integratedCampus=new IntegratedCampus(),campusSurfaces=new CampusSurfaces(),oldGym=makeOldGym()
const mccScene=new MccScene();terrainGroup.add(mccScene.patch)
scene.add(terrainGroup,currentGroup,markerGroup,historicalGroup,eventGroup,timeScene.group,mccScene.group,integratedCampus.group,campusSurfaces.group,oldGym)
for(const group of [integratedCampus.group,oldGym,mccScene.group])group.traverse(o=>{if(o instanceof THREE.Mesh){o.castShadow=desktopQuality;o.receiveShadow=desktopQuality}})
for(const group of [terrainGroup,campusSurfaces.group])group.traverse(o=>{if(o instanceof THREE.Mesh)o.receiveShadow=desktopQuality})
const palette:Record<string,string>={university:'#3975cc',college:'#199282',elementary:'#d59539',middle:'#8b69bb',high:'#c96879',background:'#c3c4bc'}
function terrainMesh(){
  const t=data.terrain,positions:number[]=[],colors:number[]=[],indices:number[]=[]
  const lo=new THREE.Color('#dfe5da'),hi=new THREE.Color('#7b9e7e'),color=new THREE.Color()
  for(let j=0;j<t.rows;j++)for(let i=0;i<t.cols;i++){
    const h=t.heights[j*t.cols+i];positions.push(t.min[0]+(t.max[0]-t.min[0])*i/(t.cols-1),h,t.min[1]+(t.max[1]-t.min[1])*j/(t.rows-1))
    color.copy(lo).lerp(hi,Math.max(0,Math.min(1,(h-45)/190)));colors.push(color.r,color.g,color.b)
    if(i<t.cols-1&&j<t.rows-1&&!inMccPatch(t.min[0]+(t.max[0]-t.min[0])*(i+.5)/(t.cols-1),t.min[1]+(t.max[1]-t.min[1])*(j+.5)/(t.rows-1))){const a=j*t.cols+i;indices.push(a,a+t.cols,a+1,a+1,a+t.cols,a+t.cols+1)}
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.setIndex(indices);g.computeVertexNormals()
  const mesh=new THREE.Mesh(g,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,side:THREE.DoubleSide}));mesh.receiveShadow=desktopQuality;terrainGroup.add(mesh)
}
terrainMesh()
host.insertAdjacentHTML('beforeend',`<div class="touch-flight" aria-label="터치 이동">${[['w','앞으로','↑'],['a','왼쪽으로','←'],['s','뒤로','↓'],['d','오른쪽으로','→'],['q','아래로','−'],['e','위로','＋']].map(([key,name,glyph])=>`<button data-move="${key}" aria-label="${name}">${glyph}</button>`).join('')}</div>`)
const navigation=new Navigation(camera,renderer.domElement,host,terrainGroup)
const controls=navigation.controls
const home=()=>navigation.home()
const regionView=new URLSearchParams(location.search).get('view')==='region'
if(regionView)home();else navigation.campus()
document.querySelector('.map-tools')!.insertAdjacentHTML('beforeend',`<details id="camera-settings"><summary>카메라 설정</summary>${[['rotate','회전'],['pan','이동'],['zoom','줌'],['move','WASD 속도']].map(([key,label])=>`<label>${label} <output id="${key}-value"></output><input data-sensitivity="${key}" aria-label="${label} 감도" type="range" min="0.1" max="1.5" step="0.1" value="${navigation.settings[key as keyof CameraSettings]}"/></label>`).join('')}<p>기본 0.5× · Alt 정밀 이동 · Shift 가속</p><button id="reset-camera">감도 초기화</button></details>`)
function syncCameraSettings(){for(const key of Object.keys(defaults) as (keyof CameraSettings)[]){document.querySelector<HTMLOutputElement>(`#${key}-value`)!.value=`${navigation.settings[key].toFixed(1)}×`;document.querySelector<HTMLInputElement>(`[data-sensitivity="${key}"]`)!.value=String(navigation.settings[key])}}
document.querySelectorAll<HTMLInputElement>('[data-sensitivity]').forEach(input=>input.oninput=()=>{navigation.setSettings({[input.dataset.sensitivity!]:Number(input.value)});syncCameraSettings()})
document.querySelector<HTMLButtonElement>('#reset-camera')!.onclick=()=>{navigation.setSettings(defaults);syncCameraSettings()};syncCameraSettings()
document.querySelector('.map-tools')!.insertAdjacentHTML('beforeend',`<select id="school-jump" aria-label="학교로 이동"><option value="">학교로 이동</option>${data.sites.map(s=>`<option value="${s.id}">${s.name}</option>`).join('')}</select>`)
document.querySelector<HTMLSelectElement>('#school-jump')!.onchange=e=>{const s=data.sites.find(s=>s.id===(e.target as HTMLSelectElement).value);if(s)navigation.travel(s.center as Point);(e.target as HTMLSelectElement).value=''}
document.querySelector('.map-tools')!.insertAdjacentHTML('beforeend','<button id="explore" aria-pressed="false">자유 탐험</button>')
let exploring=false
function interactionMode(){
  navigation.controls.enableZoom=exploring
  navigation.controls.enabled=exploring||!matchMedia('(pointer: coarse)').matches
  renderer.domElement.style.touchAction=exploring?'none':'pan-y'
  document.querySelector('#explore')!.setAttribute('aria-pressed',String(exploring))
  document.querySelector('#explore')!.textContent=exploring?'스크롤 여행으로':'자유 탐험'
  document.querySelector('.map-caption span')!.textContent=exploring?'WASD · Q/E · 드래그 회전 · 휠/두 손가락 줌 · 더블클릭 이동':'아래로 스크롤 → 과거 · 위로 → 현재 · 줌/터치 회전은 자유 탐험'
  if(story){story.enabled=!exploring;story.sync(timeIndex)}
}
document.querySelector<HTMLButtonElement>('#explore')!.onclick=()=>{exploring=!exploring;interactionMode()}
function drapedLine(p:number[][],color:string,y=1){
  const points:THREE.Vector3[]=[]
  p.forEach((a,i)=>{if(!i)return;const b=p[i-1],steps=Math.ceil(Math.hypot(a[0]-b[0],a[1]-b[1])/10);for(let j=0;j<=steps;j++){const t=j/steps,x=b[0]+(a[0]-b[0])*t,z=b[1]+(a[1]-b[1])*t;points.push(new THREE.Vector3(x,heightAt(x,z)+y,z))}})
  return new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color}))
}
// Road ribbons follow the DEM, including intermediate samples on long segments.
const roadPositions:number[]=[],roadColors:number[]=[]
for(const road of data.roads){
  const foot=['footway','path','steps','track','pedestrian'].includes(road.kind)
  const width=foot?1.7:['primary','secondary'].includes(road.kind)?12:road.kind==='tertiary'?8:4
  const color=new THREE.Color(foot?'#b5c4b2':'#fbfaf5')
  road.p.forEach((a,i)=>{if(!i)return;const b=road.p[i-1],dx=a[0]-b[0],dz=a[1]-b[1],len=Math.hypot(dx,dz);if(!len)return
    const ox=-dz/len*width/2,oz=dx/len*width/2,n=Math.ceil(len/10)
    for(let s=0;s<n;s++){
      const ax=b[0]+dx*s/n,az=b[1]+dz*s/n,bx=b[0]+dx*(s+1)/n,bz=b[1]+dz*(s+1)/n
      if(inRing([(ax+bx)/2,(az+bz)/2],mccFootprint))continue // current campus circulation is represented by the stepped model
      const corners=[[ax+ox,az+oz],[ax-ox,az-oz],[bx+ox,bz+oz],[bx-ox,bz-oz]]
      for(const index of [0,2,1,1,2,3]){const [x,z]=corners[index];roadPositions.push(x,heightAt(x,z)+.75,z);roadColors.push(color.r,color.g,color.b)}
    }
  })
}
const roads=new THREE.BufferGeometry();roads.setAttribute('position',new THREE.Float32BufferAttribute(roadPositions,3));roads.setAttribute('color',new THREE.Float32BufferAttribute(roadColors,3));roads.computeVertexNormals()
currentGroup.add(new THREE.Mesh(roads,new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.DoubleSide})))
const categories=new Map<string,THREE.BufferGeometry[]>()
const housingArea=data.areas.find(a=>a.id==='1126398129')!
let footprintCount=0
for(const b of data.buildings){
  if(b.p.length<3)continue
  if(b.id==='1127358152'){footprintCount++;continue} // dedicated multi-level model, never duplicate OSM slab
  if(integratedIds.has(b.id)){footprintCount++;continue} // GeoJSON-backed detailed model owns this footprint at every date
  const site=data.sites.find(s=>inRing(b.center,s.p))
  const key=site?.id??'background'
  const shape=new THREE.Shape(b.p.map(([x,z])=>new THREE.Vector2(x,-z)))
  const record=registered(b.id),height=record?record.above*3:b.height // 3m/floor is an explicit height proxy, not a measured elevation.
  const g=new THREE.ExtrudeGeometry(shape,{depth:height,bevelEnabled:false,steps:1,curveSegments:1})
  g.rotateX(-Math.PI/2)
  // Roof is horizontal; wall bottoms follow the sampled DEM rather than floating.
  // This corrects the seam, not surveyed terraces or retaining walls.
  const foundation=Math.max(heightAt(...b.center as Point),...b.p.map(([x,z])=>heightAt(x,z)))
  const positions=g.getAttribute('position')
  for(let i=0;i<positions.count;i++){const x=positions.getX(i),z=positions.getZ(i);positions.setY(i,positions.getY(i)<.01?heightAt(x,z)-.2:foundation+height)}
  g.computeVertexNormals()
  if(trackedBuildings.some(d=>d.id===b.id)){timeScene.adopt(b.id,g.clone(),b.center as Point,foundation);g.dispose();footprintCount++;continue}
  if(inRing(b.center,housingArea.p))timeScene.adoptHousing(b.id,g.clone(),b.center as Point,foundation)
  if(!categories.has(key))categories.set(key,[])
  categories.get(key)!.push(g);footprintCount++
}
for(const [key,geometries] of categories){
  const merged=mergeGeometries(geometries)
  geometries.forEach(g=>g.dispose())
  if(!merged)continue
  const material=new THREE.MeshStandardMaterial({color:palette[key],roughness:.9,flatShading:true,transparent:true});material.userData.currentColor=material.color.clone()
  currentGroup.add(new THREE.Mesh(merged,material))
  if(key!=='background')currentGroup.add(new THREE.LineSegments(new THREE.EdgesGeometry(merged,35),new THREE.LineBasicMaterial({color:'#f8fbfc',transparent:true,opacity:.3})))
}
for(const site of data.sites)currentGroup.add(drapedLine([...site.p,site.p[0]],palette[site.id],2))
// Sparse DEM contours give topographic context without inventing retaining walls.
const contourPoints:number[]=[]
const t=data.terrain
for(let level=40;level<=240;level+=20)for(let j=0;j<t.rows-1;j++)for(let i=0;i<t.cols-1;i++){
  const corners=[[i,j],[i+1,j],[i+1,j+1],[i,j+1]],hits:number[][]=[]
  for(let k=0;k<4;k++){const [ax,az]=corners[k],[bx,bz]=corners[(k+1)%4],a=t.heights[az*t.cols+ax],b=t.heights[bz*t.cols+bx];if((a<level)===(b<level))continue;const f=(level-a)/(b-a);hits.push([t.min[0]+(t.max[0]-t.min[0])*(ax+(bx-ax)*f)/(t.cols-1),level+.5,t.min[1]+(t.max[1]-t.min[1])*(az+(bz-az)*f)/(t.rows-1)])}
  for(let k=0;k+1<hits.length;k+=2)if(!inMccPatch((hits[k][0]+hits[k+1][0])/2,(hits[k][2]+hits[k+1][2])/2))contourPoints.push(...hits[k],...hits[k+1])
}
terrainGroup.add(new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute(contourPoints,3)),new THREE.LineBasicMaterial({color:'#99ad97',transparent:true,opacity:.3})))
const requestedDate=/^(\d{4})-(\d{2})$/.exec(new URLSearchParams(location.search).get('date')??'2006-12')!
let timeIndex=clampMonth(monthIndex(Number(requestedDate?.[1]??2006),Number(requestedDate?.[2]??12))),year:Year=referenceEpoch(timeIndex),context=true,frame=0,playing=false,speed=6,carry=0,lastFrame=0,pendingUpdate=false,photoReference=false
let story:StoryScroll|undefined
document.querySelector('aside>small')!.textContent='연속 시간 탐험 · 자료는 이산 관측'
document.querySelector('aside nav')!.setAttribute('aria-label','관측 바로가기')
document.querySelector('aside nav')!.insertAdjacentHTML('beforebegin',`<section id="campus-epochs"><small>같은 카메라로 캠퍼스 비교</small><div>${restorationEpochs.map(y=>`<button data-campus-year="${y}" aria-label="${y}년 캠퍼스 비교">${y}</button>`).join('')}</div><p>실선 건물: 존재 근거 + 추정 입면<br/>연한 회색 배경: 2026 OSM 참조 · 과거 존재 미확인</p></section>`)
document.querySelectorAll<HTMLButtonElement>('[data-campus-year]').forEach(button=>button.onclick=()=>{const y=Number(button.dataset.campusYear);setTime(monthIndex(y,y===2026?10:12))})
document.querySelector<HTMLInputElement>('#context')!.checked=true
document.querySelector('aside nav')!.insertAdjacentHTML('beforebegin',`<section class="timeline" aria-label="시간 탐험"><div class="date-row"><output id="current-month"></output><input id="date-input" aria-label="연도와 월" type="month" min="1948-01" max="${monthLabel(MAX_MONTH).replace('.','-')}"/></div><input id="time-slider" aria-label="시간 슬라이더" type="range" min="${MIN_MONTH}" max="${MAX_MONTH}" step="1" value="${MAX_MONTH}"/><div class="timeline-marks" aria-hidden="true">${events.filter(e=>e.date.month).map(e=>`<i title="${dateLabel(e.date)} ${e.title}" style="left:${(eventMonth(e)-MIN_MONTH)/(MAX_MONTH-MIN_MONTH)*100}%"></i>`).join('')}</div><div class="playback"><button id="previous-event" aria-label="이전 사건">←</button><button id="play" aria-label="자동 재생" aria-pressed="false">재생</button><button id="next-event" aria-label="다음 사건">→</button><select id="play-speed" aria-label="재생 속도"><option value="1">1개월/초</option><option value="6" selected>6개월/초</option><option value="24">2년/초</option><option value="120">10년/초</option></select></div><p id="time-resolution"></p><div id="month-events"></div><label class="reference-option"><input id="photo-reference" type="checkbox"/> 이전 관측 형상 참조 <em>선택 월의 존재 증거 아님</em></label></section>`)
const slider=document.querySelector<HTMLInputElement>('#time-slider')!,dateInput=document.querySelector<HTMLInputElement>('#date-input')!
function setTime(value:number,pause=true,fromScroll=false){timeIndex=clampMonth(value);if(pause)setPlaying(false);pendingUpdate=true;if(!fromScroll)story?.sync(timeIndex)}
function setPlaying(value:boolean){playing=value;carry=0;document.querySelector('#play')!.setAttribute('aria-pressed',String(value));document.querySelector('#play')!.textContent=value?'일시정지':'재생'}
slider.oninput=()=>setTime(Number(slider.value))
dateInput.oninput=()=>{const match=/^(\d{4})-(\d{2})$/.exec(dateInput.value);if(match&&+match[2]>=1&&+match[2]<=12)setTime(monthIndex(+match[1],+match[2]))}
document.querySelector<HTMLButtonElement>('#play')!.onclick=()=>{if(!playing&&timeIndex===MAX_MONTH)setTime(Math.min(...events.filter(e=>e.date.month).map(eventMonth)));setPlaying(!playing)}
document.querySelector<HTMLSelectElement>('#play-speed')!.onchange=e=>{speed=Number((e.target as HTMLSelectElement).value);carry=0}
for(const [id,direction] of [['previous-event',-1],['next-event',1]] as const)document.querySelector<HTMLButtonElement>(`#${id}`)!.onclick=()=>{
  const values=[...new Set(events.filter(e=>e.date.month).map(eventMonth))].filter(m=>direction<0?m<timeIndex:m>timeIndex).sort((a,b)=>direction<0?b-a:a-b)
  if(values.length)setTime(values[0])
}
document.querySelector<HTMLInputElement>('#photo-reference')!.onchange=e=>{photoReference=(e.target as HTMLInputElement).checked;pendingUpdate=true}
document.addEventListener('visibilitychange',()=>{if(document.hidden)setPlaying(false)})
const historyFocus=document.createElement('select');historyFocus.id='history-focus';historyFocus.setAttribute('aria-label','공간 사용과 이전 기록')
document.querySelector('#notes')!.before(historyFocus)
const eventNote=document.createElement('p');eventNote.id='event-note';historyFocus.after(eventNote)
eventNote.insertAdjacentHTML('afterend','<section id="story-caption" aria-label="이 시기의 기록"></section>')
function clearGroup(group:THREE.Group){
  for(const child of group.children.slice()){group.remove(child);child.traverse(o=>{if(o instanceof THREE.Mesh||o instanceof THREE.Line){o.geometry.dispose();const materials=Array.isArray(o.material)?o.material:[o.material];materials.forEach(m=>m.dispose())}})}
}
const photoCache=new Map<number,THREE.Group>()
let historicalBuilds=0,shownPhoto:Epoch|null=null
function renderHistorical(){
  shownPhoto=photoMonth(timeIndex)??(timeIndex>=monthIndex(2016,10)&&timeIndex<monthIndex(2016,11)?2016:timeIndex>=monthIndex(2006,11)&&timeIndex<monthIndex(2016,10)?2006:timeIndex>=monthIndex(2001,9)&&timeIndex<monthIndex(2006,11)?2001:timeIndex>=monthIndex(1997,10)&&timeIndex<monthIndex(2001,9)?1997:photoReference?(timeIndex>monthIndex(2001,9)?2001:timeIndex>monthIndex(1985,10)?1985:null):null)
  historicalGroup.children.forEach(g=>g.visible=false)
  if(shownPhoto===null)return
  const existing=photoCache.get(shownPhoto)
  const setOpacity=(group:THREE.Group)=>{for(const child of group.children){const id=child.userData.featureId as string,evidence=featureEvidence(id,timeIndex),owned=['01-main','01-union','01-university-field','97-field','06-field','16-field','06-library-site'].includes(id);child.visible=(evidence!=='hidden'&&!owned)||photoReference;child.traverse(o=>{if(o instanceof THREE.Mesh||o instanceof THREE.Line){const m=o.material as THREE.Material;m.transparent=true;m.opacity=evidence==='observed'?1:evidence==='reference'?.65:.25;m.depthWrite=evidence==='observed'}})}}
  if(existing){existing.visible=true;setOpacity(existing);return}
  const photoGroup=new THREE.Group();historicalGroup.add(photoGroup);photoCache.set(shownPhoto,photoGroup);historicalBuilds++
  for(const feature of featuresFor(shownPhoto)){
    const group=new THREE.Group();group.userData.featureId=feature.id;photoGroup.add(group)
    // Integrated campus owns its ground and registered volumes; retain the original
    // trace cache for auditing, but do not draw duplicate slabs over detailed models.
    const ring=worldRing(feature),color=feature.kind==='roof'?'#bc884b':feature.id.includes('cleared')?'#b59b7e':feature.kind==='field'?'#9eac70':'#8c7060'
    if(feature.kind==='road'){group.add(drapedLine(ring,color,2));continue}
    if(feature.kind==='field'){
      // Dense triangles prevent a coarse polygon cutting through the DEM.
      const shape=new THREE.ShapeGeometry(new THREE.Shape(ring.map(([x,z])=>new THREE.Vector2(x,z)))).toNonIndexed(),points:number[]=[]
      const subdivide=(a:Point,b:Point,c:Point)=>{
        if(Math.max(Math.hypot(a[0]-b[0],a[1]-b[1]),Math.hypot(b[0]-c[0],b[1]-c[1]),Math.hypot(a[0]-c[0],a[1]-c[1]))>8){
          const ab:Point=[(a[0]+b[0])/2,(a[1]+b[1])/2],bc:Point=[(b[0]+c[0])/2,(b[1]+c[1])/2],ca:Point=[(c[0]+a[0])/2,(c[1]+a[1])/2]
          subdivide(a,ab,ca);subdivide(ab,b,bc);subdivide(ca,bc,c);subdivide(ab,bc,ca)
        }else for(const [x,z] of [a,b,c])points.push(x,heightAt(x,z)+1.5,z)
      }
      const p=shape.getAttribute('position')
      for(let i=0;i<p.count;i+=3)subdivide([p.getX(i),p.getY(i)],[p.getX(i+1),p.getY(i+1)],[p.getX(i+2),p.getY(i+2)])
      shape.dispose()
      const g=new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute(points,3));g.computeVertexNormals()
      group.add(new THREE.Mesh(g,new THREE.MeshStandardMaterial({color,roughness:1,side:THREE.DoubleSide})))
      group.add(drapedLine([...ring,ring[0]],'#79572f',2));continue
    }
    const g=new THREE.ExtrudeGeometry(new THREE.Shape(ring.map(([x,z])=>new THREE.Vector2(x,-z))),{depth:feature.kind==='roof'?3:.6,bevelEnabled:false,steps:1,curveSegments:1})
    g.rotateX(-Math.PI/2)
    const p=g.getAttribute('position'),base=Math.max(...ring.map(([x,z])=>heightAt(x,z)))
    for(let i=0;i<p.count;i++)p.setY(i,feature.kind==='roof'?(p.getY(i)<.01?heightAt(p.getX(i),p.getZ(i)):base+feature.displayHeight):heightAt(p.getX(i),p.getZ(i))+1.1)
    g.computeVertexNormals()
    group.add(new THREE.Mesh(g,new THREE.MeshStandardMaterial({color,roughness:1,side:THREE.DoubleSide})))
    group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([...ring,ring[0]].map(([x,z])=>new THREE.Vector3(x,base+feature.displayHeight+.05,z))),new THREE.LineBasicMaterial({color:'#79572f'})))
  }
  setOpacity(photoGroup)
}
historyFocus.onchange=()=>{
  const id=historyFocus.value,chosen=events.find(e=>e.id===id)
  if(chosen?.date.month&&eventMonth(chosen)!==timeIndex){setTime(eventMonth(chosen));update();pendingUpdate=false;historyFocus.value=id}
  showEvent(true)
}
function showEvent(travel=false){
  clearGroup(eventGroup)
  const selected=events.find(e=>e.id===historyFocus.value)
  eventNote.replaceChildren()
  if(selected){eventNote.append(`${dateLabel(selected.date)} · ${selected.note} `);const source=document.createElement('a');source.textContent='출처 ↗';source.href=selected.sourceUrl;source.target='_blank';source.rel='noopener';eventNote.append(source)}
  if(!selected)return
  if(selected.position&&travel)navigation.travel(selected.position,620)
  if(selected.buildingId){
    const b=data.buildings.find(b=>b.id===selected.buildingId)!
    const line=drapedLine([...b.p,b.p[0]],'#db7534',3)
    line.material.dispose();line.material=new THREE.LineDashedMaterial({color:'#db7534',dashSize:4,gapSize:4});line.computeLineDistances();eventGroup.add(line)
  }
  if(selected.from&&selected.position){
    const a=new THREE.Vector3(selected.from[0],heightAt(...selected.from)+8,selected.from[1]),b=new THREE.Vector3(selected.position[0],heightAt(...selected.position)+8,selected.position[1])
    const mid=a.clone().lerp(b,.5);mid.y+=110
    const curve=new THREE.QuadraticBezierCurve3(a,mid,b),points=curve.getPoints(50)
    eventGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color:'#bd6b37'})))
    eventGroup.add(new THREE.ArrowHelper(b.clone().sub(points[49]).normalize(),points[49],15,'#bd6b37',12,7))
  }
}
const labels:{element:HTMLElement;position:THREE.Vector3;leader:SVGPathElement}[]=[]
function addLabel(text:string,note:string,p:Point,color:string,source?:string,onClick?:()=>void){
  const element=document.createElement(onClick?'button':source?'a':'div');element.className='place';element.style.setProperty('--place',color)
  const title=document.createElement('b');title.textContent=text;element.append(title)
  const small=document.createElement('span');small.textContent=note;element.append(small)
  if(source&&!onClick){(element as HTMLAnchorElement).href=source;(element as HTMLAnchorElement).target='_blank';(element as HTMLAnchorElement).rel='noopener'}
  if(onClick)element.onclick=onClick
  const leader=document.createElementNS('http://www.w3.org/2000/svg','path');leader.setAttribute('stroke',color);leaders.append(leader)
  labelHost.append(element);labels.push({element,leader,position:new THREE.Vector3(p[0],heightAt(...p)+10,p[1])})
  const pin=new THREE.Mesh(new THREE.CylinderGeometry(1.5,1.5,30,6),new THREE.MeshBasicMaterial({color}));pin.position.set(p[0],heightAt(...p)+17,p[1]);markerGroup.add(pin)
}
let labelKey='',lastUpdatedMonth=-1
function update(){
  year=referenceEpoch(timeIndex)
  const current=isCurrent(timeIndex),monthEvents=eventsInMonth(timeIndex).filter(e=>!(e.dateKind==='catalog'&&events.some(other=>other.dateKind==='capture'&&other.date.year===e.date.year))),known=trackedBuildings.filter(b=>buildingKnown(b.id,timeIndex))
  const notes=yearNotes[year]
  renderHistorical();timeScene.update(timeIndex,false,current);mccScene.update(timeIndex);integratedCampus.update(timeIndex);campusSurfaces.update(timeIndex);oldGym.visible=gymScenarioAt(timeIndex)
  if(timeIndex!==lastUpdatedMonth){
    historyFocus.innerHTML='<option value="">공간 사용·이전·재개발 기록</option>'+events.map(e=>`<option value="${e.id}">${dateLabel(e.date)} ${e.title}</option>`).join('')
    historyFocus.value=monthEvents[0]?.id??'';showEvent();lastUpdatedMonth=timeIndex
  }
  document.querySelector<HTMLOutputElement>('#current-month')!.value=monthLabel(timeIndex)
  slider.value=String(timeIndex);slider.setAttribute('aria-valuetext',monthLabel(timeIndex));dateInput.value=monthLabel(timeIndex).replace('.','-')
  document.querySelectorAll<HTMLButtonElement>('[data-campus-year]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.campusYear)===splitMonth(timeIndex).year)))
  document.querySelector('#year-title')!.textContent=monthEvents[0]?.title??`${monthLabel(timeIndex)} · 존재 기록과 관측 참조`
  const resolution=current?'현재 OSM · MCC 레벨 추정':photoMonth(timeIndex)?'항공사진 국소 전사 + 준공 기록 참조':known.length?`준공 근거 건물 ${known.length}개 · 과거 외형 추정`:'해당 월 항공 형상 미확인 · 건물 부재를 뜻하지 않음'
  document.querySelector('#time-resolution')!.textContent=`${resolution}${shownPhoto?` · ${shownPhoto} 전사 레이어(정사보정 아님)`:''}${photoReference?' · 이전 관측 참조: 선택 월의 존재 증거 아님':''} · 월말 요약, 월 내 순서 미복원`
  document.querySelector('#notes')!.innerHTML=`<p>복원 GeoJSON의 건물 존재·층수와 현재 윤곽을 기존 지형에 연결했습니다. 건물 창·층 띠·지붕은 사진 참조 또는 추정 입면입니다. 운동장·주차선·수목·단차는 항공 전사와 시각적 추정을 구분해 표현합니다. 연한 회색 도시 배경은 2026 OSM 참조이며 해당 과거의 주택가 복원이 아닙니다.</p><div class="gym-evidence"><b>옛 실내체육관 · 사진 기반 추정</b><p>${oldGym.visible?'사용자 사진 3장에 보이는 흰 외벽·어두운 저층·4개 창 띠·평지붕을 모델링했습니다.':'이 시점에는 체육관 형상을 표시하지 않습니다. 2007~2009의 정확한 철거·공사 시기는 미확인입니다.'} 외관상 5층 구분, 높이 18~23m·배치 방향·2002/2006 존치는 추정입니다. 사진은 촬영일 미상이며 모델 전환이 실제 철거일을 뜻하지 않습니다.</p></div><p>MCC의 선큰 깊이·홀 경계·표고는 추정이며, 방목과 체육관은 서로 다른 외곽선입니다.</p><p><a href="${registerSource}" target="_blank" rel="noopener">준공·층수 근거 ↗</a> · <a href="${gymEvidence.sourceUrl}" target="_blank" rel="noopener">체육관 부지 교체 기록 ↗</a></p><details><summary>기존 ${year} 조사 기록</summary>${notes.paragraphs.map(p=>`<p>${p}</p>`).join('')}</details>`
  document.querySelector('#month-events')!.innerHTML=monthEvents.map(e=>`<button data-event="${e.id}">${dateLabel(e.date)} · ${e.title}</button>`).join('')
  const chapter=events.filter(e=>e.date.month&&eventMonth(e)<=timeIndex).sort((a,b)=>eventMonth(b)-eventMonth(a))[0]
  document.querySelector('#story-caption')!.innerHTML=chapter?`<small>가장 가까운 앞선 기록 · 존속 기간 아님</small><h3>${dateLabel(chapter.date)} · ${chapter.title}</h3><p>${chapter.note}</p><a href="${chapter.sourceUrl}" target="_blank" rel="noopener">기록 원문 ↗</a>`:'<p>이 시기 공간 형상은 미조사입니다. 비어 있는 지도는 건물 부재를 의미하지 않습니다.</p>'
  document.querySelectorAll<HTMLButtonElement>('[data-event]').forEach(b=>b.onclick=()=>{historyFocus.value=b.dataset.event!;showEvent(true)})
  document.querySelector('#sources')!.innerHTML='<b>관련 자료와 기존 조사 출처</b>'+monthEvents.map(e=>`<a href="${e.sourceUrl}" target="_blank" rel="noopener">${e.title} · 원자료 ↗</a>`).join('')+notes.sourceIds.map(id=>`<a href="${sources[id].url}" target="_blank" rel="noopener">${sources[id].title} ↗</a>`).join('')
  document.querySelectorAll<HTMLButtonElement>('[data-year]').forEach(b=>{const y=Number(b.dataset.year);b.setAttribute('aria-pressed',String(timeIndex===monthIndex(y,y===1985?10:y===2001?9:10)))})
  document.querySelector<HTMLElement>('#context-option')!.hidden=current
  document.querySelector('#map-state')!.textContent=`${monthLabel(timeIndex)} · ${resolution}${context&&!current?' · 연한 배경=2026 참조(과거 존재 미확인)':''}`
  currentGroup.visible=current||context
  currentGroup.traverse(o=>{
    if(o instanceof THREE.Mesh){const m=o.material as THREE.MeshStandardMaterial;m.transparent=false;m.opacity=1;m.depthWrite=true;if(m.userData.currentColor)m.color.copy(current?m.userData.currentColor:new THREE.Color('#e1e4df'))}
    else if(o instanceof THREE.Line){const m=o.material as THREE.Material;m.transparent=true;m.opacity=current?.3:.12;m.depthWrite=false}
  })
  const nextLabelKey=[current,oldGym.visible,photoMonth(timeIndex),shownPhoto,...known.map(b=>b.id),...monthEvents.map(e=>e.id),projectStage('namgajwa1',timeIndex),projectStage('hongeun2',timeIndex)].join(':')
  if(nextLabelKey===labelKey)return
  labelKey=nextLabelKey
  labels.splice(0);labelHost.replaceChildren();leaders.replaceChildren()
  markerGroup.children.slice().forEach(o=>{markerGroup.remove(o);if(o instanceof THREE.Mesh){o.geometry.dispose();(o.material as THREE.Material).dispose()}})
  if(current){for(const site of data.sites)addLabel(site.name,'현행 OSM · 높이 일부 추정',site.center as Point,palette[site.id],`https://www.openstreetmap.org/way/${site.osmId}`)}
  else {
    for(const b of known){const e=events.find(e=>e.id===b.eventId)!;if(e.position)addLabel(registered(b.id)?.name??e.title,'존재 근거 있음 · 과거 외형은 현 윤곽 추정',e.position,b.color,e.sourceUrl)}
    if(photoMonth(timeIndex))for(const marker of historicalMarkers[photoMonth(timeIndex)!])addLabel(marker.label,marker.note,project(marker.lon,marker.lat),'#ad7430',sources[marker.source].url)
  }
  if(oldGym.visible)addLabel('옛 실내체육관','사용자 사진 기반 · 배치/존치 시점 추정',gymEvidence.center,'#9d7656',gymEvidence.sourceUrl,()=>navigation.travel(gymEvidence.center,230))
  for(const e of monthEvents)if(e.position)addLabel(e.title,dateLabel(e.date),e.position,'#ca7537',e.sourceUrl,()=>{historyFocus.value=e.id;showEvent(true)})
  if(projectStage('namgajwa1',timeIndex)!=='unknown')addLabel('남가좌1 · 재건축 단계','주소 권역 기호 · 지구계/건물 복원 아님',[-620,195],'#b6803c',projectSources.namgajwa)
  if(projectStage('hongeun2',timeIndex)!=='unknown')addLabel('홍은2 · 현재 단지 범위 참조','선/격자 = 단계 참조 · 월별 공정률 아님',[-148,-377],'#699b8b',projectSources.hongeun2)
  addLabel('백련산','공개 DEM · 고도 배율 1×',project(126.9343,37.5886),'#6c8e69')
}
update()
story=new StoryScroll(journey,m=>setTime(m,true,true),()=>timeIndex);interactionMode()
document.querySelectorAll<HTMLButtonElement>('[data-year]').forEach(button=>button.onclick=()=>{const y=Number(button.dataset.year);setTime(monthIndex(y,y===1985?10:y===2001?9:10));update();pendingUpdate=false})
document.querySelector<HTMLInputElement>('#context')!.onchange=e=>{context=(e.target as HTMLInputElement).checked;update()}
document.querySelector<HTMLButtonElement>('#home')!.onclick=home
document.querySelector<HTMLButtonElement>('#top')!.onclick=()=>navigation.top()
const resize=()=>{const w=host.clientWidth,h=host.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix()}
const observer=new ResizeObserver(resize);observer.observe(host);resize()
const point=new THREE.Vector3()
renderer.setAnimationLoop((time)=>{
  const elapsed=lastFrame?(time-lastFrame)/1000:0;lastFrame=time
  if(playing){const next=advancePlayback(timeIndex,carry,elapsed,speed);carry=next.carry;if(next.value!==timeIndex){timeIndex=next.value;pendingUpdate=true;story?.sync(timeIndex)}if(next.ended)setPlaying(false)}
  if(pendingUpdate){update();pendingUpdate=false}
  timeScene.tick(time);mccScene.tick(time);integratedCampus.tick(time);navigation.tick();renderer.render(scene,camera);frame++
  const occupied:{x:number;y:number;w:number;h:number}[]=[]
  const tools=document.querySelector<HTMLElement>('.map-tools')!,topInset=Math.max(85,tools.offsetTop+tools.offsetHeight+12)
  for(const label of labels){
    point.copy(label.position).project(camera)
    const x=(point.x+1)*host.clientWidth/2,y=(1-point.y)*host.clientHeight/2,w=label.element.offsetWidth,h=label.element.offsetHeight
    let bx=x,by=y,best=Infinity
    for(const [dx,dy] of [[0,-24],[-120,-30],[120,-30],[-150,-95],[150,-95],[0,-150],[-190,-160],[190,-160],[0,65]]){
      const cx=Math.max(w/2+8,Math.min(host.clientWidth-w/2-8,x+dx)),cy=Math.max(topInset+h,Math.min(host.clientHeight-90,y+dy))
      let score=Math.hypot(cx-x,cy-y)*.01
      for(const b of occupied)score+=Math.max(0,(w+b.w)/2+8-Math.abs(cx-b.x))*Math.max(0,(h+b.h)/2+8-Math.abs(cy-h/2-b.y))
      if(score<best){best=score;bx=cx;by=cy}
    }
    const visible=point.z<1&&x>-40&&x<host.clientWidth+40&&y>0&&y<host.clientHeight
    label.element.style.transform=`translate(${Math.round(bx)}px,${Math.round(by)}px) translate(-50%,-100%)`
    label.element.style.visibility=visible?'visible':'hidden'
    label.leader.style.visibility=visible?'visible':'hidden';label.leader.setAttribute('d',`M${x},${y} L${bx},${by+2}`)
    occupied.push({x:bx,y:by-h/2,w,h})
  }
})
function studyState(){return{...splitMonth(timeIndex),timeIndex,playing,speed,exploring,mcc:mccScene.debug,...integratedCampus.debug(),...campusSurfaces.debug(),gymVisible:oldGym.visible,gymGeometry:oldGym.userData.footprint as Point[],gymPhotoDates:gymEvidence.photoDates,historicalBuilds,geometries:renderer.info.memory.geometries,cameraSettings:{...navigation.settings},...timeScene.debug(),buildingScales:{...timeScene.debug().buildingScales,...integratedCampus.debug().pipelineScales},frame,footprints:footprintCount,historicalFeatures:shownPhoto?photoCache.get(shownPhoto)!.children.filter(c=>c.visible).length:0,eventObjects:eventGroup.children.length,currentVisible:currentGroup.visible,calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,camera:camera.position.toArray(),target:controls.target.toArray(),terrainRange:[Math.min(...t.heights),Math.max(...t.heights)],labels:labels.map(l=>l.element.textContent??'')}}
declare global{interface Window{__GEO_STUDY__?:typeof studyState}}
window.__GEO_STUDY__=studyState
window.addEventListener('pagehide',()=>{renderer.setAnimationLoop(null);observer.disconnect();story?.dispose();navigation.dispose();scene.traverse(o=>{if(o instanceof THREE.Mesh||o instanceof THREE.Line){o.geometry.dispose();const m=Array.isArray(o.material)?o.material:[o.material];m.forEach(m=>m.dispose())}});renderer.dispose();delete window.__GEO_STUDY__},{once:true})
