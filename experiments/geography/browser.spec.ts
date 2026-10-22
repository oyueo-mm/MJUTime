import {test,expect} from '@playwright/test'
import {writeFile} from 'node:fs/promises'
test('geographic rendering, navigation, dated evidence and mobile regression',async({page},info)=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message))
  await page.goto('http://127.0.0.1:4188/MJUTime/geography.html')
  await expect.poll(()=>page.evaluate(()=>window.__GEO_STUDY__?.().frame??0)).toBeGreaterThan(5)
  const initial=await page.evaluate(()=>window.__GEO_STUDY__!())
  await page.locator('#explore').click()
  expect(initial.footprints).toBe(2667);expect(initial.currentVisible).toBe(true)
  expect(initial.calls).toBeGreaterThan(5);expect(initial.triangles).toBeGreaterThan(50000)
  for(const name of ['명지대학교 인문캠퍼스','명지전문대학','명지초등학교','명지중학교','명지고등학교'])await expect(page.locator('.place b',{hasText:name})).toBeVisible()
  await page.screenshot({path:`experiments/geography/screenshots/${info.project.name}-2026.png`,fullPage:false})
  if(info.project.name==='desktop'){
    await page.mouse.move(400,410);await page.mouse.down();await page.mouse.move(530,450,{steps:12});await page.mouse.up()
  }else{
    const session=await page.context().newCDPSession(page)
    await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:80,y:460,id:0}]})
    for(let i=1;i<9;i++)await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:80+i*12,y:460+i*2,id:0}]})
    await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await session.detach()
  }
  await expect.poll(()=>page.evaluate(()=>window.__GEO_STUDY__!().camera)).not.toEqual(initial.camera)
  await page.getByRole('button',{name:'사선 보기',exact:true}).click()
  for(const year of [1985,2001]){
    await page.getByRole('button',{name:String(year),exact:true}).click()
    expect(await page.evaluate(()=>window.__GEO_STUDY__!().currentVisible)).toBe(false)
    await expect(page.locator('#map-state')).toContainText('항공사진 국소 전사')
    expect(await page.evaluate(()=>window.__GEO_STUDY__!().historicalFeatures)).toBe(year===1985?4:8)
    await page.screenshot({path:`experiments/geography/screenshots/${info.project.name}-${year}.png`,fullPage:false})
    const context=page.getByRole('checkbox',{name:/현재 건물/});await context.check()
    expect(await page.evaluate(()=>window.__GEO_STUDY__!().currentVisible)).toBe(true)
    await context.uncheck()
  }
  await page.getByRole('button',{name:'2026',exact:true}).click()
  await page.getByRole('button',{name:'위에서 보기 · 북쪽 ↑'}).click()
  await page.waitForTimeout(300)
  await page.screenshot({path:`experiments/geography/screenshots/${info.project.name}-2026-top.png`,fullPage:false})
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
  expect(errors).toEqual([])
})

