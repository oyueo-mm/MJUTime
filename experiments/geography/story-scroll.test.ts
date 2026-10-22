import {it,expect} from 'vitest'
import {monthAtProgress,progressAtMonth} from './story-scroll'
import {MIN_MONTH,MAX_MONTH,monthIndex} from './timeline'
import {MccScene,mccGround,mccLevels} from './mcc'
import {heightAt} from './spatial'
import * as THREE from 'three'
it('maps every month bidirectionally, with current to past as the downward default',()=>{
  expect(monthAtProgress(0)).toBe(MAX_MONTH);expect(monthAtProgress(1)).toBe(MIN_MONTH)
  expect(monthAtProgress(-1)).toBe(MAX_MONTH);expect(monthAtProgress(2)).toBe(MIN_MONTH)
  for(const direction of ['present-to-past','past-to-present'] as const)
    for(let m=MIN_MONTH;m<=MAX_MONTH;m++)expect(monthAtProgress(progressAtMonth(m,direction),direction)).toBe(m)
})
it('reuses MCC and terrain buffers; applies B2/2F as a documented count, not surveyed heights',()=>{
  const scene=new MccScene(),geometry=scene.patch.geometry,position=geometry.getAttribute('position'),objects=scene.group.children.length
  expect(objects).toBeGreaterThan(3);expect(mccLevels.below).toBe(2);expect(mccLevels.above).toBe(2)
  scene.update(monthIndex(2020,12));expect(scene.debug.active).toBe(false)
  expect(mccGround(-360,400,false)).toBe(heightAt(-360,400))
  scene.update(monthIndex(2021,8));expect(scene.debug.active).toBe(true)
  expect(mccGround(-360,400,true)).toBeLessThan(mccLevels.lower)
  for(let n=0;n<30;n++)scene.update(monthIndex(n%2?2026:2000,1))
  expect(scene.patch.geometry).toBe(geometry);expect(geometry.getAttribute('position')).toBe(position);expect(scene.group.children).toHaveLength(objects)
  for(const group of [scene.group,scene.patch])group.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();(o.material as THREE.Material).dispose()}})
})
