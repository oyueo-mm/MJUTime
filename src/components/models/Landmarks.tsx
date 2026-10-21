import { useMemo } from 'react'
import type { Building, Vec3 } from '../../data/history'
import { Block, Cylinder, Mass, Repeated, Steps, curvedPlan, edgeParts, windowGrid, type Part, type PlanPoint } from './parts'

const ivory='#e1e1d6', roof='#b7beb2', glass='#6b969d'
// Curved contours are traced as simplified massing from the cited photos, not surveyed plans.
const libraryPlan=curvedPlan([[-3.8,-1.5],[-1.8,-2.05],[1.8,-1.7],[4,-.9],[4.1,1.3],[2.8,2],[.7,1.75],[-.4,1],[-1.5,.75],[-2.9,1.35],[-4,1]])
const libraryUpper=curvedPlan([[-3.8,-1.5],[-1.8,-2.05],[1.8,-1.7],[4,-.9],[4.1,1.3],[2.8,2],[.7,1.75],[-.4,1],[-1.2,.75],[-1.3,-.6],[-2.5,-.7],[-3.8,-.4]])

export function BangmokLibraryModel() {
  const fins=useMemo(()=>libraryUpper.flatMap(([x,z],i)=>{
    const next=libraryUpper[(i+1)%libraryUpper.length];const angle=-Math.atan2(next[1]-z,next[0]-x)
    return [0,.33,.66].map(f=>({p:[x+(next[0]-x)*f,2.5,z+(next[1]-z)*f] as Vec3,s:[.025,2.45,.07] as Vec3,r:angle}))
  }),[])
  const bridgePlan=useMemo(()=>curvedPlan([[-4.35,1.45],[-4.6,-.2],[-4.35,-1.9],[-2.7,-2.35],[-2.4,-1.75],[-3.7,-1.15],[-3.75,.75],[-.9,.75],[-.7,1.45]],32),[])
  return <group name="signature-library-open-ribbon">
    <Mass plan={libraryPlan} bottom={.07} height={1.15} color="#698c8c" />
    <Mass plan={libraryUpper} bottom={1.22} height={2.45} color="#95c2b6" />
    <Repeated parts={fins} color="#c8d6c1" />
    {[1.2,2.4,3.67].map(y=><Mass key={y} plan={y===1.2?libraryPlan:libraryUpper} bottom={y} height={.09} color="#dbe1d4" />)}
    <Mass plan={libraryUpper} bottom={3.76} height={.07} color="#a0b596" />
    <Block p={[-2.3,1.35,-1.3]} s={[2.8,2.65,1.3]} c="#a27b5a" />
    <Block p={[-1.5,3.85,-1]} s={[1.8,.23,1]} c="#b19473" />
    {/* Raised corner ribbon and a genuinely open terrace beneath it. */}
    <Mass plan={bridgePlan} bottom={3.5} height={.65} color="#8dbbb1" />
    <Cylinder p={[-4,2.05,.7]} radius={.13} height={3.9} color={ivory} />
    <Cylinder p={[-4.3,1.75,-1.2]} radius={.13} height={3.3} color={ivory} />
    <Block p={[-4.6,1.6,1.6]} s={[4.2,.2,1.1]} c="#9c8064" r={-.1} name="library-pedestrian-bridge" />
    <Repeated parts={[-1,1].map(side=>({p:[-4.6,1.95,1.6+side*.48],s:[4.2,.55,.04],r:-.1}))} color="#b7c7c0" />
    <Repeated parts={edgeParts(libraryPlan,.6,1.1,.035).filter((_,i)=>i%2===0)} color="#52777c" />
    <Block p={[0,.05,2.9]} s={[7.3,.09,1.8]} c="#dddbcf" />
    <Steps width={2.3} count={3} rise={.08} run={.18} z={3.8} />
  </group>
}

