const fs=require('fs'),assert=require('node:assert/strict');
module.exports=async page=>{
 const data=[...fs.readFileSync(process.env.UW2_TEST_SAVE)];
 await page.evaluate(()=>{localStorage.setItem('uw2-move-mode','swipe');localStorage.setItem('uw2-input-mode','direct');});await page.reload();await page.waitForFunction(()=>!!window.K2App);
 await page.evaluate(async data=>{localStorage.setItem('uw2-screen-fit','fill');await K2Slots.mobileReplace(await K2Slots.mobileRead(),new Uint8Array(data));K2App.load();},data);
 await page.getByRole('button',{name:'读取',exact:true}).nth(1).click();
 await page.waitForFunction(()=>!!window.__ci&&!window.__k2Booting&&!K2Slots.isOpen(),{},{timeout:60000});await page.waitForTimeout(1400);
 const toggle=page.getByRole('button',{name:'展开或收起工具',exact:true});
 assert.equal(await page.getByRole('button',{name:'确认',exact:true}).isVisible(),false);
 for(const size of [{width:1200,height:540},{width:640,height:360}]){
  await page.setViewportSize(size);await page.waitForTimeout(400);
  const r=await page.locator('#mobile-touch').boundingBox();assert(Math.abs(r.height-size.height)<2);assert(Math.abs(r.width-size.width)<2);
  await toggle.click();assert(await page.getByRole('button',{name:'修改器',exact:true}).isVisible());
  assert(await page.getByRole('button',{name:'确认',exact:true}).isVisible());await toggle.click();
 }
 await page.setViewportSize({width:1200,height:540});await page.waitForTimeout(400);
 await toggle.click();await page.getByRole('button',{name:'移动模式：滑动',exact:true}).click();await toggle.click();
 assert(await page.locator('#mobile-stick').isVisible());
 await page.screenshot({path:'mobile/build/08-city.png'});
 // Open the original game's menu by direct touch at its native tab.
 const r=await page.locator('#root canvas').boundingBox();
 const cdp=await page.context().newCDPSession(page);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:r.x+r.width*625/640,y:r.y+r.height*152/480}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach();
 await page.waitForFunction(()=>K2UI.state().popup,{},{timeout:10000});await page.waitForTimeout(300);
 assert.equal(await page.locator('#mobile-stick').isVisible(),false);
 assert(await page.getByRole('button',{name:'返回',exact:true}).isVisible());
 await page.screenshot({path:'mobile/build/08-popup.png'});
 await page.getByRole('button',{name:'返回',exact:true}).click();
 await page.waitForFunction(()=>!K2UI.state().popup);await page.waitForTimeout(300);
 assert(await page.locator('#mobile-stick').isVisible());
 await toggle.click();await page.getByRole('button',{name:'输入模式：直触',exact:true}).click();await toggle.click();
 assert(await page.getByRole('button',{name:'左键',exact:true}).isVisible());assert.equal(await page.getByRole('button',{name:'确认',exact:true}).isVisible(),false);
 await toggle.click();await page.getByRole('button',{name:'输入模式：滑鼠',exact:true}).click();
 await page.getByRole('button',{name:'修改器',exact:true}).click();await page.getByRole('button',{name:'返回游戏',exact:true}).click();
 await page.waitForTimeout(300);await page.screenshot({path:'mobile/build/08-tools.png'});
 console.log('PASS: full viewport, touch native menu, context actions/joystick, trackpad fallback and trainer access.');
};
