import {MIN_MONTH,MAX_MONTH,clampMonth} from './timeline'
export type ScrollDirection='present-to-past'|'past-to-present'
export function monthAtProgress(progress:number,direction:ScrollDirection='present-to-past'){
  const p=Math.max(0,Math.min(1,progress))
  return clampMonth(MIN_MONTH+(MAX_MONTH-MIN_MONTH)*(direction==='present-to-past'?1-p:p))
}
export function progressAtMonth(month:number,direction:ScrollDirection='present-to-past'){
  const p=(clampMonth(month)-MIN_MONTH)/(MAX_MONTH-MIN_MONTH)
  return direction==='present-to-past'?1-p:p
}
/** Native document scrolling, one RAF subscription; no virtual wheel acceleration.
 * Date / playback -> scroll uses instant positioning, never accumulates animations.
 */
export class StoryScroll {
  direction:ScrollDirection='present-to-past'
  enabled=true
  private raf=0
  private expected:number|null=null
  private range=1
  private start=0
  constructor(readonly journey:HTMLElement,readonly onMonth:(month:number)=>void,readonly getMonth:()=>number){
    this.measure();window.addEventListener('scroll',this.onScroll,{passive:true});window.addEventListener('resize',this.onResize)
    this.sync(getMonth())
  }
  private measure(){
    const stage=this.journey.querySelector('main')!,header=document.querySelector('header')!
    this.start=this.journey.getBoundingClientRect().top+scrollY-header.getBoundingClientRect().height
    this.range=Math.max(1,this.journey.offsetHeight-stage.offsetHeight)
  }
  private onResize=()=>{this.measure();this.sync(this.getMonth())}
  private onScroll=()=>{
    if(this.raf)return
    this.raf=requestAnimationFrame(()=>{
      this.raf=0
      if(this.expected!==null&&Math.abs(scrollY-this.expected)<2){this.expected=null;return}
      this.expected=null
      if(!this.enabled)return
      const month=monthAtProgress((scrollY-this.start)/this.range,this.direction)
      if(month!==this.getMonth())this.onMonth(month)
    })
  }
  sync(month:number){
    const y=this.start+progressAtMonth(month,this.direction)*this.range
    if(Math.abs(scrollY-y)<1)return
    this.expected=y;window.scrollTo({top:y,behavior:'instant'})
  }
  dispose(){cancelAnimationFrame(this.raf);window.removeEventListener('scroll',this.onScroll);window.removeEventListener('resize',this.onResize)}
}