export function MCCModel() {
  const fins=useMemo(()=>[-1,1].flatMap(side=>Array.from({length:22},(_,i)=>({p:[1.6+(i-10.5)*.37,side===1?1.95:.58,side===1?3.75:4],s:[.105,side===1?1.25:.85,.19]} as Part))),[])
  return <group name="signature-mcc-sunken-stair-terraces">
    <Block p={[-5.1,1.72,-.4]} s={[4.1,3.44,7]} c="#bfc2ba" />
    <Block p={[-5.1,3.5,-.4]} s={[4.45,.18,7.3]} c={ivory} />
    <Block p={[-5.1,3.61,-.4]} s={[3.9,.06,6.7]} c="#8dac75" />
    <Block p={[-5.1,3.93,-1.7]} s={[2.8,.6,2.4]} c={ivory} />
    <Block p={[2,1.4,.1]} s={[9.1,2.8,7.3]} c="#637e7b" />
    {[.05,1.25,2.85].map(y=><Block key={y} p={[2,y,.35]} s={[9.5,.18,7.8]} c="#d5d4c8" />)}
    <Block p={[2,2.98,.1]} s={[9.1,.08,7.2]} c="#9eb580" name="mcc-roof-field" />
    <Repeated parts={fins} color="#c2c5b8" />
    <Repeated parts={windowGrid(3.6,4,7,.38,.8,7,.3,.57).map(part=>({...part,p:[part.p[0]-5.1,part.p[1],part.p[2]-.4]}))} color={glass} />
    <Block p={[1.9,.96,4.05]} s={[9.9,.15,1.7]} c={ivory} />
    <Block p={[1.9,1.08,4.05]} s={[9.4,.035,1.3]} c="#98ae80" />
    <group position={[-1.65,0,0]}><Steps width={2.4} count={19} rise={.16} run={.35} z={5.3} /></group>
    <Block p={[-2.98,1.5,1.9]} s={[.13,3,7]} c="#d8d9cc" />
    <Repeated parts={[{p:[2,3.05,-2.2],s:[7,.025,.07]},{p:[2,3.05,2.4],s:[7,.025,.07]},{p:[-1.5,3.05,.1],s:[.07,.025,4.6]},{p:[5.5,3.05,.1],s:[.07,.025,4.6]}]} color="#dfe7ce" />
    <Block p={[0,.035,6.1]} s={[16,.07,2.2]} c="#dfdbcd" />
    <Repeated parts={[-6,-3,1,4,6].map(x=>({p:[x,.15,6.2],s:[1.4,.22,.35]}))} color="#b6a285" />
  </group>
}

const dormFront:PlanPoint[]=Array.from({length:27},(_,i)=>{const x=-4.4+i*8.8/26;return[x,1.4*(1-(x/4.4)**2)+.85]})
const dormPlan:PlanPoint[]=[...dormFront,...dormFront.map(([x,z])=>[x,z-2.15] as PlanPoint).reverse()]
export function HumanitiesDormitoryModel() {
  const windows=useMemo(()=>[-1,1].flatMap(side=>Array.from({length:7*17},(_,i)=>{
    const x=-4.15+(i%17)*8.3/16;const z=1.4*(1-(x/4.4)**2)+.85-(side===-1?2.15:0)
    return {p:[x,.65+Math.floor(i/17)*.72,z+side*.035] as Vec3,s:[.34,.43,.04] as Vec3,r:Math.atan(-2.8*x/(4.4**2))}
  })),[])
  return <group name="signature-dorm-concave-brick-band">
    <Mass plan={dormPlan} bottom={0} height={.8} color="#c7cbc5" />
    <Mass plan={dormPlan} bottom={.8} height={4.25} color="#b77e67" />
    <Mass plan={dormPlan} bottom={5.05} height={.65} color="#e5e7df" />
    <Mass plan={dormPlan} bottom={5.7} height={.12} color="#cdd5cb" />
    <Repeated parts={windows} color="#93b1ba" />
    <Block p={[-.9,2.65,2.18]} s={[.72,4.7,.09]} c="#64888e" />
    <Block p={[-.9,.5,2.27]} s={[.9,.95,.12]} c="#536f75" />
    <Block p={[-.9,.95,2.4]} s={[1.25,.1,.8]} c={ivory} />
    <Block p={[-1.1,5.98,-.5]} s={[1,.35,.8]} c="#c3c6bc" />
  </group>
}

export function Chapel60Model() {
  return <group name="signature-chapel-white-drum">
    <Cylinder p={[0,2,-.65]} radius={2.65} height={4} color="#e5e4dc" scale={[1,1,.85]} />
    {[.95,1.95,2.95,4.05].map(y=><Cylinder key={y} p={[0,y,-.65]} radius={2.68} height={.045} color="#c1c6c1" scale={[1,1,.85]} />)}
    <Cylinder p={[0,4.12,-.65]} radius={2.59} height={.08} color="#c2c7be" scale={[1,1,.85]} />
    <Block p={[2.1,1.6,-.5]} s={[1.8,3.2,3.4]} c="#e8e6dd" />
    <Block p={[0,.85,2.05]} s={[4.7,1.7,2.1]} c="#8ca4a0" />
    <Block p={[0,1.74,2.05]} s={[5.2,.17,2.5]} c={ivory} />
    <Repeated parts={Array.from({length:11},(_,i)=>({p:[(i-5)*.43,.9,3.13],s:[.07,1.55,.12]}))} color="#d5d9d0" />
    <Block p={[0,.92,3.65]} s={[5.6,.14,1]} c="#deddd1" />
    <Steps width={5.4} count={10} rise={.1} run={.22} z={6} />
    <Block p={[0,.025,6.5]} s={[7,.05,1.3]} c="#d9d6c9" />
    <Repeated parts={[-1,1].map(side=>({p:[side*2.7,1.1,4.55],s:[.045,.5,2.8]}))} color="#9baaa6" />
  </group>
}

