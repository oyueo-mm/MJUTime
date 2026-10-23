import * as THREE from 'three'
import {mapData,heightAt} from './spatial'
import {registered,registerSource} from './campus-evidence'
import {events,dateLabel,trackedBuildings,type TimeEvent} from './timeline'
import {clusterChanges,recordKind} from './spatial-changes'
import type {OrbitControls} from 'three/addons/controls/OrbitControls.js'

const shown=(object:THREE.Object3D)=>{for(let p:THREE.Object3D|null=object;p;p=p.parent)if(!p.visible)return false;return true}
export class BuildingInteraction {
  readonly popup=document.createElement('section')
  private ray=new THREE.Raycaster()
  private pointer=new THREE.Vector2()
  private pending:{x:number;y:number}|null=null
  private down:{x:number;y:number}|null=null
  private dragged=false
  private pinned=false
  private last=0
  private cooling=0
  private cleanups:(()=>void)[]=[]
  private targets:THREE.Object3D[]=[]
  activeId:string|null=null
  constructor(private canvas:HTMLCanvasElement,private host:HTMLElement,private camera:THREE.Camera,roots:THREE.Object3D[],controls:OrbitControls){
    this.popup.id='building-popup';this.popup.hidden=true;this.popup.setAttribute('aria-label','건물 정보');host.append(this.popup)
    // Only building meshes, never roads, contours or expensive edge helpers.
    for(const root of roots)root.traverse(o=>{if(!(o instanceof THREE.Mesh))return;let identified=Boolean(o.userData.pickRanges);for(let p:THREE.Object3D|null=o;!identified&&p;p=p.parent)identified=Boolean(p.userData.buildingId??p.userData.id);if(identified)this.targets.push(o)})
    const on=(target:EventTarget,type:string,fn:EventListener)=>{target.addEventListener(type,fn);this.cleanups.push(()=>target.removeEventListener(type,fn))}
    on(canvas,'pointerdown',((e:PointerEvent)=>{this.down={x:e.clientX,y:e.clientY};this.dragged=false;this.close()}) as EventListener)
    on(canvas,'pointermove',((e:PointerEvent)=>{
      if(this.down){if(Math.hypot(e.clientX-this.down.x,e.clientY-this.down.y)>4)this.dragged=true;this.pending=null;this.close();return}
      if(e.pointerType!=='touch'&&!this.pinned)this.pending={x:e.clientX,y:e.clientY}
    }) as EventListener)
    on(canvas,'pointerup',((e:PointerEvent)=>{const tap=this.down&&!this.dragged&&e.button===0;this.down=null;this.pending=null;if(tap)this.pick(e.clientX,e.clientY,true)}) as EventListener)
    on(canvas,'pointercancel',()=>{this.down=null;this.pending=null;this.close()})
    on(canvas,'pointerleave',()=>{this.pending=null;if(!this.pinned)this.close()})
    const change=()=>{if(!this.pinned)this.close();this.cooling=performance.now()+120}
    controls.addEventListener('change',change);this.cleanups.push(()=>controls.removeEventListener('change',change))
  }
  close(){this.popup.hidden=true;this.pinned=false;this.activeId=null}
  tick(time:number){if(this.pending&&!this.down&&time-this.last>70&&performance.now()>this.cooling){this.last=time;this.pick(this.pending.x,this.pending.y,false);this.pending=null}}
  private pick(x:number,y:number,pin:boolean){
    const rect=this.canvas.getBoundingClientRect();this.pointer.set((x-rect.left)/rect.width*2-1,-(y-rect.top)/rect.height*2+1);this.ray.setFromCamera(this.pointer,this.camera)
    const hits=this.ray.intersectObjects(this.targets,false)
    let id:string|undefined
    for(const hit of hits){
      if(!shown(hit.object))continue
      const ranges=hit.object.userData.pickRanges as {id:string;end:number}[]|undefined
      if(ranges)id=ranges.find(r=>(hit.faceIndex??-1)<r.end)?.id
      for(let p:THREE.Object3D|null=hit.object;!id&&p;p=p.parent)id=p.userData.buildingId??p.userData.id
      if(id)break
    }
    if(!id){this.close();return}
    const b=mapData.buildings.find(b=>b.id===id),r=registered(id),tracked=trackedBuildings.find(b=>b.id===id),e=events.find(e=>e.buildingId===id&&e.category==='opening')??events.find(e=>e.id===tracked?.eventId)
    if(!b&&id!=='old-humanities-gym'){this.close();return}
    this.popup.replaceChildren();this.popup.hidden=false;this.pinned=pin;this.activeId=id;this.popup.classList.toggle('pinned',pin)
    const title=document.createElement('b');title.textContent=r?.name||b?.name||'이름 미등록 건물';this.popup.append(title)
    const line=(text:string)=>{const p=document.createElement('p');p.textContent=text;this.popup.append(p)}
    line(id==='1127358152'?'교육·연구 / 상업·복지 · 베리타스·코이노니아':id==='462990139'?'도서관 · 학술정보 / 열람·학습':b?.name?.includes('생활관')?'생활관':r?'교육·지원 시설':'현대 공간 참조 · 용도 미확인')
    line(r?`준공 ${r.completed.join('.')} · 개관/이전일과 별도`:e?.id==='college-move'?'준공 2001.08 · 본관/공학관 공식 기록 · 일 미확인':e?`개관 ${dateLabel(e.date)} · 준공일 미확인`:'준공 연도 미확인 · OSM 수집일은 준공일 아님')
    line(r?'현재 윤곽·높이/세부 입면 추정 · 과거 외장 미확인':'2026 OSM 참조 · 선택한 과거 시점의 존치 근거 아님')
    if(id==='462990139'||id==='1127358152')line('복원 B · 사진 근거, 치수·표고·구간 분할 추정')
    const source=document.createElement('a');source.textContent='출처 ↗';source.href=r?registerSource:e?.sourceUrl??`https://www.openstreetmap.org/way/${id}`;source.target='_blank';source.rel='noopener';this.popup.append(source)
    if(id==='462990139'||id==='1127358152'){const photo=document.createElement('a');photo.textContent=' · 외관 근거 ↗';photo.href=id==='462990139'?'https://klec.mju.ac.kr/images/gallery/4.jpg':'https://emc.mju.ac.kr/mjukr/9418/subview.do';photo.target='_blank';photo.rel='noopener';this.popup.append(photo)}
    if(pin){const close=document.createElement('button');close.textContent='닫기';close.onclick=()=>this.close();this.popup.append(close)}
    const hostRect=this.host.getBoundingClientRect();this.popup.style.left=`${Math.max(8,Math.min(rect.width-290,x-hostRect.left+14))}px`;this.popup.style.top=`${Math.max(135,Math.min(rect.height-this.popup.offsetHeight-60,y-hostRect.top+16))}px`
  }
  dispose(){this.cleanups.forEach(fn=>fn());this.targets=[];this.popup.remove()}
}

