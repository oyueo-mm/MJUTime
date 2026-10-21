import { test,expect } from '@playwright/test'
import { writeFile } from 'node:fs/promises'
import { buildings,CURRENT_YEAR } from '../src/data/history'

test('v0.2 placements, building inspection, confidence and unlabeled silhouettes',async({page},testInfo)=>{
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message))
  await page.goto('./')
  await expect(page.locator('canvas[data-webgl="ready"]')).toBeVisible()
  await expect.poll(()=>page.evaluate(()=>window.__MJUTIME_DEBUG__?.().frame??0)).toBeGreaterThan(5)
  const prefix=`test-results/v02-${testInfo.project.name}`
  await page.getByRole('button',{name:'건물 이름 표시',exact:true}).click()
  await page.screenshot({path:`${prefix}-humanities-no-labels.png`})
  await page.getByRole('button',{name:'건물 이름 표시',exact:true}).click()
  const initial=await page.evaluate(()=>window.__MJUTIME_DEBUG__?.())
  for(const b of buildings.filter(b=>b.campus==='humanities')){
    const model=initial?.buildings.find(model=>model.id===b.id)
    expect(model?.position[0]).toBeCloseTo(b.position[0],3)
    expect(model?.position[2]).toBeCloseTo(b.position[2],3)
    expect(model?.rotationY).toBeCloseTo(b.rotation,3)
    expect(model?.signature.length).toBe(1)
  }
  for(const id of ['library','mcc','dorm','chapel','science']){
    const b=buildings.find(b=>b.id===id)!
    await page.getByRole('button',{name:b.campus==='humanities'?'인문캠퍼스 서울':'자연캠퍼스 용인'}).click()
    await page.getByRole('button',{name:`${b.name} 건물 정보`,exact:true}).click()
    const dialog=page.getByRole('dialog',{name:`${b.name} 건물 정보`})
    await expect(dialog).toBeVisible()
    await expect(dialog.locator('.model-confidence')).toContainText(b.modelConfidence)
    await expect(page.getByTestId('current-year')).toHaveText(String(CURRENT_YEAR))
    // Let the camera settle before comparing the model's front-oblique silhouette.
    await page.waitForTimeout(1300)
    await page.addStyleTag({content:'.scene-annotations{opacity:0!important}'})
    await page.locator('.scene').screenshot({path:`${prefix}-${id}-front-oblique.png`})
    await page.addStyleTag({content:'.scene-annotations{opacity:1!important}'})
    await page.getByRole('button',{name:'사건 패널 닫기'}).click()
    await page.getByRole('button',{name:'기본 시점으로'}).click()
    await page.waitForTimeout(950)
  }
  await page.getByRole('button',{name:'건물 이름 표시',exact:true}).click()
  await page.screenshot({path:`${prefix}-nature-no-labels.png`})
  expect(errors).toEqual([])
})

test('v0.2 measured rendering telemetry',async({page},testInfo)=>{
  await page.goto('./')
  await expect(page.locator('canvas[data-webgl="ready"]')).toBeVisible()
  const results=[]
  for(const campus of ['humanities','nature']){
    await page.getByRole('button',{name:campus==='humanities'?'인문캠퍼스 서울':'자연캠퍼스 용인'}).click()
    await page.waitForTimeout(2000)
    const snapshot=await page.evaluate(()=>window.__MJUTIME_DEBUG__?.())
    const samples=(snapshot?.frameMs??[]).slice(-60).sort((a,b)=>a-b)
    const average=samples.reduce((a,b)=>a+b,0)/samples.length
    results.push({campus,profile:testInfo.project.name,viewport:page.viewportSize(),samples:samples.length,meanFps:1000/average,p95FrameMs:samples[Math.floor(samples.length*.95)],drawCalls:snapshot?.calls,triangles:snapshot?.triangles,geometries:snapshot?.geometries,firstFrameMs:snapshot?.firstFrameMs,renderer:snapshot?.renderer})
    // Sample the actual appearance animation without imposing a machine-specific FPS gate.
    await page.getByRole('slider').fill(campus==='humanities'?'2005':'2007')
    await page.getByRole('slider').fill(campus==='humanities'?'2006':'2008')
    await page.waitForTimeout(900)
    const animation=await page.evaluate(()=>window.__MJUTIME_DEBUG__?.().frameMs.slice(-30))
    results.push({campus,profile:testInfo.project.name,animationFrameMs:animation})
    await page.getByRole('slider').fill(String(CURRENT_YEAR))
  }
  await writeFile(`test-results/v02-${testInfo.project.name}-performance.json`,JSON.stringify(results,null,2))
  await testInfo.attach('rendering-telemetry',{body:JSON.stringify(results,null,2),contentType:'application/json'})
})