export function NextGenerationScienceModel() {
  const windows=useMemo(()=>windowGrid(7,7,13,.48,.77,3.2,.34,.43),[])
  return <group name="signature-science-seven-storey-lab-slab">
    <Block p={[-.45,2.85,0]} s={[6.5,5.7,3.2]} c="#e1e1d5" />
    <Block p={[3.15,2.7,-.35]} s={[1.15,5.4,2.5]} c="#c4cec7" />
    <Repeated parts={windows} color="#72949b" />
    <Block p={[-2.55,2.95,1.64]} s={[.64,5.1,.055]} c="#5c7d87" />
    <Repeated parts={Array.from({length:7},(_,i)=>({p:[-.35,.18+i*.78,1.68],s:[7.2,.075,.12]}))} color="#c3cbc4" />
    <Block p={[-.4,5.85,0]} s={[7.5,.18,3.55]} c="#b3c4b6" />
    <Block p={[-.4,5.97,0]} s={[6.95,.06,3.05]} c="#83a293" />
    <Block p={[-2.1,6.12,-.35]} s={[1.5,.32,1.25]} c="#c3c6be" />
    <Block p={[.5,.65,1.67]} s={[1.6,1.2,.12]} c="#64858c" />
    <Block p={[.5,1.3,2]} s={[2.3,.13,1.1]} c={ivory} />
    <Steps width={2.3} count={4} rise={.08} run={.19} z={2.7} />
  </group>
}

export function ContextBuildingModel({ building }: { building: Building }) {
  const [w,h,d]=building.dimensions
  const kind=building.modelType
  const floors=building.floors ?? (kind==='student'?6:kind==='international'?8:4)
  const windows=useMemo(()=>windowGrid(w-.15,floors,Math.max(4,Math.round(w*1.7)),.42,(h-.65)/floors,d,.31,Math.min(.45,(h-.65)/floors*.67)),[w,h,d,floors])
  const adminPlan=useMemo(()=>curvedPlan([[-w/2,-d/2],[w/2,-d/2],[w/2,d*.3],[w*.2,d*.65],[-w*.3,d*.55],[-w/2,0]],22),[w,d])
  return <group name={`signature-context-${kind}`}>
    {kind==='administration'?<><Mass plan={adminPlan} bottom={0} height={h} color="#9bb7b3" /><Repeated parts={edgeParts(adminPlan,h/2,h,.06).filter((_,i)=>i%2===0)} color={ivory} />{[.7,1.4,2.1,2.8].map(y=><Mass key={y} plan={adminPlan} bottom={y} height={.07} color={ivory} />)}</>:<>
      <Block p={[0,h/2,0]} s={[w,h,d]} c={kind==='main'?'#bdbfae':kind==='concept'?'#d0c8b8':ivory} />
      <Repeated parts={windows} color={kind==='main'?'#607f8e':'#78999d'} />
      {kind==='main'&&<><Repeated parts={[-1,1].map(side=>({p:[side*(w/2-.2),h/2,0],s:[.45,h+.15,d+.12]}))} color="#e9e7db" /><Repeated parts={Array.from({length:10},(_,i)=>({p:[0,.5+i*.74,d/2+.08],s:[w,.11,.16]}))} color="#d6d6c7" /></>}
      {kind==='international'&&<Block p={[0,h/2,d/2+.08]} s={[.5,h,.13]} c="#aebdbd" />}
      {kind==='mirae'&&<Block p={[0,h-.45,0]} s={[w+.08,.9,d+.1]} c="#7d8586" />}
    </>}
    <Block p={[0,h+.1,0]} s={[w+.18,.18,d+.18]} c={roof} />
    <Block p={[0,h+.22,0]} s={[w*.62,.16,d*.62]} c="#bcc3b9" />
  </group>
}

export function LandmarkModel({ building }: { building: Building }) {
  switch(building.modelType) {
    case 'library':return <BangmokLibraryModel />
    case 'mcc':return <MCCModel />
    case 'dorm':return <HumanitiesDormitoryModel />
    case 'chapel':return <Chapel60Model />
    case 'science':return <NextGenerationScienceModel />
    default:return <ContextBuildingModel building={building} />
  }
}