test('free travel, occupancy, relocation, rapid dates and performance sample',async({page},info)=>{
  test.setTimeout(90000)
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message))
  await page.goto('http://127.0.0.1:4188/MJUTime/geography.html')
  await expect.poll(()=>page.evaluate(()=>window.__GEO_STUDY__?.().frame??0)).toBeGreaterThan(5)
  await page.locator('#explore').click()
  const state=()=>page.evaluate(()=>window.__GEO_STUDY__!())
  await page.locator('#school-jump').selectOption('college')
  await expect.poll(async()=>Math.abs((await state()).target[0]+94.52),{timeout:12000}).toBeLessThan(3)
  expect((await state()).year).toBe(2026)
  const before=await state()
  if(info.project.name==='desktop'){
    await page.locator('#viewport').focus()
    await page.keyboard.down('w');await page.waitForTimeout(450);await page.keyboard.up('w')
    expect((await state()).target).not.toEqual(before.target)
    const y=(await state()).camera[1]
    await page.keyboard.down('e');await page.waitForTimeout(350);await page.keyboard.up('e')
    expect((await state()).camera[1]).toBeGreaterThan(y+5)
    const distance=(s:Awaited<ReturnType<typeof state>>)=>Math.hypot(...s.camera.map((n,i)=>n-s.target[i]))
    const beforeWheel=distance(await state())
    await page.mouse.move(330,430)
    await page.mouse.wheel(0,-200)
    await page.waitForTimeout(300)
    expect(distance(await state())).toBeLessThan(beforeWheel)
    const beforeDouble=(await state()).target
    await page.locator('canvas').dblclick({position:{x:250,y:320},force:true})
    await page.waitForTimeout(1600)
    expect((await state()).target).not.toEqual(beforeDouble)
  }else{
    const session=await page.context().newCDPSession(page)
    const box=(await page.getByRole('button',{name:'위로',exact:true}).boundingBox())!
    const y=(await state()).camera[1]
    await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:box.x+box.width/2,y:box.y+box.height/2,id:0}]})
    await page.waitForTimeout(450)
    await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]})
    expect((await state()).camera[1]).toBeGreaterThan(y+5)
    const beforePinch=await state()
    await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:90,y:350,id:0},{x:210,y:350,id:1}]})
    for(let i=1;i<=6;i++)await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:90-i*7,y:350,id:0},{x:210+i*7,y:350,id:1}]})
    await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await session.detach()
    await page.waitForTimeout(300)
    expect((await state()).camera).not.toEqual(beforePinch.camera)
  }
  for(const year of [1985,2026,2001,1985,2001,2026,1985])await page.getByRole('button',{name:String(year),exact:true}).click()
  expect((await state()).historicalFeatures).toBe(4)
  await page.locator('#history-focus').selectOption('international')
  await expect(page.locator('#event-note')).toContainText('현재 학생회관 위치 참조')
  await page.waitForTimeout(1500)
  expect((await state()).eventObjects).toBe(1)
  await page.screenshot({path:`experiments/geography/screenshots/${info.project.name}-1985-occupancy.png`,fullPage:false})
  await page.locator('#school-jump').selectOption('high');await page.waitForTimeout(1500)
  expect((await state()).year).toBe(1985)
  await page.screenshot({path:`experiments/geography/screenshots/${info.project.name}-1985-registered.png`,fullPage:false})
  await page.getByRole('button',{name:'2001',exact:true}).click()
  await page.locator('#history-focus').selectOption('college-move')
  await expect(page.locator('#event-note')).toContainText('통학 경로가 아닙니다')
  await page.waitForTimeout(1500)
  expect((await state()).eventObjects).toBe(2)
  await page.screenshot({path:`experiments/geography/screenshots/${info.project.name}-2001-relocation.png`,fullPage:false})
  await page.getByRole('button',{name:'2001',exact:true}).click()
  await page.locator('#school-jump').selectOption('university');await page.waitForTimeout(1500)
  expect((await state()).year).toBe(2001)
  expect((await state()).historicalFeatures).toBe(8)
  await page.screenshot({path:`experiments/geography/screenshots/${info.project.name}-2001-field.png`,fullPage:false})
  await page.getByRole('button',{name:'2026',exact:true}).click()
  await page.locator('#history-focus').selectOption('mcc');await page.waitForTimeout(1500)
  expect((await state()).year).toBe(2021)
  await page.getByRole('button',{name:'2026',exact:true}).click();await page.waitForTimeout(250)
  await page.screenshot({path:`experiments/geography/screenshots/${info.project.name}-2026-mcc.png`,fullPage:false})
  const benchmark=await page.evaluate(async()=>{
    const first=window.__GEO_STUDY__!(),start=performance.now();await new Promise(resolve=>setTimeout(resolve,2000))
    const last=window.__GEO_STUDY__!();return{elapsedMs:performance.now()-start,frames:last.frame-first.frame,renderCalls:last.calls,triangles:last.triangles}
  })
  await info.attach('render-sample',{body:JSON.stringify(benchmark),contentType:'application/json'})
  expect((await state()).historicalFeatures).toBe(0);expect((await state()).currentVisible).toBe(true)
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
  expect(errors).toEqual([])
})

