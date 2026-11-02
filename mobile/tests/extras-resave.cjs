const fs=require('fs'),assert=require('node:assert/strict');module.exports=async page=>{
 await page.evaluate(()=>K2Slots.open('save'));await page.getByRole('button',{name:'保存',exact:true}).nth(1).click();await page.getByRole('button',{name:'确认覆盖',exact:true}).click();await page.waitForFunction(()=>!K2Slots.isOpen(),{},{timeout:45000});
 const bytes=await page.evaluate(async()=>Array.from(await K2Slots.mobileRead()));fs.writeFileSync('mobile/build/07-resaved.DAT',Buffer.from(bytes));const E=require('../src/mobile-extras.js'),s=E.inspect(new Uint8Array(bytes),2);assert.equal(s.weapon,76);assert.equal(s.armor,75);assert.equal(s.ports,130);assert.equal(s.villages,88);console.log('PASS native resave retained equipment and all map flags');
 await page.evaluate(()=>K2UI.shortcut(3));await page.waitForTimeout(1500);
};
