const assert=require('node:assert/strict');
module.exports=async page=>{
 await page.reload();
 await page.waitForFunction(()=>window.K2Skin?.ready&&window.K2App?.phase==='splash');
 for(const size of [{width:1000,height:600},{width:1200,height:540},{width:640,height:360}]){
  await page.setViewportSize(size);
  await page.waitForTimeout(350);
  const bounds=await page.locator('#k2-approved-start>.skin-base').boundingBox();
  assert.deepEqual(bounds,{x:0,y:0,...size});
  assert(await page.locator('#k2-approved-start>.skin-base').evaluate(x=>x.complete&&x.naturalWidth>0));
 }
 await page.setViewportSize({width:1200,height:540});
 await page.waitForTimeout(350);
 await page.screenshot({path:'mobile/build/071-home.png'});
 await page.evaluate(()=>{
  window.coverAudit={frames:0,exposed:0,programs:[]};
  function check(){
   if(window.__k2Booting){
    const c=document.getElementById('k2-boot-cover'),r=c?.getBoundingClientRect(),s=c&&getComputedStyle(c);
    coverAudit.frames++;
    if(!r||r.x!==0||r.y!==0||r.width!==innerWidth||r.height!==innerHeight||s.backgroundColor!=='rgb(8, 27, 41)'||s.display==='none')coverAudit.exposed++;
    const p=document.documentElement.dataset.k2BootProgram;if(p&&!coverAudit.programs.includes(p))coverAudit.programs.push(p);
   }
   window.coverAuditTimer=requestAnimationFrame(check);
  }check();
 });
 await page.locator('[data-start-action=new]').click();
 await page.locator('#k2-boot-cover').waitFor();
 await page.waitForTimeout(700);
 await page.screenshot({path:'mobile/build/071-loading.png'});
 await page.waitForFunction(()=>!!window.__ci&&!window.__k2Booting&&window.K2App.phase==='game',{},{timeout:90000});
 await page.waitForTimeout(1400);
 const audit=await page.evaluate(()=>{cancelAnimationFrame(window.coverAuditTimer);return window.coverAudit;});
 assert(audit.frames>0);assert.equal(audit.exposed,0);
 assert.equal(await page.locator('#k2-boot-cover').count(),0);
 assert.equal(await page.locator('#k2-approved-start').isVisible(),false);
 await page.screenshot({path:'mobile/build/071-ready.png'});
 console.log('PASS: edge-to-edge homepage in three viewports; opaque boot cover until real game ready',audit);
 // If this browser has a real test save, also exercise engine restart when loading it.
 await page.reload();
 await page.waitForFunction(()=>window.K2Skin?.ready&&window.K2App?.phase==='splash');
 if(!await page.locator('[data-start-action=continue]').isEnabled()){console.log('Saved-game restart skipped: no local test save');return;}
 await page.locator('[data-start-action=continue]').click();
 const load=page.getByRole('button',{name:'读取',exact:true}).nth(1);
 if(await load.isEnabled()){
  await load.click();await page.locator('#k2-boot-cover').waitFor();
  assert.equal(await page.locator('#k2-boot-cover').evaluate(x=>getComputedStyle(x).backgroundColor),'rgb(8, 27, 41)');
  await page.screenshot({path:'mobile/build/071-load-save.png'});
  await page.waitForFunction(()=>!window.__k2Booting&&!K2Slots.isOpen(),{},{timeout:90000});
  await page.waitForTimeout(1400);
  assert.equal(await page.locator('#k2-boot-cover').count(),0);
  console.log('PASS: saved-game restart covered and returned to gameplay');
 }else await page.getByRole('button',{name:'返回',exact:true}).click();
};