test('month boundaries, playback, source precision, redevelopment and cached geometry',async({page},info)=>{
  test.setTimeout(120000)
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message))
  await page.goto('http://127.0.0.1:4188/MJUTime/geography.html')
  const state=()=>page.evaluate(()=>window.__GEO_STUDY__!())
  await expect.poll(async()=>(await state())?.frame??0).toBeGreaterThan(5)
  const choose=async(value:string)=>{await page.locator('#date-input').fill(value);await expect(page.locator('#current-month')).toHaveText(value.replace('-','.'))}
  await choose('2000-12');await page.locator('#time-slider').focus();await page.keyboard.press('ArrowRight')
  await expect(page.locator('#current-month')).toHaveText('2001.01')
  await choose('2001-07');expect((await state()).knownBuildings).not.toContain('795977922')
  await page.locator('#play-speed').selectOption('1');await page.getByRole('button',{name:'자동 재생'}).click()
  await expect.poll(async()=>(await state()).timeIndex,{timeout:4000,intervals:[50,100]}).toBeGreaterThan(2001*12+6)
  await page.getByRole('button',{name:'자동 재생'}).click()
  const paused=(await state()).timeIndex;await page.waitForTimeout(1100);expect((await state()).timeIndex).toBe(paused)
  expect((await state()).knownBuildings).toContain('795977922')
  await choose('2001-08')
  await expect(page.locator('#month-events')).toContainText('전문대 이전')
  await choose('2006-01');expect((await state()).knownBuildings).not.toContain('462990142')
  await expect(page.locator('#month-events')).toContainText('월 미확인')
  await choose('2006-02');expect((await state()).knownBuildings).toContain('462990142')
  await page.locator('#school-jump').selectOption('university');await page.waitForTimeout(1200)
  await page.screenshot({path:`experiments/geography/screenshots/${info.project.name}-month-2006-02.png`,fullPage:false})
  await page.locator('#camera-settings summary').click()
  expect((await state()).cameraSettings).toEqual({rotate:.5,pan:.5,zoom:.5,move:.5})
  await page.locator('[data-sensitivity="move"]').focus();await page.keyboard.press('Home');await page.keyboard.press('ArrowRight')
  expect((await state()).cameraSettings.move).toBe(.2)
  await page.reload();await expect.poll(async()=>(await state())?.frame??0).toBeGreaterThan(3)
  expect((await state()).cameraSettings.move).toBe(.2)
  await page.locator('#camera-settings summary').click();await page.locator('#reset-camera').click();await page.locator('#camera-settings summary').click()
  for(const [value,stage,id] of [['2019-04','demolition-report','hong2-demolition'],['2019-08','demolition-complete','hong2-cleared'],['2019-10','construction-report','hong2-construction'],['2022-11','completion','hong2-completion'],['2023-12','approval','hong2-approval']]){
    await choose(value);expect((await state()).housingStage).toBe(stage);expect((await state()).housingCount).toBe(8)
    await page.locator(`#month-events [data-event="${id}"]`).click();await page.waitForTimeout(1100)
    await expect(page.locator('#event-note a')).toHaveAttribute('href',/410100010002o22/)
    if(value!=='2019-04'&&value!=='2023-12')await page.screenshot({path:`experiments/geography/screenshots/${info.project.name}-hong2-${value}.png`,fullPage:false})
  }
  await choose('2016-05');expect((await state()).projectStage).toBe('construction-report')
  await page.getByRole('button',{name:'이전 사건'}).click();expect((await state()).timeIndex).toBeLessThan(2016*12+4)
  await page.getByRole('button',{name:'다음 사건'}).click();await expect(page.locator('#current-month')).toHaveText('2016.05')
  await choose('2001-08');expect((await state()).historicalFeatures).toBe(2)
  await page.locator('#photo-reference').check();expect((await state()).historicalFeatures).toBe(4)
  await expect(page.locator('#time-resolution')).toContainText('선택 월의 존재 증거 아님')
  await page.locator('#photo-reference').uncheck()
  await choose('1985-10');await choose('2001-09');await choose('2026-10')
  const warmed=await state()
  const sample=await page.evaluate(async()=>{
    const range=document.querySelector<HTMLInputElement>('#time-slider')!,before=window.__GEO_STUDY__!(),start=performance.now()
    for(let i=0;i<48;i++){
      range.value=String(i%2?2006*12:2026*12+9);range.dispatchEvent(new Event('input',{bubbles:true}));await new Promise(requestAnimationFrame)
    }
    return {elapsedMs:performance.now()-start,frames:window.__GEO_STUDY__!().frame-before.frame}
  })
  await choose('2026-10');await page.waitForTimeout(300)
  expect((await state()).historicalBuilds).toBe(warmed.historicalBuilds)
  expect((await state()).geometries).toBeLessThanOrEqual(warmed.geometries+2)
  await info.attach('continuous-month-sample',{body:JSON.stringify({...sample,geometries:(await state()).geometries,historicalBuilds:(await state()).historicalBuilds}),contentType:'application/json'})
  if(info.project.name==='mobile'){
    const box=(await page.locator('#time-slider').boundingBox())!,previous=(await state()).timeIndex
    await page.locator('#time-slider').scrollIntoViewIfNeeded();const r=(await page.locator('#time-slider').boundingBox())!
    const session=await page.context().newCDPSession(page)
    await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:r.x+r.width*.7,y:r.y+r.height/2,id:0}]})
    await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:r.x+r.width*.5,y:r.y+r.height/2,id:0}]})
    await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await session.detach()
    await expect.poll(async()=>(await state()).timeIndex).not.toBe(previous);expect(box.width).toBeGreaterThan(200)
  }
  await choose('2026-09');await page.locator('#play-speed').selectOption('120');await page.getByRole('button',{name:'자동 재생'}).click()
  await expect.poll(async()=>(await state()).playing).toBe(false);await expect(page.locator('#current-month')).toHaveText('2026.10')
  expect(errors).toEqual([]);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
})

