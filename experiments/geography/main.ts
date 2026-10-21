import * as THREE from 'three'
import {Navigation} from './navigation'
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js'
import {mapData as data,heightAt,inRing,project,type Point} from './spatial'
import {historicalMarkers,yearNotes,sources,type Year} from './history'
import {featuresFor,worldRing} from './historical-geometry'
import './style.css'

document.querySelector('#map')!.innerHTML=`<header><div><small>MJUTime / GEOGRAPHIC STUDY · 실험 브랜치</small><h1>남가좌동에서 홍은동까지</h1><p>건물의 모양보다, 먼저 실제 공간.</p></div><span class="badge">공개 사이트와 분리된 시제품</span></header><main><div id="viewport" aria-label="남가좌동·홍은동 실제 좌표 3D 지도"><div id="labels"></div><div class="map-tools"><button id="home">사선 보기</button><button id="top">위에서 보기 · 북쪽 ↑</button></div><div class="map-caption"><b id="map-state"></b><span>드래그 회전 · 휠 확대 · 우클릭 이동</span></div></div><aside><small>세 시점의 비교</small><nav aria-label="비교 연도">${[1985,2001,2026].map(y=>`<button data-year="${y}" aria-pressed="${y===2026}">${y}</button>`).join('')}</nav><h2 id="year-title"></h2><div id="notes"></div><label id="context-option" hidden><input id="context" type="checkbox"/> 현재 건물·도로 겹쳐 비교 <em>과거 복원 아님</em></label><div class="source-list" id="sources"></div><div class="limits"><b>확인할 수 있는 것과 없는 것</b><p>윤곽은 OSM 관측값, 지형은 저해상도 DEM입니다. 건물 높이·옹벽·절토면·과거 골목은 정확히 복원하지 않았습니다.</p><p>1985·2001 항공영상의 위치·촬영시점 검증이 완료되지 않아 과거 건물은 표식만 제공합니다.</p></div></aside></main><footer><div class="key"><i style="--key:#3975cc"></i>명지대 <i style="--key:#199282"></i>전문대 <i style="--key:#d59539"></i>초등학교 <i style="--key:#8b69bb"></i>중학교 <i style="--key:#c96879"></i>고등학교</div><p>© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap contributors · ODbL</a> · 고도: <a href="https://registry.opendata.aws/terrain-tiles/" target="_blank" rel="noopener">Mapzen Terrain Tiles / USGS SRTM·GMTED</a><br/>고도 배율 1× · 실제 좌표, 높이 일부 추정 · 학교 경계는 현행 OSM 참조</p></footer>`
const host=document.querySelector<HTMLElement>('#viewport')!
document.querySelector('.limits p:last-child')!.textContent='과거 황토색은 항공사진 국소 전사입니다. 지붕 높이 3m는 표현용이며 정사보정되지 않았습니다. 현재 DEM을 사용하므로 당시 지반고가 아닙니다. 빈 곳은 미조사 영역입니다.'
const labelHost=document.querySelector<HTMLElement>('#labels')!
const leaders=document.createElementNS('http://www.w3.org/2000/svg','svg');leaders.id='leaders';host.append(leaders)
const renderer=new THREE.WebGLRenderer({antialias:true})
renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.setClearColor('#eef2f3')
renderer.outputColorSpace=THREE.SRGBColorSpace
host.prepend(renderer.domElement)
const scene=new THREE.Scene()
scene.add(new THREE.AmbientLight('#edf4ff',1.8))
const sun=new THREE.DirectionalLight('#fff5e4',2.5);sun.position.set(-700,1700,700);scene.add(sun)
const camera=new THREE.PerspectiveCamera(38,1,2,15000)
const terrainGroup=new THREE.Group(),currentGroup=new THREE.Group(),markerGroup=new THREE.Group()
const historicalGroup=new THREE.Group(),eventGroup=new THREE.Group()
scene.add(terrainGroup,currentGroup,markerGroup,historicalGroup,eventGroup)
const palette:Record<string,string>={university:'#3975cc',college:'#199282',elementary:'#d59539',middle:'#8b69bb',high:'#c96879',background:'#c3c4bc'}
function terrainMesh(){
  const t=data.terrain,positions:number[]=[],colors:number[]=[],indices:number[]=[]
  const lo=new THREE.Color('#dfe5da'),hi=new THREE.Color('#7b9e7e'),color=new THREE.Color()
  for(let j=0;j<t.rows;j++)for(let i=0;i<t.cols;i++){
    const h=t.heights[j*t.cols+i];positions.push(t.min[0]+(t.max[0]-t.min[0])*i/(t.cols-1),h,t.min[1]+(t.max[1]-t.min[1])*j/(t.rows-1))
    color.copy(lo).lerp(hi,Math.max(0,Math.min(1,(h-45)/190)));colors.push(color.r,color.g,color.b)
    if(i<t.cols-1&&j<t.rows-1){const a=j*t.cols+i;indices.push(a,a+t.cols,a+1,a+1,a+t.cols,a+t.cols+1)}
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.setIndex(indices);g.computeVertexNormals()
  terrainGroup.add(new THREE.Mesh(g,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,side:THREE.DoubleSide})))
}
terrainMesh()
host.insertAdjacentHTML('beforeend',`<div class="touch-flight" aria-label="터치 이동">${[['w','앞으로','↑'],['a','왼쪽으로','←'],['s','뒤로','↓'],['d','오른쪽으로','→'],['q','아래로','−'],['e','위로','＋']].map(([key,name,glyph])=>`<button data-move="${key}" aria-label="${name}">${glyph}</button>`).join('')}</div>`)
const navigation=new Navigation(camera,renderer.domElement,host,terrainGroup)
const controls=navigation.controls
const home=()=>navigation.home()
home()
document.querySelector('.map-tools')!.insertAdjacentHTML('beforeend',`<select id="school-jump" aria-label="학교로 이동"><option value="">학교로 이동</option>${data.sites.map(s=>`<option value="${s.id}">${s.name}</option>`).join('')}</select>`)
document.querySelector<HTMLSelectElement>('#school-jump')!.onchange=e=>{const s=data.sites.find(s=>s.id===(e.target as HTMLSelectElement).value);if(s)navigation.travel(s.center as Point);(e.target as HTMLSelectElement).value=''}
document.querySelector('.map-caption span')!.textContent='WASD 이동 · Q/E 높이 · 드래그 회전 · 우클릭 이동 · 휠 줌 · 더블클릭 이동'
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
      const corners=[[ax+ox,az+oz],[ax-ox,az-oz],[bx+ox,bz+oz],[bx-ox,bz-oz]]
      for(const index of [0,2,1,1,2,3]){const [x,z]=corners[index];roadPositions.push(x,heightAt(x,z)+.75,z);roadColors.push(color.r,color.g,color.b)}
    }
  })
}
const roads=new THREE.BufferGeometry();roads.setAttribute('position',new THREE.Float32BufferAttribute(roadPositions,3));roads.setAttribute('color',new THREE.Float32BufferAttribute(roadColors,3));roads.computeVertexNormals()
currentGroup.add(new THREE.Mesh(roads,new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.DoubleSide})))
const categories=new Map<string,THREE.BufferGeometry[]>()
let footprintCount=0
for(const b of data.buildings){
  if(b.p.length<3)continue
  const site=data.sites.find(s=>inRing(b.center,s.p))
  const key=site?.id??'background'
  const shape=new THREE.Shape(b.p.map(([x,z])=>new THREE.Vector2(x,-z)))
  const g=new THREE.ExtrudeGeometry(shape,{depth:b.height,bevelEnabled:false,steps:1,curveSegments:1})
  g.rotateX(-Math.PI/2)
  // Roof is horizontal; wall bottoms follow the sampled DEM rather than floating.
  // This corrects the seam, not surveyed terraces or retaining walls.
  const foundation=Math.max(heightAt(...b.center as Point),...b.p.map(([x,z])=>heightAt(x,z)))
  const positions=g.getAttribute('position')
  for(let i=0;i<positions.count;i++){const x=positions.getX(i),z=positions.getZ(i);positions.setY(i,positions.getY(i)<.01?heightAt(x,z)-.2:foundation+b.height)}
  g.computeVertexNormals()
  if(!categories.has(key))categories.set(key,[])
  categories.get(key)!.push(g);footprintCount++
}
for(const [key,geometries] of categories){
  const merged=mergeGeometries(geometries)
  geometries.forEach(g=>g.dispose())
  if(!merged)continue
  const material=new THREE.MeshStandardMaterial({color:palette[key],roughness:.9,flatShading:true,transparent:true})
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
  for(let k=0;k+1<hits.length;k+=2)contourPoints.push(...hits[k],...hits[k+1])
}
terrainGroup.add(new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute(contourPoints,3)),new THREE.LineBasicMaterial({color:'#99ad97',transparent:true,opacity:.3})))
let year:Year=2026,context=false,frame=0
const historyFocus=document.createElement('select');historyFocus.id='history-focus';historyFocus.setAttribute('aria-label','공간 사용과 이전 기록')
document.querySelector('#notes')!.before(historyFocus)
const eventNote=document.createElement('p');eventNote.id='event-note';historyFocus.after(eventNote)
const eventOptions:Record<Year,{id:string;title:string;note:string;target:Point;from?:Point;outline?:string}[]>={
  1985:[{id:'international',title:'국제대학 · 학생회관 사용',note:'명대신문의 1984년 이후 시기 기록입니다. 점선은 현재 학생회관 위치 참조이며 당시 외형·점유 경계가 아닙니다. 정확한 사용 종료일은 미확인입니다.',target:[-271.61,268.89],outline:'462990141'}],
  2001:[{id:'college-move',title:'2001.08 전문대 이전',note:'남가좌동 50-3 → 홍은3동 356-1. 선은 기관의 이전이며 통학 경로가 아닙니다. 출발점은 주소 권역 대표점으로 옛 경상관의 확정 좌표가 아닙니다.',target:[-150.13,-210.81],from:[-326.8,294.5]},
    {id:'elementary-move',title:'1997.06 초등학교 이전 이후',note:'공식 학교역사: 1997.06.09 홍은동 신축교사로 이전. 남가좌동 출발점은 주소 권역 대표점이며 학교 이전만으로 옛 교사 철거를 추론하지 않습니다.',target:[189.87,-57.65],from:[-326.8,294.5]}],
  2026:[{id:'mcc',title:'현재 MCC / 2001 운동장 비교',note:'MCC의 현재 OSM 윤곽을 확인했습니다. 2001 전사 운동장과 같은 권역에 위치합니다. 현재 윤곽의 역사적 완전 일치·지하 구조는 검증하지 않았습니다.',target:[-345.56,352.7],outline:'1127358152'}],
}
function clearGroup(group:THREE.Group){
  for(const child of group.children.slice()){group.remove(child);child.traverse(o=>{if(o instanceof THREE.Mesh||o instanceof THREE.Line){o.geometry.dispose();const materials=Array.isArray(o.material)?o.material:[o.material];materials.forEach(m=>m.dispose())}})}
}
function renderHistorical(){
  clearGroup(historicalGroup)
  for(const feature of featuresFor(year)){
    const ring=worldRing(feature),color=feature.kind==='roof'?'#bc884b':feature.kind==='field'?'#9eac70':'#8c7060'
    if(feature.kind==='road'){historicalGroup.add(drapedLine(ring,color,2));continue}
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
      historicalGroup.add(new THREE.Mesh(g,new THREE.MeshStandardMaterial({color,roughness:1,side:THREE.DoubleSide})))
      historicalGroup.add(drapedLine([...ring,ring[0]],'#79572f',2));continue
    }
    const g=new THREE.ExtrudeGeometry(new THREE.Shape(ring.map(([x,z])=>new THREE.Vector2(x,-z))),{depth:feature.kind==='roof'?3:.6,bevelEnabled:false,steps:1,curveSegments:1})
    g.rotateX(-Math.PI/2)
    const p=g.getAttribute('position'),base=Math.max(...ring.map(([x,z])=>heightAt(x,z)))
    for(let i=0;i<p.count;i++)p.setY(i,feature.kind==='roof'?(p.getY(i)<.01?heightAt(p.getX(i),p.getZ(i)):base+feature.displayHeight):heightAt(p.getX(i),p.getZ(i))+1.1)
    g.computeVertexNormals()
    historicalGroup.add(new THREE.Mesh(g,new THREE.MeshStandardMaterial({color,roughness:1,side:THREE.DoubleSide})))
    historicalGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([...ring,ring[0]].map(([x,z])=>new THREE.Vector3(x,base+feature.displayHeight+.05,z))),new THREE.LineBasicMaterial({color:'#79572f'})))
  }
}
historyFocus.onchange=()=>{
  clearGroup(eventGroup)
  const selected=eventOptions[year].find(e=>e.id===historyFocus.value)
  eventNote.textContent=selected?.note??''
  if(!selected)return
  navigation.travel(selected.target,620)
  if(selected.outline){
    const b=data.buildings.find(b=>b.id===selected.outline)!
    const line=drapedLine([...b.p,b.p[0]],'#db7534',3)
    line.material.dispose();line.material=new THREE.LineDashedMaterial({color:'#db7534',dashSize:4,gapSize:4});line.computeLineDistances();eventGroup.add(line)
  }
  if(selected.from){
    const a=new THREE.Vector3(selected.from[0],heightAt(...selected.from)+8,selected.from[1]),b=new THREE.Vector3(selected.target[0],heightAt(...selected.target)+8,selected.target[1])
    const mid=a.clone().lerp(b,.5);mid.y+=110
    const curve=new THREE.QuadraticBezierCurve3(a,mid,b),points=curve.getPoints(50)
    eventGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color:'#bd6b37'})))
    eventGroup.add(new THREE.ArrowHelper(b.clone().sub(points[49]).normalize(),points[49],15,'#bd6b37',12,7))
  }
}
const labels:{element:HTMLElement;position:THREE.Vector3;leader:SVGPathElement}[]=[]
function addLabel(text:string,note:string,p:Point,color:string,source?:string){
  const element=document.createElement(source?'a':'div');element.className='place';element.style.setProperty('--place',color)
  const title=document.createElement('b');title.textContent=text;element.append(title)
  const small=document.createElement('span');small.textContent=note;element.append(small)
  if(source){(element as HTMLAnchorElement).href=source;(element as HTMLAnchorElement).target='_blank';(element as HTMLAnchorElement).rel='noopener'}
  const leader=document.createElementNS('http://www.w3.org/2000/svg','path');leader.setAttribute('stroke',color);leaders.append(leader)
  labelHost.append(element);labels.push({element,leader,position:new THREE.Vector3(p[0],heightAt(...p)+10,p[1])})
  const pin=new THREE.Mesh(new THREE.CylinderGeometry(1.5,1.5,30,6),new THREE.MeshBasicMaterial({color}));pin.position.set(p[0],heightAt(...p)+17,p[1]);markerGroup.add(pin)
}
function update(){
  const notes=yearNotes[year]
  renderHistorical();clearGroup(eventGroup);eventNote.textContent=''
  historyFocus.innerHTML='<option value="">공간 사용·이전 기록으로 이동</option>'+eventOptions[year].map(e=>`<option value="${e.id}">${e.title}</option>`).join('')
  document.querySelector('#year-title')!.textContent=notes.title
  document.querySelector('#notes')!.innerHTML=notes.paragraphs.map(p=>`<p>${p}</p>`).join('')
  document.querySelector('#sources')!.innerHTML='<b>이 시점의 근거</b>'+notes.sourceIds.map(id=>`<a href="${sources[id].url}" target="_blank" rel="noopener">${sources[id].title} ↗</a>`).join('')
  document.querySelectorAll<HTMLButtonElement>('[data-year]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.year)===year)))
  document.querySelector<HTMLElement>('#context-option')!.hidden=year===2026
  document.querySelector('#map-state')!.textContent=year===2026?'2026 현재 비교 · OSM 윤곽 + 실제 DEM':`${year} 항공사진 국소 전사 · 높이 3m 표현용 · 현재 DEM${context?' · 현재 윤곽 비교 켜짐':''}`
  currentGroup.visible=year===2026||context
  currentGroup.traverse(o=>{if(o instanceof THREE.Mesh){const m=o.material as THREE.Material;m.transparent=true;m.opacity=year===2026?1:.16;m.depthWrite=year===2026}})
  labels.splice(0);labelHost.replaceChildren();leaders.replaceChildren()
  markerGroup.children.slice().forEach(o=>{markerGroup.remove(o);if(o instanceof THREE.Mesh){o.geometry.dispose();(o.material as THREE.Material).dispose()}})
  if(year===2026){for(const site of data.sites)addLabel(site.name,'현행 OSM · 높이 일부 추정',site.center as Point,palette[site.id],`https://www.openstreetmap.org/way/${site.osmId}`)}
  else for(const marker of historicalMarkers[year])addLabel(marker.label,marker.note,project(marker.lon,marker.lat),'#ad7430',sources[marker.source].url)
  addLabel('백련산','공개 DEM · 고도 배율 1×',project(126.9343,37.5886),'#6c8e69')
}
update()
document.querySelectorAll<HTMLButtonElement>('[data-year]').forEach(button=>button.onclick=()=>{year=Number(button.dataset.year) as Year;context=false;document.querySelector<HTMLInputElement>('#context')!.checked=false;update()})
document.querySelector<HTMLInputElement>('#context')!.onchange=e=>{context=(e.target as HTMLInputElement).checked;update()}
document.querySelector<HTMLButtonElement>('#home')!.onclick=home
document.querySelector<HTMLButtonElement>('#top')!.onclick=()=>navigation.top()
const resize=()=>{const w=host.clientWidth,h=host.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix()}
const observer=new ResizeObserver(resize);observer.observe(host);resize()
const point=new THREE.Vector3()
renderer.setAnimationLoop(()=>{
  navigation.tick();renderer.render(scene,camera);frame++
  const occupied:{x:number;y:number;w:number;h:number}[]=[]
  for(const label of labels){
    point.copy(label.position).project(camera)
    const x=(point.x+1)*host.clientWidth/2,y=(1-point.y)*host.clientHeight/2,w=label.element.offsetWidth,h=label.element.offsetHeight
    let bx=x,by=y,best=Infinity
    for(const [dx,dy] of [[0,-24],[-120,-30],[120,-30],[-150,-95],[150,-95],[0,-150],[-190,-160],[190,-160],[0,65]]){
      const cx=Math.max(w/2+8,Math.min(host.clientWidth-w/2-8,x+dx)),cy=Math.max(85+h,Math.min(host.clientHeight-90,y+dy))
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
declare global{interface Window{__GEO_STUDY__?:()=>{year:Year;frame:number;footprints:number;historicalFeatures:number;eventObjects:number;currentVisible:boolean;calls:number;triangles:number;camera:number[];target:number[];terrainRange:number[];labels:string[]}}}
window.__GEO_STUDY__=()=>({year,frame,footprints:footprintCount,historicalFeatures:featuresFor(year).length,eventObjects:eventGroup.children.length,currentVisible:currentGroup.visible,calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,camera:camera.position.toArray(),target:controls.target.toArray(),terrainRange:[Math.min(...t.heights),Math.max(...t.heights)],labels:labels.map(l=>l.element.textContent??'')})
window.addEventListener('pagehide',()=>{renderer.setAnimationLoop(null);observer.disconnect();navigation.dispose();scene.traverse(o=>{if(o instanceof THREE.Mesh||o instanceof THREE.Line){o.geometry.dispose();const m=Array.isArray(o.material)?o.material:[o.material];m.forEach(m=>m.dispose())}});renderer.dispose();delete window.__GEO_STUDY__},{once:true})
