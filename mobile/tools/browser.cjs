process.env.TEMP=process.env.TMP=require('path').resolve(__dirname,'../build/tmp');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright-core');
const fs=require('fs'),path=require('path');
(async()=>{const browser=await chromium.connectOverCDP('http://127.0.0.1:9223');const page=browser.contexts()[0].pages()[0];
 if(process.argv[2]){const action=require(path.resolve(process.argv[2]));await action(page);}
 console.log(await page.evaluate(()=>({title:document.title,text:document.body.innerText.slice(-1800),buttons:[...document.querySelectorAll('button')].filter(x=>x.getBoundingClientRect().width&&getComputedStyle(x).visibility!=='hidden').map(x=>({text:x.textContent,aria:x.getAttribute('aria-label')})),state:window.K2UI?.state(),mobile:window.K2Mobile?.state(),boot:window.__k2Booting,logs:window.__logs?.slice(-5)})));
 await page.screenshot({path:path.resolve('mobile/build/browser.png')});await browser.close();})();
