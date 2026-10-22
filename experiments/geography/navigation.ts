import * as THREE from 'three'
import {OrbitControls} from 'three/addons/controls/OrbitControls.js'
import {heightAt,mapData,type Point} from './spatial'
import {defaults,sanitizeSettings,movementSpeed,type CameraSettings} from './camera-settings'

/** One orbit target shared by mouse, keyboard, touch and animated travel. */
export class Navigation {
  readonly controls:OrbitControls
  settings:CameraSettings={...defaults}
  private keys=new Set<string>()
  private destination:{eye:THREE.Vector3;target:THREE.Vector3}|null=null
  private forward=new THREE.Vector3()
  private right=new THREE.Vector3()
  private movement=new THREE.Vector3()
  private clock=new THREE.Clock()
  private raycaster=new THREE.Raycaster()
  private disposeListeners:(()=>void)[]=[]
  constructor(readonly camera:THREE.PerspectiveCamera,readonly canvas:HTMLCanvasElement,readonly host:HTMLElement,readonly ground:THREE.Object3D){
    this.controls=new OrbitControls(camera,canvas)
    Object.assign(this.controls,{enableDamping:true,dampingFactor:.12,screenSpacePanning:false,minDistance:12,maxDistance:6500,maxPolarAngle:Math.PI*.495})
    this.controls.touches.ONE=THREE.TOUCH.ROTATE;this.controls.touches.TWO=THREE.TOUCH.DOLLY_PAN
    try{this.settings=sanitizeSettings(JSON.parse(localStorage.getItem('mjutime-geo-camera')??'{}'))}catch{/* Defaults if storage is blocked or malformed. */}
    this.setSettings(this.settings)
    host.tabIndex=0;host.setAttribute('aria-label','3D 지도 탐험 · WASD 이동, Q E 높이 조절')
    const on=<K extends keyof WindowEventMap>(target:EventTarget,type:K,handler:(event:WindowEventMap[K])=>void)=>{
      target.addEventListener(type,handler as EventListener);this.disposeListeners.push(()=>target.removeEventListener(type,handler as EventListener))
    }
    on(window,'keydown',e=>{
      if(!host.contains(document.activeElement)||/INPUT|SELECT|TEXTAREA|BUTTON/.test(document.activeElement?.tagName??''))return
      const key=e.key.toLowerCase()
      if(['w','a','s','d','q','e','shift','alt'].includes(key)){e.preventDefault();this.keys.add(key);this.destination=null}
    })
    on(window,'keyup',e=>this.keys.delete(e.key.toLowerCase()))
    on(window,'blur',()=>this.keys.clear())
    const visibility=()=>this.keys.clear()
    document.addEventListener('visibilitychange',visibility)
    this.disposeListeners.push(()=>document.removeEventListener('visibilitychange',visibility))
    on(canvas,'pointerdown',()=>{host.focus({preventScroll:true});this.destination=null})
    this.controls.addEventListener('start',()=>{this.destination=null})
    on(canvas,'dblclick',e=>{
      const rect=canvas.getBoundingClientRect()
      this.raycaster.setFromCamera(new THREE.Vector2((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1),camera)
      const hit=this.raycaster.intersectObject(ground,true)[0]
      if(hit)this.travel([hit.point.x,hit.point.z],Math.min(500,camera.position.distanceTo(this.controls.target)))
    })
    host.querySelectorAll<HTMLButtonElement>('[data-move]').forEach(button=>{
      const key=button.dataset.move!
      const stop=()=>this.keys.delete(key)
      button.addEventListener('pointerdown',e=>{e.preventDefault();button.setPointerCapture(e.pointerId);this.keys.add(key);this.destination=null})
      button.addEventListener('pointerup',stop);button.addEventListener('pointercancel',stop);button.addEventListener('lostpointercapture',stop)
    })
  }
  setSettings(patch:Partial<CameraSettings>){
    this.settings=sanitizeSettings({...this.settings,...patch})
    this.controls.rotateSpeed=this.settings.rotate;this.controls.panSpeed=this.settings.pan;this.controls.zoomSpeed=this.settings.zoom
    try{localStorage.setItem('mjutime-geo-camera',JSON.stringify(this.settings))}catch{/* Storage is optional. */}
  }
  home(){this.keys.clear();this.destination=null;this.camera.position.set(1600,1750,2050);this.controls.target.set(0,65,-40);this.controls.update()}
  campus(){this.keys.clear();this.destination=null;const scale=this.host.clientWidth<760?1.45:1;this.controls.target.set(-305,43,275);this.camera.position.set(-305+270*scale,43+222*scale,275+340*scale);this.controls.update()}
  top(){this.keys.clear();this.destination=null;this.camera.position.set(0,3000,-1);this.controls.target.set(0,0,0);this.controls.update()}
  travel([x,z]:Point,distance=420){
    this.keys.clear()
    const target=new THREE.Vector3(x,heightAt(x,z)+8,z)
    const offset=new THREE.Vector3(.8,.85,1).normalize().multiplyScalar(Math.max(100,distance))
    this.destination={target,eye:target.clone().add(offset)}
  }
  tick(){
    const dt=Math.min(this.clock.getDelta(),.05)
    if(this.destination){
      const alpha=1-Math.exp(-6*dt)
      this.camera.position.lerp(this.destination.eye,alpha);this.controls.target.lerp(this.destination.target,alpha)
      if(this.camera.position.distanceTo(this.destination.eye)<.1)this.destination=null
    }
    this.forward.subVectors(this.controls.target,this.camera.position).setY(0).normalize()
    if(this.forward.lengthSq()<.001)this.forward.set(0,0,-1)
    this.right.crossVectors(this.forward,THREE.Object3D.DEFAULT_UP).normalize()
    this.movement.set(0,0,0)
    for(const key of this.keys){
      if(key==='w')this.movement.add(this.forward);if(key==='s')this.movement.sub(this.forward)
      if(key==='d')this.movement.add(this.right);if(key==='a')this.movement.sub(this.right)
      if(key==='e')this.movement.y+=1;if(key==='q')this.movement.y-=1
    }
    if(this.movement.lengthSq()){
      const speed=movementSpeed(this.camera.position.distanceTo(this.controls.target),this.settings.move,this.keys.has('shift'),this.keys.has('alt'))
      this.movement.normalize().multiplyScalar(speed*dt);this.camera.position.add(this.movement);this.controls.target.add(this.movement)
    }
    this.controls.update()
    const t=mapData.terrain
    const x=THREE.MathUtils.clamp(this.camera.position.x,t.min[0]-1500,t.max[0]+1500),z=THREE.MathUtils.clamp(this.camera.position.z,t.min[1]-1500,t.max[1]+1500)
    const floor=heightAt(x,z)+4,y=THREE.MathUtils.clamp(this.camera.position.y,floor,4200)
    this.movement.set(x-this.camera.position.x,y-this.camera.position.y,z-this.camera.position.z)
    this.camera.position.add(this.movement);this.controls.target.add(this.movement)
  }
  dispose(){this.keys.clear();this.disposeListeners.forEach(dispose=>dispose());this.controls.dispose()}
}
