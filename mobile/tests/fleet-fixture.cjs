// Unit tests use generated records, never an embedded game/user save.
// Engine acceptance tests may explicitly supply a local Chinese start save.
// No roster/ownership or vessel-creation feature is shipped in the trainer.
const fs=require('fs');
module.exports=function(localSave){
 const b=localSave?new Uint8Array(fs.readFileSync(localSave)):new Uint8Array(328991),v=new DataView(b.buffer),d=32884;
 if(localSave){if(b.length!==328991||b[d+0x6a8]!==5||!b[16])throw Error('Engine test requires a local Chinese Al save in record 2.');}
 else{
  b[16]=49;b[d+0x6a8]=5;b.fill(255,d+0x220e,d+0x220e+30);
  for(let i=0;i<6;i++){
   const person=d+0x6a9+i*50,fleet=[0,10,30,50,40,20][i];b[person+44]=fleet;b.fill(60,person+28,person+36);b[person+36]=1;b[person+37]=1;
   for(let j=0;j<10;j++)b[d+0x2294+fleet*133+j*9+7]=255;
  }
  for(let type=0;type<25;type++){
   const q=d+0x4c85+(40+type)*22;b[q+15]=type;b[q+16]=((type%8)<<4)|2;b[q+17]=10;v.setUint16(q+18,30,true);v.setUint16(q+20,80,true);
  }
 }
 const p=d+0x2294+20*133,q=d+0x4c85,s=d+0x46c7;
 b.set([20,0,30,30,90,75,5,0,0x11],p);
 b.set(b.slice(q+45*22,q+46*22),q);b.fill(0,q,q+15);b.set(new TextEncoder().encode('QA SHIP'),q);
 v.setUint16(s,100,true);v.setUint16(s+2,200,true);
 const m=d+0x6a9+78*50;b[m+44]=20;b[m+46]=6;b[m+43]=100;
 b[d+0x220e]=78;b[d+0x220b]=6;
 return b;
};
