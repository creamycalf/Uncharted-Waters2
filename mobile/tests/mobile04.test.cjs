const test=require('node:test'),assert=require('node:assert/strict'),M=require('../src/mobile-motion.js'),N=require('../src/mobile-navigation.js'),C=require('../src/mobile-core.js');
test('steering releases old direction before reversal, short pulses do not leave held keys',()=>{
 let now=0,id=0;const timers=new Map(),events=[];const s=M.steering((key,on)=>events.push({key,on,at:now}),{setTimer(fn,delay){timers.set(++id,{fn,at:now+delay});return id;},clearTimer(id){timers.delete(id);}});
 function advance(ms){const end=now+ms;for(;;){const a=[...timers].sort((a,b)=>a[1].at-b[1].at)[0];if(!a||a[1].at>end)break;timers.delete(a[0]);now=a[1].at;a[1].fn();}now=end;}
 s.set('north');advance(500);s.set('south');const changed=events.length;advance(500);s.stop();advance(1000);
 assert(events.slice(changed).every(e=>e.key===264));assert.equal(events.at(-1).on,false);assert.equal(timers.size,0);
 const held=new Map();for(const e of events){if(e.on){assert(!held.has(e.key));held.set(e.key,e.at);}else{assert(e.at-held.get(e.key)<=35);held.delete(e.key);}}assert.equal(held.size,0);
});
test('route finds a detour and refuses disconnected targets and water',()=>{
 const cells=Uint8Array.from([1,1,1,1,1,1,0,0,0,1,1,1,1,1,1]),grid={width:5,height:3,cells};const p=N.path(grid,{x:0,y:1},{x:4,y:1});assert.equal(p.length,6);assert(p.every(v=>cells[v.y*5+v.x]));assert.equal(N.path(grid,{x:0,y:1},{x:2,y:1}),null);
 const water={width:640,height:480,data:new Uint8ClampedArray(640*480*4)};for(let i=0;i<water.data.length;i+=4){water.data[i+1]=65;water.data[i+2]=211;water.data[i+3]=255;}assert.equal(N.ground(water,300,300),false);assert.equal(N.locate(water),null);
});
test('fill mode occupies full available rectangle without clipping original active frame',()=>{const r=C.viewport(1200,600,true,{},true);assert.equal(r.left,0);assert.equal(r.width,1200);assert(Math.abs(r.top+r.crop)<1e-6);assert(Math.abs(r.top+r.height-r.crop-600)<1e-6);});
