const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
test('scene throttling observes final idle frame and never a previous engine frame',()=>{
 let now=1000,id=0;const timers=new Map(),seen=[];
 const window={__ci:{},K2UI:{observeFrame:data=>seen.push(data[0]),state:()=>({tabs:false})}};
 const scope={window,localStorage:{getItem:()=>null},document:{readyState:'loading',addEventListener(){}},performance:{now:()=>now},setTimeout(fn){timers.set(++id,fn);return id;},clearTimeout(id){timers.delete(id);}};
 vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname,'../src/mobile-ui.js'),'utf8'),scope);
 window.K2Mobile.observeFrame(new Uint8Array([1]),1,1);assert.deepEqual(seen,[1]);
 now=1010;const final=new Uint8Array([2]);window.K2Mobile.observeFrame(final,1,1);
 now=1020;final[0]=3;window.K2Mobile.observeFrame(final,1,1);assert.equal(timers.size,1);assert.deepEqual(seen,[1]);
 now=1100;const fn=[...timers.values()][0];timers.clear();fn();assert.deepEqual(seen,[1,3]);
 now=1110;window.K2Mobile.observeFrame(new Uint8Array([4]),1,1);window.__ci={};
 now=1200;const stale=[...timers.values()][0];timers.clear();stale();assert.deepEqual(seen,[1,3]);
});