/** DOM billboards are projected from actual world positions, clustered before layout. */
export class ChangeMarkers {
  readonly root=document.createElement('div')
  private markers:{button:HTMLButtonElement;position:THREE.Vector3;events:TimeEvent[]}[]=[]
  private projected=new THREE.Vector3()
  readonly boxes:{x:number;y:number;w:number;h:number}[]=[]
  enabled=true
  constructor(private host:HTMLElement,private camera:THREE.Camera,private select:(event:TimeEvent)=>void){this.root.id='change-markers';host.append(this.root)}
  set(records:TimeEvent[]){
    this.root.replaceChildren();this.markers=[]
    for(const cluster of clusterChanges(records)){
      const first=cluster.events[0],p=first.position!,button=document.createElement('button');button.className='change-pin';button.dataset.change=first.id
      button.textContent=cluster.events.length>1?`! ${cluster.events.length}`:'!';button.setAttribute('aria-label',`${first.title}${cluster.events.length>1?` 외 ${cluster.events.length-1}건`:''}`)
      button.title=cluster.events.map(e=>`${dateLabel(e.date)} · ${e.title} · ${recordKind(e)}`).join('\n')
      button.onclick=()=>this.select(first);this.root.append(button)
      this.markers.push({button,position:new THREE.Vector3(p[0],heightAt(...p)+35,p[1]),events:cluster.events})
    }
  }
  tick(){
    this.boxes.length=0
    this.root.hidden=!this.enabled
    if(!this.enabled)return
    const occupied:{x:number;y:number}[]=[],w=this.host.clientWidth,h=this.host.clientHeight
    for(const marker of this.markers){
      const p=this.projected.copy(marker.position).project(this.camera),x=(p.x+1)*w/2,y=(1-p.y)*h/2
      const blocked=occupied.some(b=>Math.abs(b.x-x)<55&&Math.abs(b.y-y)<48)
      const visible=p.z>-1&&p.z<1&&x>22&&x<w-22&&y>140&&y<h-65&&!blocked
      marker.button.hidden=!visible;marker.button.style.transform=`translate(${Math.round(x)}px,${Math.round(y)}px) translate(-50%,-50%)`
      if(visible){occupied.push({x,y});this.boxes.push({x,y,w:60,h:52})}
    }
  }
  get ids(){return this.markers.flatMap(m=>m.events.map(e=>e.id))}
  dispose(){this.root.remove();this.markers=[]}
}
