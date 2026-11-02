/* Field layout derived from Johan Li's DOS save editor (MIT; see release-docs/JohanLi-MIT.txt).
 * Chinese DOS slot stride is 32884, not the English editor's 31944.
 * The active sailor is slot+0x611 (the byte before the sailor table),
 * not the English editor's header metadata. Verified with a Catalina save/load.
 * Only explicitly selected fields are changed; no equipment/ship/stat presets are applied.
 */
(function(root){
  'use strict';
  const FILE_SIZE=328991, HEADER=151, SLOT_SIZE=32884;
  function integer(n,min,max){if(!Number.isSafeInteger(n)||n<min||n>max)throw Error('数值必须是 '+min+'～'+max+' 的整数');return n;}
  function inspect(bytes,slot){
    if(!(bytes instanceof Uint8Array)||bytes.length!==FILE_SIZE)throw Error('存档版本不匹配，未修改');
    integer(slot,1,10);const h=1+(slot-1)*15,b=HEADER+(slot-1)*SLOT_SIZE,id=bytes[b+0x611];
    if(!bytes.slice(h,h+12).some(x=>x!==0&&x!==32))throw Error('此记录为空，请先在游戏里保存');
    integer(id,0,5);const v=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength),f=b+0x5b6+id*14;
    return {slot,character:id,money:v.getUint32(b+0x60a,true),trade:v.getUint16(f,true),piracy:v.getUint16(f+2,true),adventure:v.getUint16(f+4,true)};
  }
  function edit(bytes,slot,changes,expected){
    const current=inspect(bytes,slot),out=bytes.slice(),v=new DataView(out.buffer),b=HEADER+(slot-1)*SLOT_SIZE,f=b+0x5b6+current.character*14;
    if(!expected||Object.keys(current).some(k=>current[k]!==expected[k]))throw Error('记录已变化，请重新打开修改器');
    const offsets={money:b+0x60a,trade:f,piracy:f+2,adventure:f+4};
    for(const [key,value] of Object.entries(changes)){
      if(!Object.hasOwn(offsets,key))throw Error('不支持的修改项');integer(value,0,key==='money'?600000000:50000);
      if(key==='money')v.setUint32(offsets[key],value,true);else v.setUint16(offsets[key],value,true);
    }return out;
  }
  function position(x,y,r){return {x:Math.max(0,Math.min(1,(x-r.left)/r.width)),y:Math.max(0,Math.min(1,(y-r.top)/r.height*480/440))};}
  function direction(dx,dy,eight,dead=12){if(Math.hypot(dx,dy)<dead)return null;const names=eight?['north','northeast','east','southeast','south','southwest','west','northwest']:['north','east','south','west'];return names[(Math.round(Math.atan2(dx,-dy)/(2*Math.PI)*names.length)+names.length)%names.length];}
  const patchSpecs={food:{offset:0x1e2a9,before:[0x29,0x44,0x02],after:[0xeb,0x01,0x90]},water:{offset:0x1e35b,before:[0x29,0x04],after:[0xeb,0x00]}};
  function patchMain(bytes,options){
    if(bytes.length!==298561)throw Error('游戏程序版本不符');const out=bytes.slice();
    for(const [key,p] of Object.entries(patchSpecs)){if(!p.before.every((x,i)=>bytes[p.offset+i]===x))throw Error('补丁特征不匹配：'+key);if(options[key])out.set(p.after,p.offset);}return out;
  }
  let table;
  function crc(bytes){if(!table)table=Uint32Array.from({length:256},(_,i)=>{for(let k=0;k<8;k++)i=i&1?0xedb88320^(i>>>1):i>>>1;return i>>>0;});let c=-1;for(const b of bytes)c=table[(c^b)&255]^(c>>>8);return (c^-1)>>>0;}
  function zip(name,bytes){const n=new TextEncoder().encode(name),size=30+n.length+bytes.length,central=46+n.length,out=new Uint8Array(size+central+22),v=new DataView(out.buffer),sum=crc(bytes);
    v.setUint32(0,0x04034b50,true);v.setUint16(4,20,true);v.setUint32(14,sum,true);v.setUint32(18,bytes.length,true);v.setUint32(22,bytes.length,true);v.setUint16(26,n.length,true);out.set(n,30);out.set(bytes,30+n.length);
    v.setUint32(size,0x02014b50,true);v.setUint16(size+4,20,true);v.setUint16(size+6,20,true);v.setUint32(size+16,sum,true);v.setUint32(size+20,bytes.length,true);v.setUint32(size+24,bytes.length,true);v.setUint16(size+28,n.length,true);out.set(n,size+46);const e=size+central;v.setUint32(e,0x06054b50,true);v.setUint16(e+8,1,true);v.setUint16(e+10,1,true);v.setUint32(e+12,central,true);v.setUint32(e+16,size,true);return out;}
  function viewport(width,height,cropped,insets={},fill=false){const x=insets.x||0,y=insets.y||0,w=insets.width||width,h=Math.max(1,(insets.height||height)),active=cropped?400:480,scale=Math.min(w/640,h/active);if(fill){const sy=h/active;return {left:x,top:y-(cropped?40*sy:0),width:w,height:480*sy,crop:cropped?40*sy:0};}return {left:x+(w-640*scale)/2,top:y+(h-active*scale)/2-(cropped?40*scale:0),width:640*scale,height:480*scale,crop:cropped?40*scale:0};}
  function gesture(p,x,y,now,threshold=22){const distance=Math.hypot(x-p.x,y-p.y);return {drag:!!p.moved||distance>=threshold,tap:!p.moved&&distance<threshold&&now-p.at<=450};}
  root.K2MobileCore={inspect,edit,position,direction,viewport,gesture,patchMain,zip,crc,FILE_SIZE};
  if(typeof module!=='undefined')module.exports=root.K2MobileCore;
})(typeof window==='undefined'?globalThis:window);
