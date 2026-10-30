/* Chinese DOS save layout. Research: JohanLi (MIT), genishs/dh2-py-editor
 * (MIT); Chinese offsets and 22-byte ship instances independently checked.
 * Offsets below include the 151-byte file header for slot 1.
 */
(function(root){
 'use strict';
 const C=root.K2MobileCore||(typeof require==='function'?require('./mobile-core.js'):null);
 const SHIPS=['轻木帆船','汉萨帆船','阿拉伯帆船','大型商船','单桅小帆船','轻型三角帆船','轻型方帆船','轻型双桅帆船','中型帆船','卡拉克帆船','盖伦帆船','三角帆船','轻型快船','单桅快船','巡航快船','大型多桅帆船','大型轮船','中国帆船','轻型桨帆船','威尼斯桨帆船','大型桨帆船','重型快船','铁甲船','安宅船','关船'];
 const shipFields={type:['船型',0,24],hull:['当前耐久',1,100],maxHull:['耐久上限',1,100],power:['推进力',1,100],turn:['转向力',1,100],crew:['现有水手',0,2000],crewCapacity:['水手舱位',1,2000],guns:['现有火炮',0,150],gunCapacity:['炮舱容量',0,150],cargo:['货舱容量',0,9999]};
 const sailorFields={leadership:['统率力',0,100],seamanship:['航海术',0,100],knowledge:['知识',0,100],intuition:['直觉',0,100],courage:['勇气',0,100],swordsmanship:['剑术',0,100],charm:['魅力',0,100],luck:['运气',0,100],navigationLevel:['航海等级',1,100],battleLevel:['战斗等级',1,100],loyalty:['忠诚度',0,100],skills:['技能',0,31]};
 const statKeys=Object.keys(sailorFields).slice(0,10),skillNames=['交涉','会计','炮术','制图','测量'];
 function fail(message){throw Error(message);}
 function num(n,min,max){if(!Number.isSafeInteger(n)||n<min||n>max)fail('数值必须是 '+min+'～'+max+' 的整数');return n;}
 function hex(a){return Array.from(a,x=>x.toString(16).padStart(2,'0')).join('');}
 function view(a){return new DataView(a.buffer,a.byteOffset,a.byteLength);}
 function context(a,slot){const core=C.inspect(a,slot),d=(slot-1)*32884,p=d+0x6a9+core.character*50,fleet=a[p+44];num(fleet,0,69);if(fleet!==[0,10,30,50,40,20][core.character])fail('主角船队标记不匹配');return {d,character:core.character,fleet};}
 function readable(a,fallback){const end=a.indexOf(0),b=end<0?a:a.slice(0,end);return b.length&&b.every(x=>x>=32&&x<127)?String.fromCharCode(...b):fallback;}
 function inspect(a,slot){
  const {d,character,fleet}=context(a,slot),v=view(a),ships=[],sailors=[];
  const seen=new Set();
  for(let i=0;i<10;i++){
   const p=d+0x2294+fleet*133+i*9,id=a[p+7];if(id===255)continue;
   if(id>=40||(a[p+8]&0x30)!==0x10||seen.has(id))fail('船队记录无法可靠识别');seen.add(id);
   const q=d+0x4c85+id*22,t=a[q+15];num(t,0,24);
   ships.push({id:i,instance:id,name:readable(a.slice(q,q+15),'第 '+(i+1)+' 艘船'),type:t,hull:a[p+2],maxHull:a[p+3],turn:a[p+4],power:a[p+5],crew:v.getUint16(p,true),guns:a[p+6],gunCapacity:a[q+17],crewCapacity:v.getUint16(q+18,true),cargo:v.getUint16(q+20,true),token:hex(a.slice(p,p+9))+hex(a.slice(q,q+22))});
  }
  const members=[character],roster=a.slice(d+0x220e,d+0x220e+30);
  for(const id of roster){if(id===255)continue;num(id,0,120);if(!members.includes(id))members.push(id);}
  for(const id of members){
   const p=d+0x6a9+id*50;if(a[p+44]!==fleet)fail('海员名册与所属船队不一致');
   const s={id,name:readable(a.slice(p,p+13),id===character?'主角':'海员 #'+id),role:id===character?'主角':['未任职','提督','船长','大副','会计','测量士','航海士'][a[p+46]]||'海员',loyalty:a[p+43],skills:a[p+48]&31,token:hex(a.slice(p,p+50))};
   statKeys.forEach((key,i)=>s[key]=a[p+28+i]);sailors.push(s);
  }
  return {slot,character,ships,sailors};
 }
 function edit(a,slot,kind,id,changes,expected){
  if(!['ship','sailor'].includes(kind))fail('未知修改类别');
  const all=inspect(a,slot),current=all[kind==='ship'?'ships':'sailors'].find(x=>x.id===id);
  if(!current||!expected||expected.id!==id||current.token!==expected.token)fail('所选对象已变化，请重新读取');
  const defs=kind==='ship'?shipFields:sailorFields,n={...current};
  for(const [k,value] of Object.entries(changes)){if(!Object.hasOwn(defs,k))fail('不支持的修改项');num(value,defs[k][1],defs[k][2]);n[k]=value;}
  const out=a.slice(),v=view(out),{d,fleet}=context(a,slot);
  if(kind==='ship'){
   if(n.hull>n.maxHull)fail('当前耐久不能超过耐久上限');if(n.crew>n.crewCapacity)fail('水手人数不能超过水手舱位');if(n.guns>n.gunCapacity)fail('火炮数量不能超过炮舱容量');
   const p=d+0x2294+fleet*133+id*9,q=d+0x4c85+current.instance*22,s=d+0x46c7+id*30;
   const load=(v.getUint16(s,true)+v.getUint16(s+2,true))/10+v.getUint16(s+4,true)+v.getUint16(s+6,true)+[0,1,2,3,4].reduce((sum,i)=>sum+v.getUint16(s+12+i*2,true),0);
   if(Object.hasOwn(changes,'cargo')&&n.cargo<Math.ceil(load))fail('货舱容量不能小于现有货物和补给占用（'+Math.ceil(load)+'）');
   if(Object.hasOwn(changes,'guns')&&n.guns>0&&(a[p+8]&15)===0)fail('请先在造船厂安装火炮，再修改数量');
   const offsets={hull:[p+2,1],maxHull:[p+3,1],turn:[p+4,1],power:[p+5,1],crew:[p,2],guns:[p+6,1],type:[q+15,1],gunCapacity:[q+17,1],crewCapacity:[q+18,2],cargo:[q+20,2]};
   for(const key of Object.keys(changes)){const [off,size]=offsets[key];if(size===2)v.setUint16(off,n[key],true);else out[off]=n[key];}
   // The high nibble is the hull's visual model; the low nibble is material.
   if(Object.hasOwn(changes,'type'))out[q+16]=(a[d+0x4c85+(40+n.type)*22+16]&0xf0)|(a[q+16]&15);
  }else{
   const p=d+0x6a9+id*50;
   for(const [key,value] of Object.entries(changes)){const i=statKeys.indexOf(key);if(i>=0)out[p+28+i]=value;else if(key==='loyalty')out[p+43]=value;else out[p+48]=(a[p+48]&0xe0)|value;}
  }
  return out;
 }
 root.K2MobileFleet={inspect,edit,shipFields,sailorFields,skillNames,shipTypes:SHIPS};
 if(typeof module!=='undefined')module.exports=root.K2MobileFleet;
})(typeof window==='undefined'?globalThis:window);
