const assert=require('node:assert/strict');
module.exports=async page=>{
 await page.addScriptTag({path:'mobile/src/mobile-fleet.js'});await page.addScriptTag({path:'mobile/src/mobile-trainer-form.js'});
 await page.getByRole('button',{name:'返回游戏',exact:true}).click();await page.evaluate(()=>K2Mobile.open());await page.waitForFunction(()=>!document.querySelector('.mobile-apply').disabled);
 await page.getByLabel('选择存档',{exact:true}).selectOption('2');await page.getByRole('button',{name:'船只与水手',exact:true}).click();
 await page.locator('[name=maxHull]').fill('100');await page.getByRole('button',{name:'修复到耐久上限',exact:true}).click();assert.equal(await page.locator('[name=hull]').inputValue(),'100');
 await page.locator('[name=crewCapacity]').fill('200');await page.getByRole('button',{name:'水手补至舱位',exact:true}).click();assert.equal(await page.locator('[name=crew]').inputValue(),'200');
 await page.getByRole('button',{name:'海员能力',exact:true}).click();assert.equal(await page.getByText('测量',{exact:true}).count(),1);
 await page.getByLabel('选择存档',{exact:true}).selectOption('10');assert.equal(await page.locator('.mobile-apply').isDisabled(),true);assert.equal(await page.locator('#mobile-trainer input[type=number]').count(),0);
 await page.getByLabel('选择存档',{exact:true}).selectOption('2');await page.getByRole('button',{name:'船只与水手',exact:true}).click();assert.equal(await page.locator('[name=crew]').inputValue(),'20');
 await page.getByRole('button',{name:'返回游戏',exact:true}).click();console.log('PASS: presets use latest edited limits; empty save disables writes; switching save clears drafts.');
};
