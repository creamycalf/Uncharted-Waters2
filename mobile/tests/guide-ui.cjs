const assert=require('node:assert/strict'),fs=require('fs');
module.exports=async page=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const guide=await page.context().newPage();guide.on('pageerror',e=>errors.push(e.message));
 await guide.route('**/*',route=>{const url=new URL(route.request().url());return url.hostname==='127.0.0.1'?route.continue():route.abort();});
 await guide.goto('http://127.0.0.1:4173/guide.html');
 const ids=['joao','catalina','otto','ernst','pietro','ali'],ends=['联合舰队与结局','联合进攻与结局','波尔多决战与结局','黄河与长安结局','救回法雷尔祖父','夏洛克的房子与结局'];
 for(let i=0;i<ids.length;i++){
  await guide.locator('[data-character='+ids[i]+']').click();
  assert.equal(await guide.locator('.quest-step').count(),[10,10,9,8,9,11][i]);
  assert(await guide.getByText(ends[i],{exact:false}).count());
  assert(await guide.locator('#character-guide img').evaluate(x=>x.complete&&x.naturalWidth===64));
  assert((await guide.locator('.source a').getAttribute('href')).includes('scenario-'+(i+1)+'-'));
 }
 await guide.getByLabel('搜索当前人物攻略').fill('40,000');assert.equal(await guide.locator('.quest-step:visible').count(),1);
 await guide.getByLabel('搜索当前人物攻略').fill('不存在的关键词');assert.equal(await guide.locator('.quest-step:visible').count(),0);
 await guide.getByLabel('搜索当前人物攻略').fill('');
 await guide.getByLabel('完成：筹钱修船',{exact:true}).check();await guide.reload();
 assert(await guide.getByLabel('完成：筹钱修船',{exact:true}).isChecked());
 await guide.getByRole('button',{name:'清除本人物勾选',exact:true}).click();assert.equal(await guide.getByLabel('完成：筹钱修船',{exact:true}).isChecked(),false);
 for(const size of [{width:1000,height:600},{width:640,height:360},{width:390,height:750}]){
  await guide.setViewportSize(size);assert(await guide.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 }
 await guide.setViewportSize({width:1000,height:600});await guide.locator('[data-character=catalina]').click();await guide.evaluate(()=>scrollTo(0,0));
 await guide.screenshot({path:'mobile/build/081-guide-characters.png'});
 await guide.locator('.quest-step').first().scrollIntoViewIfNeeded();await guide.screenshot({path:'mobile/build/081-guide-catalina.png'});
 await guide.locator('[data-character=basics]').click();assert(await guide.getByRole('heading',{name:'④ 选船：用途比单一等级更重要'}).isVisible());
 assert(await guide.locator('img').evaluateAll(xs=>xs.every(x=>x.complete&&x.naturalWidth>0)));
 await guide.close();
 // Launch real DOS engine, then use the installed game's guide entry/return.
 await page.reload();await page.waitForFunction(()=>!!window.K2App);
 const data=[...fs.readFileSync(process.env.UW2_TEST_SAVE)];await page.evaluate(async data=>{await K2Slots.mobileReplace(await K2Slots.mobileRead(),new Uint8Array(data));K2App.load();},data);
 await page.getByRole('button',{name:'读取',exact:true}).nth(1).click();await page.waitForFunction(()=>!!window.__ci&&!window.__k2Booting&&!K2Slots.isOpen(),{},{timeout:60000});await page.waitForTimeout(1200);
 await page.getByRole('button',{name:'展开或收起工具',exact:true}).click();assert(await page.getByRole('button',{name:'菜单',exact:true}).isVisible());assert(await page.getByRole('button',{name:'修改器',exact:true}).isVisible());await page.getByRole('button',{name:'攻略',exact:true}).click();
 const frame=page.frameLocator('#mobile-guide iframe');await frame.locator('[data-character=ali]').click();await frame.getByText('夏洛克的房子与结局',{exact:false}).waitFor();
 await page.screenshot({path:'mobile/build/081-guide-ingame.png'});await page.getByRole('button',{name:'返回游戏',exact:true}).click();assert.equal(await page.locator('#mobile-guide').count(),0);assert.equal(await page.evaluate(()=>!!window.__ci&&!window.__k2Booting),true);
 assert.deepEqual(errors,[]);console.log('PASS: six complete character guides / 57 steps, portraits, search, manual progress, three sizes, local-only requests and real DOS menu entry/return.');
};
