const fs=require('fs'),assert=require('node:assert/strict'),fixture=require('./fleet-fixture.cjs');
module.exports=async page=>{
 if(!process.env.UW2_TEST_SAVE)throw Error('Set UW2_TEST_SAVE to a local Chinese Al start save (record 2); no game saves are bundled in Git.');
 await page.reload();const data=[...fixture(process.env.UW2_TEST_SAVE)];
 await page.evaluate(async data=>{await K2Slots.mobileReplace(await K2Slots.mobileRead(),new Uint8Array(data));K2App.load();},data);
 await page.getByRole('button',{name:'读取',exact:true}).nth(1).click();
 await page.waitForFunction(()=>!!window.__ci&&!window.__k2Booting&&!K2Slots.isOpen(),{},{timeout:60000});await page.waitForTimeout(1000);
 await page.evaluate(()=>K2Mobile.open());await page.waitForFunction(()=>!document.querySelector('.mobile-apply').disabled);
 await page.getByRole('button',{name:'船只与水手',exact:true}).click();assert.equal(await page.locator('[name=crew]').inputValue(),'20');
 for(const [key,value] of Object.entries({type:22,hull:99,maxHull:100,turn:97,power:98,crew:120,crewCapacity:300,cargo:800})){
  if(key==='type')await page.locator('[name=type]').selectOption(String(value));else await page.locator('[name='+key+']').fill(String(value));
 }
 await page.getByRole('button',{name:'海员能力',exact:true}).click();await page.getByLabel('选择海员',{exact:true}).selectOption('78');
 await page.getByRole('button',{name:'八项能力设为 100',exact:true}).click();await page.getByRole('button',{name:'学会全部技能',exact:true}).click();await page.locator('[name=navigationLevel]').fill('50');await page.locator('[name=battleLevel]').fill('45');await page.locator('[name=loyalty]').fill('99');
 await page.getByRole('button',{name:'金钱与声望',exact:true}).click();await page.locator('[name=money]').fill('1234567');
 await page.getByRole('button',{name:'船只与水手',exact:true}).click();assert.equal(await page.locator('[name=crew]').inputValue(),'120');
 await page.screenshot({path:'mobile/build/06-trainer-ships.png'});
 await page.getByRole('button',{name:'备份并应用',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.mobile-note').textContent.includes('已备份并修改'));
 const modified=await page.evaluate(async()=>Array.from(await K2Slots.mobileRead()));fs.writeFileSync('mobile/build/qa-fleet-edited.DAT',Buffer.from(modified));
 const result=await page.evaluate(async()=>K2MobileFleet.inspect(await K2Slots.mobileRead(),2));assert.equal(result.ships[0].type,22);assert.equal(result.ships[0].crew,120);assert.equal(result.sailors[1].navigationLevel,50);assert.equal(result.sailors[1].skills,31);
 await page.getByRole('button',{name:'读取记录',exact:true}).click();await page.getByRole('button',{name:'读取',exact:true}).nth(1).click();await page.waitForFunction(()=>!K2Slots.isOpen()&&!window.__k2Booting,{},{timeout:45000});await page.waitForTimeout(1000);
 console.log('PASS: synthetic Chinese fleet fixture -> touch form cross-category drafts -> one backed-up transaction -> native DOS load');
 await page.evaluate(()=>K2UI.shortcut(0));await page.waitForTimeout(800);
};
