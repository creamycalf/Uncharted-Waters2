const test=require('node:test'),assert=require('node:assert/strict'),F=require('../src/mobile-fleet.js'),fixture=require('./fleet-fixture.cjs');
test('Chinese ship references, crew and roster decode independently known fixture values',()=>{
 const b=fixture(),s=F.inspect(b,2);assert.equal(s.character,5);assert.equal(s.ships.length,1);assert.equal(s.ships[0].name,'QA SHIP');assert.equal(s.ships[0].type,5);assert.equal(s.ships[0].crew,20);assert.equal(s.ships[0].cargo,80);assert.deepEqual(s.sailors.map(x=>x.id),[5,78]);
});
test('ship changes only chosen field bytes; type updates model nibble but retains material',()=>{
 const b=fixture(),old=b.slice(),s=F.inspect(b,2).ships[0],d=32884,p=d+0x2294+20*133,q=d+0x4c85;
 const out=F.edit(b,2,'ship',0,{type:22,hull:99,maxHull:100,power:98,crew:120,crewCapacity:300,cargo:800},s);
 assert.deepEqual(b,old);assert.equal(out[q+16]&15,b[q+16]&15);assert.equal(out[q+16]&0xf0,b[q+62*22+16]&0xf0);
 const allowed=new Set([p,p+1,p+2,p+3,p+5,q+15,q+16,q+18,q+19,q+20,q+21]);for(let i=0;i<b.length;i++)if(b[i]!==out[i])assert(allowed.has(i),i.toString(16));
 const n=F.inspect(out,2).ships[0];assert.equal(n.crew,120);assert.equal(n.type,22);assert.equal(n.cargo,800);assert.equal(n.guns,5);
});
test('sailor edits preserve name, ownership, duty, experience and high skill bits',()=>{
 const b=fixture(),d=32884,p=d+0x6a9+78*50;b[p+48]|=0xa0;const s=F.inspect(b,2).sailors[1],out=F.edit(b,2,'sailor',78,{leadership:100,navigationLevel:50,loyalty:99,skills:31},s);
 const allowed=new Set([p+28,p+36,p+43,p+48]);for(let i=0;i<b.length;i++)if(b[i]!==out[i])assert(allowed.has(i));assert.equal(out[p+48]&0xe0,0xa0);
});
test('reject stale identities, nonexistent vessels, NPCs, empty slots, invalid roster and out-of-range fields',()=>{
 const b=fixture(),s=F.inspect(b,2).ships[0];assert.throws(()=>F.edit(b,2,'ship',0,{hull:101},s));assert.throws(()=>F.edit(b,2,'ship',0,{hull:31},s));assert.throws(()=>F.edit(b,2,'ship',0,{crew:100},s));assert.throws(()=>F.edit(b,2,'ship',0,{cargo:29},s));assert.throws(()=>F.edit(b,2,'ship',0,{guns:11},s));assert.throws(()=>F.edit(b,2,'ship',0,{hull:20},{...s,token:'stale'}));assert.throws(()=>F.edit(b,2,'ship',9,{hull:20},s));assert.throws(()=>F.edit(b,2,'sailor',69,{loyalty:100},{}));assert.throws(()=>F.inspect(b,10));assert.throws(()=>F.edit(b,2,'ship',0,{owner:2},s));
 const bad=b.slice();bad[32884+0x220e]=250;assert.throws(()=>F.inspect(bad,2));
});
test('all six protagonist fleet IDs, last save slot, nonzero byteOffset and no shared NPC instances',()=>{
 const b=fixture(),record=b.slice(151+32884,151+2*32884);b.set(record,151+9*32884);b[136]=49;
 assert.equal(F.inspect(b,10).ships[0].crew,20);
 for(let character=0;character<6;character++){const c=b.slice(),d=9*32884;c[d+0x6a8]=character;c.fill(255,d+0x220e,d+0x220e+30);assert.equal(F.inspect(c,10).character,character);}
 const wrapped=new Uint8Array(b.length+7);wrapped.set(b,7);assert.equal(F.inspect(wrapped.subarray(7),2).ships[0].crew,20);
 const bad=b.slice();bad[32884+0x2294+20*133+7]=48;assert.throws(()=>F.inspect(bad,2));
});
