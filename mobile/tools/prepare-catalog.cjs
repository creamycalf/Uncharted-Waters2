// GRAPH decoder adapted from JohanLi scripts/art/graph-format.ts (MIT).
const fs=require('fs'),path=require('path'),zlib=require('zlib'),cp=require('child_process'),C=require('../src/mobile-core.js');
const root=path.resolve(__dirname,'../..'),dir=path.join(root,'inspection/game-check');
cp.execFileSync('tar',['-xf',path.join(root,'inspection/assets/web/game/bundle.zip'),'-C',dir,'GRAPH.DAT']);
const data=fs.readFileSync(path.join(dir,'GRAPH.DAT')),palette=[[0,0,0],[0,65,211],[211,65,0],[243,65,195],[0,162,97],[0,162,243],[243,162,0],[243,227,211],[113,113,146],[162,162,195],[211,113,65],[0,97,195],[0,97,97],[113,81,97],[162,113,81],[0,65,178]];
function decode(id){const start=data.readUInt32BE(id*4),end=data.readUInt32BE((id+1)*4),r=data.subarray(start,end),w=r.readUInt16LE(0),h=r.readUInt16LE(2),table=Array.from({length:8},(_,i)=>r.readUInt16LE(4+i*2)),words=new Uint16Array(160*h+168);let p=20;
 for(let y=0;y<h;y++){let out=y*160,left=Math.ceil(w/4);while(left>0){const cmd=r[p++];let n,value;if(cmd&128){n=(cmd&15)+1;let s=out-((cmd&64)?(((cmd>>4)&3)+1)*160:((cmd>>4)&3)+1);for(let i=0;i<n;i++)words[out++]=s<0?(s++,0):words[s++];}else{n=(cmd&7)+1;const mode=cmd&120;if(!mode)value=0;else if(cmd&64)value=table[(mode>>3)&7];else if(mode===56){value=r.readUInt16BE(p);p+=2;}else{const b=r[p++];value=[b,(b&15)|((b&240)<<4),(b&15)|((b&240)<<8),b<<4,((b&15)<<4)|((b&240)<<8),b<<8][(mode-8)>>3];}for(let i=0;i<n;i++)words[out++]=value;}left-=n;if(p>r.length)throw Error('Invalid GRAPH record');}}
 const raw=Buffer.alloc((w*3+1)*h);for(let y=0;y<h;y++)for(let x=0;x<w;x++){let color=0,word=words[y*160+(x>>2)],bit=3-(x%4);for(let k=0;k<4;k++)color|=((word>>(k*4+bit))&1)<<k;raw.set(palette[color],y*(w*3+1)+1+x*3);}return png(w,h,raw);}
function chunk(type,b){const t=Buffer.from(type),out=Buffer.alloc(b.length+12);out.writeUInt32BE(b.length);t.copy(out,4);b.copy(out,8);out.writeUInt32BE(C.crc(Buffer.concat([t,b])),b.length+8);return out;}
function png(w,h,raw){const header=Buffer.alloc(13);header.writeUInt32BE(w);header.writeUInt32BE(h,4);header[8]=8;header[9]=2;return Buffer.concat([Buffer.from('89504e470d0a1a0a','hex'),chunk('IHDR',header),chunk('IDAT',zlib.deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]);}
const out=path.join(root,'mobile/assets/web/catalog');fs.mkdirSync(out,{recursive:true});for(let i=0;i<25;i++)fs.writeFileSync(path.join(out,'ship-'+i+'.png'),decode(28+i));console.log('Prepared 25 original ship illustrations.');
// LS11 and planar decoding adapted from JohanLi (MIT): scripts/ls11 and shared.ts.
cp.execFileSync('tar',['-xf',path.join(root,'inspection/assets/web/game/bundle.zip'),'-C',dir,'KAO.LZW']);
const kao=fs.readFileSync(path.join(dir,'KAO.LZW')),facePalette=['000000','00A060','D04000','F0A060','0040D0','00A0F0','D060A0','F0E0D0'].map(x=>Buffer.from(x,'hex'));
if(!['LS10','LS11'].includes(kao.toString('ascii',0,4)))throw Error('Unknown portrait archive');
for(let id=0;id<6;id++){
 const entry=0x110+id*12,size=kao.readUInt32BE(entry+4);let bitAt=kao.readUInt32BE(entry+8)*8;
 if(size!==1920)throw Error('Unexpected protagonist portrait size');
 const bit=()=>{if(bitAt>=kao.length*8)throw Error('Truncated portrait');return (kao[bitAt>>3]>>(7-(bitAt++&7)))&1;};
 function code(){let m=1;while(bit()){if(++m>24)throw Error('Invalid portrait code');}let v=0;for(let k=0;k<m;k++)v=(v<<1)|bit();return v+(1<<m)-2;}
 const pixels=new Uint8Array(size);for(let p=0;p<size;){const value=code();if(value<256)pixels[p++]=kao[0x10+value];else{const distance=value-256,n=code()+3;if(distance<1||distance>p)throw Error('Invalid portrait reference');for(let k=0;k<n&&p<size;k++,p++)pixels[p]=pixels[p-distance];}}
 const raw=Buffer.alloc(80*(64*3+1));for(let p=0;p<5120;p++){let color=0;for(let plane=0;plane<3;plane++)color=(color<<1)|((pixels[(p>>3)*3+plane]>>(7-(p&7)))&1);raw.set(facePalette[color],Math.floor(p/64)*193+1+(p%64)*3);}
 fs.writeFileSync(path.join(out,'hero-'+id+'.png'),png(64,80,raw));
}console.log('Prepared six original protagonist portraits.');
