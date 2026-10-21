import {test,expect} from '@playwright/test'
test('real geographic rendering, orbit, dates and no fabricated historical geometry',async({page},info)=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message))
  await page.goto('http://127.0.0.1:4188/MJUTime/geography.html')
  await expect.poll(()=>page.evaluate(()=>window.__GEO_STUDY__?.().frame??0)).toBeGreaterThan(5)
  const initial=await page.evaluate(()=>window.__GEO_STUDY__!())
  expect(initial.footprints).toBe(2667);expect(initial.currentVisible).toBe(true)
  expect(initial.calls).toBeGreaterThan(5);expect(initial.triangles).toBeGreaterThan(50000)
  for(const name of ['명지대학교 인문캠퍼스','명지전문대학','명지초등학교','명지중학교','명지고등학교'])await expect(page.locator('.place b',{hasText:name})).toBeVisible()
  await page.screenshot({path:`experiments/geography/screenshots/${info.project.name}-2026.png`,fullPage:true})
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
    await expect(page.locator('#map-state')).toContainText('당시 건물 형상 미확인')
    await page.screenshot({path:`experiments/geography/screenshots/${info.project.name}-${year}.png`,fullPage:true})
    const context=page.getByRole('checkbox',{name:/현재 건물/});await context.check()
    expect(await page.evaluate(()=>window.__GEO_STUDY__!().currentVisible)).toBe(true)
    await context.uncheck()
  }
  await page.getByRole('button',{name:'2026',exact:true}).click()
  await page.getByRole('button',{name:'위에서 보기 · 북쪽 ↑'}).click()
  await page.waitForTimeout(300)
  await page.screenshot({path:`experiments/geography/screenshots/${info.project.name}-2026-top.png`,fullPage:true})
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
  expect(errors).toEqual([])
})
