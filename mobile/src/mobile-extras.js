(function(root){'use strict';
const C=root.K2MobileCore||(typeof require==='function'?require('./mobile-core.js'):null);
const names={0:'短匕首',1:'短剑',2:'长剑',3:'西洋刺剑',4:'细身剑',5:'穿甲剑',6:'短军刀',7:'弯刀',8:'日本刀',9:'水手刀',10:'阔剑',11:'青龙偃月刀',12:'焰形剑',13:'双手剑',14:'苏格兰大剑',15:'军刀',16:'皮甲',17:'锁子甲',18:'半身甲',19:'板甲',26:'金龙刀',73:'妖刀村正',74:'圣剑',75:'圣骑士甲',76:'圣骑士剑',77:'湿婆神剑',78:'艾罗尔宝甲'};
function base(a,s){C.inspect(a,s);return (s-1)*32884;}
function inspect(a,s){const d=base(a,s),v=new DataView(a.buffer,a.byteOffset,a.byteLength),inventory=Array.from(a.slice(d+0x224a,d+0x225e)),items=[];
for(const [id,name] of Object.entries(names)){const p=d+0x763b+Number(id)*20,type=a[p+19]&15;if(![0,1,2,3,6].includes(type)||a[p+18]>100)throw Error('装备结构不匹配');items.push({id:Number(id),name,type,rating:a[p+18],equipped:!!(a[p+19]&16)});}
let ports=0,villages=0;for(let i=0;i<130;i++){const p=d+0x5347+i*22;if(v.getUint16(p,true)>2160||v.getUint16(p+2,true)>1080)throw Error('港口结构不匹配');if(a[p+21]&16)ports++;}for(let i=0;i<98;i++){const p=d+0x737f+i*7;if(v.getUint16(p,true)>2160||v.getUint16(p+2,true)>1080)throw Error('村落结构不匹配');if(!(a[p+6]&128)&&(a[p+6]&64))villages++;}
return {items,inventory,ports,villages,weapon:inventory.find(id=>items.some(i=>i.id===id&&i.type<4&&i.equipped))??-1,armor:inventory.find(id=>items.some(i=>i.id===id&&i.type===6&&i.equipped))??-1};}
function edit(a,s,changes){const current=inspect(a,s),d=base(a,s),out=a.slice(),v=new DataView(out.buffer);for(const key of Object.keys(changes))if(!['weapon','armor','map'].includes(key))throw Error('未知修改项');
 for(const key of ['weapon','armor'])if(Object.hasOwn(changes,key)){
 const id=changes[key],item=current.items.find(x=>x.id===id&&(key==='armor'?x.type===6:x.type<4));if(id!==-1&&!item)throw Error('不支持的装备');
 for(const entry of current.items)if(key==='armor'?entry.type===6:entry.type<4)out[d+0x763b+entry.id*20+19]&=239;
 if(id!==-1){let index=Array.from(out.slice(d+0x224a,d+0x225e)).indexOf(id);if(index<0){index=Array.from(out.slice(d+0x224a,d+0x225e)).indexOf(255);if(index<0)throw Error('物品栏已满，请先在游戏里腾出一个空位');out[d+0x224a+index]=id;}out[d+0x763b+id*20+19]|=16;}
 }
 if(Object.hasOwn(changes,'map')){if(changes.map!==1)throw Error('地图操作无效');for(let y=0;y<45;y++){out.fill(255,d+0x1db+y*12,d+0x1db+y*12+11);out[d+0x1db+y*12+11]|=192;}v.setUint16(d+0x401,4050,true);for(let i=0;i<130;i++)out[d+0x5347+i*22+21]|=16;for(let i=0;i<98;i++){const p=d+0x737f+i*7;if(out[p+4]<90)out[p+6]=(out[p+6]&127)|64;}}
 return out;}
function ships(a,s){const d=base(a,s),v=new DataView(a.buffer,a.byteOffset,a.byteLength);return Array.from({length:25},(_,id)=>{const p=d+0x521b+id*12;return {id,hull:a[p+1],turn:a[p+2],power:a[p+3],crew:a[p+4]*10,minCrew:a[p+5],capacity:v.getUint16(p+6,true),guns:a[p+8],industry:a[p]*10};});}
root.K2MobileExtras={inspect,edit,ships};if(typeof module!=='undefined')module.exports=root.K2MobileExtras;
})(typeof window==='undefined'?globalThis:window);
