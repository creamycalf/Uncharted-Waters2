const fs=require('fs'),assert=require('node:assert/strict'),F=require('../src/mobile-fleet.js'),fixture=require('./fleet-fixture.cjs');
module.exports=async page=>{
 if(!process.env.UW2_TEST_SAVE)throw Error('Set UW2_TEST_SAVE to the same local start save used by fleet-runtime.cjs.');
 for(let i=0;i<3;i++){await page.evaluate(()=>K2UI.back());await page.waitForTimeout(300);}
 await page.evaluate(()=>K2Slots.open('save'));await page.getByRole('button',{name:'保存',exact:true}).nth(1).click();await page.getByRole('button',{name:'确认覆盖',exact:true}).click();await page.waitForFunction(()=>!K2Slots.isOpen(),{},{timeout:45000});
 const saved=new Uint8Array(await page.evaluate(async()=>Array.from(await K2Slots.mobileRead()))),f=F.inspect(saved,2);
 assert.equal(f.ships[0].type,22);assert.equal(f.ships[0].hull,99);assert.equal(f.ships[0].maxHull,100);assert.equal(f.ships[0].crew,120);assert.equal(f.ships[0].crewCapacity,300);assert.equal(f.ships[0].cargo,800);assert.equal(f.sailors[1].leadership,100);assert.equal(f.sailors[1].navigationLevel,50);assert.equal(f.sailors[1].battleLevel,45);assert.equal(f.sailors[1].skills,31);assert.equal(f.sailors[1].loyalty,99);
 fs.writeFileSync('mobile/build/qa-fleet-resaved.DAT',saved);
 await page.evaluate(()=>K2Mobile.open());await page.waitForFunction(()=>!document.querySelector('.mobile-apply').disabled);
 await page.getByRole('button',{name:'船只与水手',exact:true}).click();await page.locator('[name=crew]').fill('301');await page.getByRole('button',{name:'备份并应用',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.mobile-note').textContent.includes('水手人数不能超过'));
 assert.deepEqual(new Uint8Array(await page.evaluate(async()=>Array.from(await K2Slots.mobileRead()))),saved);
 await page.getByRole('button',{name:'恢复修改前备份',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.mobile-note').textContent.includes('已恢复修改前备份'));
 assert.deepEqual(new Uint8Array(await page.evaluate(async()=>Array.from(await K2Slots.mobileRead()))),fixture(process.env.UW2_TEST_SAVE));
 await page.getByRole('button',{name:'海员能力',exact:true}).click();
 for(const [width,height] of [[640,360],[800,450]]){await page.setViewportSize({width,height});await page.waitForTimeout(200);const bounds=await page.locator('#mobile-trainer').evaluate(e=>({width:e.clientWidth,scroll:e.scrollWidth}));assert(bounds.scroll<=bounds.width+1);for(const name of ['leadership','navigationLevel']){const input=page.locator('[name='+name+']');await input.scrollIntoViewIfNeeded();const r=await input.boundingBox();assert(r.x>=0&&r.x+r.width<=width);}}
 await page.getByLabel('选择海员',{exact:true}).selectOption('78');await page.screenshot({path:'mobile/build/06-trainer-sailors.png'});
 await page.setViewportSize({width:982,height:504});
 console.log('PASS: native re-save retains vessel and officer changes; invalid input is atomic; whole-file backup restores exactly; 640/800-wide touch forms fit.');
};