test('sticky scroll story, intermediate campus continuity, additional captures and terrain rewind',async({page},info)=>{
  test.setTimeout(90000)
  const errors:string[]=[]
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())})
  await page.goto('http://127.0.0.1:4188/MJUTime/geography.html')
  const state=()=>page.evaluate(()=>window.__GEO_STUDY__!())
  await expect.poll(async()=>(await state())?.frame??0).toBeGreaterThan(5)
  const choose=async(date:string)=>{await page.locator('#date-input').fill(date);await expect(page.locator('#current-month')).toHaveText(date.replace('-','.'))}
  await page.locator('#school-jump').selectOption('university');await page.waitForTimeout(1300)
  for(const date of ['1985-10','1990-06','2000-06','2001-09','2010-06','2020-06','2026-10']){
    await choose(date)
    expect((await state()).knownBuildings).toEqual(expect.arrayContaining(['462990137','462990141','640328305','462990138']))
    if(date>='2000-01')expect((await state()).knownBuildings).toContain('462990140')
    expect((await state()).mcc.active).toBe(date>='2021-08')
    await page.waitForTimeout(500)
    // The selected date is asserted immediately before each image (no stale-date captures).
    expect((await state()).year).toBe(Number(date.slice(0,4)))
    await page.screenshot({path:`experiments/geography/screenshots/${info.project.name}-story-${date.slice(0,4)}.png`})
  }
  for(const date of ['1997-10','2006-11','2016-10']){
    await choose(date);await expect(page.locator('#month-events')).toContainText('여백 날짜 판독')
    expect((await state()).historicalFeatures).toBe(date==='2016-10'?3:4)
    await page.waitForTimeout(300)
    await page.screenshot({path:`experiments/geography/screenshots/${info.project.name}-aerial-${date}.png`})
  }
  await choose('2000-06');const down=(await state()).timeIndex
  expect(await page.evaluate(()=>scrollY)).toBeGreaterThan(1000)
  const cameraBefore=(await state()).camera
  const canvas=(await page.locator('canvas').boundingBox())!
  if(info.project.name==='desktop'){
    await page.mouse.move(canvas.x+canvas.width*.5,canvas.y+canvas.height*.5);await page.mouse.wheel(0,420)
  }else{
    const session=await page.context().newCDPSession(page),x=canvas.x+65,y=canvas.y+canvas.height*.65
    await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:0}]})
    for(let n=1;n<=8;n++)await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y-n*15,id:0}]})
    await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await session.detach()
  }
  await expect.poll(async()=>(await state()).timeIndex).toBeLessThan(down)
  expect((await state()).camera.every((n,i)=>Math.abs(n-cameraBefore[i])<.5)).toBe(true)
  await page.mouse.move(canvas.x+65,canvas.y+canvas.height*.5);const past=(await state()).timeIndex
  await page.mouse.wheel(0,-550);await expect.poll(async()=>(await state()).timeIndex).toBeGreaterThan(past)
  await choose('2021-07');expect((await state()).mcc.active).toBe(false)
  await choose('2021-08');expect((await state()).mcc.active).toBe(true)
  await page.locator('#explore').click();const fixed=(await state()).timeIndex
  await page.mouse.move(canvas.x+65,canvas.y+canvas.height*.5);await page.mouse.wheel(0,-200);await page.waitForTimeout(400)
  expect((await state()).timeIndex).toBe(fixed)
  await page.locator('#explore').click()
  await choose('2026-10');await page.waitForTimeout(800)
  const start=await state(),time=Date.now();await page.waitForTimeout(2000);const end=await state()
  const sample={environment:'headless Chromium / emulation, not physical device GPU benchmark',elapsedMs:Date.now()-time,frames:end.frame-start.frame,fps:(end.frame-start.frame)/((Date.now()-time)/1000),calls:end.calls,triangles:end.triangles,geometries:end.geometries,photoLayers:end.historicalBuilds}
  await writeFile(`experiments/geography/screenshots/${info.project.name}-performance.json`,JSON.stringify(sample,null,2)+'\n')
  expect(end.historicalBuilds).toBe(5)
  expect(await page.evaluate(()=>getComputedStyle(document.querySelector('main')!).position)).toBe('sticky')
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
  expect(errors).toEqual([])
})
