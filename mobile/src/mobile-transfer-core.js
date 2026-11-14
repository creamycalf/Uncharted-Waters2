(function (root) {
  'use strict';
  var FILE_SIZE=328991, HEADER=151, SIZE=32884, MAX_TEXT=700000;
  var GAME='76ab2f81a465b393313831ac81f7ff7b8d450b87b2fae06886b0a8740f3c0281';
  function summary(bytes) {
    if (!(bytes instanceof Uint8Array) || bytes.length!==FILE_SIZE) throw Error('记录文件长度不符，未修改本机存档');
    var slots=[];
    for (var n=1;n<=10;n++) {
      var raw=bytes.subarray(1+(n-1)*15,1+(n-1)*15+12), str=String.fromCharCode.apply(null,raw).replace(/\0.*$/,'').trim();
      if (!str) continue;
      var hero=bytes[HEADER+(n-1)*SIZE+0x611];
      if (hero>5) throw Error('记录 '+n+' 的游戏版本不匹配，未修改本机存档');
      slots.push({record:n,date:str.replace(/[^\x20-\x7e]/g,'?').slice(0,12)});
    }
    if (!slots.length) throw Error('没有找到可迁移的游戏记录，请先在游戏内保存');
    return slots;
  }
  function encode(bytes) { var out='';for(var i=0;i<bytes.length;i+=32768)out+=String.fromCharCode.apply(null,bytes.subarray(i,i+32768));return btoa(out); }
  function decode(text) { var raw;try{raw=atob(text);}catch(e){throw Error('存档文件内容损坏');}if(raw.length!==FILE_SIZE)throw Error('记录文件长度不符，未修改本机存档');var out=new Uint8Array(raw.length);for(var i=0;i<raw.length;i++)out[i]=raw.charCodeAt(i);return out; }
  async function digest(bytes){var hash=await root.crypto.subtle.digest('SHA-256',bytes);return Array.from(new Uint8Array(hash),function(n){return n.toString(16).padStart(2,'0');}).join('');}
  async function pack(bytes) {
    var records=summary(bytes), hash=await digest(bytes), created=new Date().toISOString();
    return JSON.stringify({format:'uw2-save-transfer',version:1,game:GAME,createdAt:created,sha256:hash,data:encode(bytes)});
  }
  async function unpack(text) {
    if(typeof text!=='string'||text.length>MAX_TEXT)throw Error('存档文件太大或格式不符');
    var file;try{file=JSON.parse(text);}catch(e){throw Error('无法读取存档转移文件');}
    if(!file||file.format!=='uw2-save-transfer'||file.version!==1||file.game!==GAME||typeof file.data!=='string'||typeof file.sha256!=='string'||!/^[0-9a-f]{64}$/.test(file.sha256))throw Error('不是本应用支持的存档转移文件');
    if(file.data.length!==Math.ceil(FILE_SIZE/3)*4)throw Error('存档内容长度不符');
    var bytes=decode(file.data), records=summary(bytes);
    if(await digest(bytes)!==file.sha256)throw Error('存档校验失败，未修改本机存档');
    return {bytes:bytes,records:records,createdAt:typeof file.createdAt==='string'?file.createdAt.slice(0,32):''};
  }
  root.K2TransferCore={pack:pack,unpack:unpack,summary:summary,FILE_SIZE:FILE_SIZE};
  if(typeof module!=='undefined'&&module.exports)module.exports=root.K2TransferCore;
})(typeof window==='undefined'?globalThis:window);
