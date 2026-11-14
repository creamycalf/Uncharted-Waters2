const fs=require('fs'),path=require('path'),crypto=require('crypto');
const root=path.resolve(__dirname,'..'),web=path.join(root,'assets/web'),original=path.resolve(root,'../inspection/assets/web');
function write(file,s){fs.writeFileSync(path.join(web,file),s);}
function replace(s,a,b){if(!s.includes(a))throw Error('Expected upstream source missing: '+a.slice(0,80));return s.replace(a,b);}
const projection=path.join(web,'world-projection.json');
if(fs.existsSync(projection)){
 const digest=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
 if(digest(projection)!=='e166c3d5f02bbe970ce4c1d038e6b3271fb721af12e6fbd66aba536540182a75'||digest(path.join(web,'approved/assets/2994492343631e4572662c27.webp'))!=='2994492343631e4572662c274afc70515c674f09cdcaca81e65377e9835976ee')throw Error('Chart projection or map artwork does not match upstream v8.9');
}
for(const f of ['mobile-core.js','mobile-extras.js','guide.html','guide-data.js','guide-app.js','mobile-fleet.js','mobile-trainer-form.js','mobile-motion.js','mobile-navigation.js','mobile-market-core.js','mobile-market.js','mobile-transfer-core.js','port-goods.json','port-goods-simplified.json','mobile-ui.js','mobile-hardware.js','mobile.css'])fs.copyFileSync(path.join(root,'src',f),path.join(web,f));
write('build-info.json',JSON.stringify({versionName:'7.8-mobile.0.9.16-input-test',versionCode:29}));
let skin=fs.readFileSync(path.join(original,'approved-skin.js'),'utf8');
// Fill the viewport with art while keeping buttons/text in their original safe layout.
skin=replace(skin,'f=place(start,d[0],d[1]);','f=fitFor(d[0],d[1]);[startControls,footer].forEach(function(el){el.style.width=d[0]+"px";el.style.height=d[1]+"px";el.style.transform="translate("+f.x+"px,"+f.y+"px) scale("+f.scale+")";});');
skin=replace(skin,'function show(){slideMode=mode();startArt.src=startupBackground();','function show(){slideMode=mode();startArt.src=startupBackground();document.documentElement.style.setProperty("--mobile-loading-art","url("+JSON.stringify(startArt.src)+")");');
skin=replace(skin,'if(!c||!s||!fit)return;var r=s.nativeRect','if(!c||!s||!fit)return;if(window.K2Mobile?.positionCanvas(c,cropSafe))return;var r=s.nativeRect');write('approved-skin.js',skin);
let html=fs.readFileSync(path.join(original,'index.html'),'utf8').replace(/\s*<script src="\.\/pointerless-test.js[^\n]+\n/,'\n');
html=replace(html,'<title>大航海時代Ⅱ</title>','<title>大航海时代2</title>');
html=html.replace('<script type="module"','<script src="./mobile-core.js"></script>\n    <script src="./mobile-extras.js"></script>\n    <script src="./mobile-fleet.js"></script>\n    <script src="./mobile-trainer-form.js"></script>\n    <script src="./mobile-motion.js"></script>\n    <script src="./mobile-navigation.js"></script>\n    <script src="./mobile-market-core.js"></script>\n    <script src="./mobile-market.js"></script>\n    <script src="./mobile-transfer-core.js"></script>\n    <script src="./mobile-ui.js"></script>\n    <script src="./mobile-hardware.js"></script>\n    <link rel="stylesheet" href="./mobile.css">\n    <script type="module"');write('index.html',html);
let app=fs.readFileSync(path.join(original,'assets/index-CJvV899a.js'),'utf8');
app=replace(app,'const r=[c];f&&r.push(f);','const r=[c];r.push(await window.K2Mobile.bootOverlay());f&&r.push(f);');
app=replace(app,'window.K2UI?.observeFrame(H,i.width,i.height)','window.K2Mobile.observeFrame(H,i.width,i.height)');write('assets/index-CJvV899a.js',app);
let slots=fs.readFileSync(path.join(original,'dos_slots.js'),'utf8');
const bridge=`
  var mobilePending=false;
  window.addEventListener('k2:load-complete',function(){mobilePending=false;});
  async function mobileRead(){await window.__slotsReady;if(initError)throw Error(initError);if(busy||writing)throw Error('原作存档操作进行中');if(window.__ci&&!window.__k2Booting)await flush();return data.slice();}
  async function mobileReplace(expected,next,restoringBackup){
    validate(expected);validate(next);const current=await mobileRead();if(!same(current,expected))throw Error('存档已发生变化，请重新打开修改器');
    const ci=window.__ci;if(ci&&window.__k2Booting)throw Error('游戏正在启动');busy=true;
    try{
      if(!restoringBackup)await commit([['mobile-trainer-backup',encode(current)]]);
      if(ci)await ci.fsWriteFile('KOUKAI2.DAT',next.slice());
      await store(next);mobilePending=true;return true;
    }catch(e){try{if(ci===window.__ci&&ci)await ci.fsWriteFile('KOUKAI2.DAT',current.slice());await store(current);}catch(rollback){throw Error('写入失败且回滚未完成，请保留备份：'+rollback.message);}throw e;
    }finally{busy=false;}
  }
  async function mobileRestore(){const saved=await read('mobile-trainer-backup');if(!saved)throw Error('还没有修改前备份');return mobileReplace(await mobileRead(),validate(decode(saved)),true);}
  async function transferReplace(expected,next,restoringBackup){
    validate(expected);validate(next);const current=await mobileRead();if(!same(current,expected))throw Error('本机存档已变化，请重新选择文件');
    const ci=window.__ci;if(ci&&window.__k2Booting)throw Error('游戏正在启动');let touched=false;busy=true;
    try{
      if(!restoringBackup){const backup=JSON.stringify({version:1,dat:encode(current),crc:crc(current)});await commit([['mobile-transfer-backup-v1',backup]]);const saved=JSON.parse(await read('mobile-transfer-backup-v1')),bytes=decode(saved.dat);if(saved.version!==1||crc(bytes)!==saved.crc||!same(bytes,current))throw Error('导入前备份校验失败');}
      if(ci){touched=true;await ci.fsWriteFile('KOUKAI2.DAT',next.slice());if(!same(new Uint8Array(await ci.fsReadFile('KOUKAI2.DAT')),next))throw Error('游戏文件回读不一致');}
      touched=true;await store(next);const persisted=JSON.parse(await read(KEY));if(!persisted||!same(decode(persisted.dat),next))throw Error('本机记录回读不一致');mobilePending=true;return true;
    }catch(e){if(!touched)throw e;try{if(ci===window.__ci&&ci){await ci.fsWriteFile('KOUKAI2.DAT',current.slice());if(!same(new Uint8Array(await ci.fsReadFile('KOUKAI2.DAT')),current))throw Error('游戏文件回滚校验失败');}await store(current);const restored=JSON.parse(await read(KEY));if(!restored||!same(decode(restored.dat),current))throw Error('本机记录回滚校验失败');}catch(rollback){mobilePending=true;throw Error('写入失败且回滚未完成，请恢复导入前备份：'+rollback.message);}throw e;
    }finally{busy=false;}
  }
  async function transferRestore(){await window.__slotsReady;if(initError)throw Error(initError);const raw=await read('mobile-transfer-backup-v1');if(!raw)throw Error('还没有导入前备份');let saved,bytes;try{saved=JSON.parse(raw);bytes=validate(decode(saved.dat));if(saved.version!==1||crc(bytes)!==saved.crc)throw Error();}catch(e){throw Error('导入前备份损坏，未替换当前记录');}return transferReplace(await mobileRead(),bytes,true);}
`;
slots=replace(slots,'  var api={',bridge+'\n  var api={mobilePending:function(){return mobilePending;},mobileRead:mobileRead,mobileReplace:mobileReplace,mobileRestore:mobileRestore,transferReplace:transferReplace,transferRestore:transferRestore,');
slots=replace(slots,'function closeDialog(resume,result){if(!dialog||busy)return;',"function closeDialog(resume,result){if(!dialog||busy)return;window.dispatchEvent(new CustomEvent('k2:transfer-picker-closed',{detail:{loaded:!!result}}));");
slots=replace(slots,'m.emulatorSpeed!==1','(m.emulatorSpeed<1||m.emulatorSpeed>3)');
slots=replace(slots,'saved={ci:ci,cycles:m.cpuMax','saved={ci:ci,speed:window.K2Mobile?.state().speed??Math.round(m.emulatorSpeed*100),cycles:m.cpuMax');
slots=replace(slots,"activeReadSpeed=saved;","activeReadSpeed=saved;ci.sendBackendEvent({type:'wc-trigger-event',event:'speed:100'});");
slots=replace(slots,"'speed:100','cycles:'+saved.cycles","'speed:'+saved.speed,'cycles:'+saved.cycles");
slots=replace(slots,'m.emulatorSpeed===1&&m.fastForward===saved.fastForward','m.emulatorSpeed===saved.speed/100&&m.fastForward===saved.fastForward');write('dos_slots.js',slots);
let audio=fs.readFileSync(path.join(original,'boot-audio.js'),'utf8');
audio=replace(audio,'m.cpuMax===3000&&m.fastForward===false&&m.emulatorSpeed===1','(window.K2Mobile?.isPlayClock(m)??(m.cpuMax===3000&&m.fastForward===false&&m.emulatorSpeed===1))');write('boot-audio.js',audio);
let lifecycle=fs.readFileSync(path.join(original,'dos_lifecycle.js'),'utf8');
lifecycle=replace(lifecycle,'if(hidden||!window.__ci)return;','if(hidden||!window.__ci||window.K2Mobile?.state().transfer)return;');
lifecycle=replace(lifecycle,"canSave=!window.__k2Booting","canSave=!window.K2Mobile?.state().panel&&!window.K2Slots?.mobilePending()&&!window.__k2Booting");
lifecycle=replace(lifecycle,'ci.unmute();paused=false;',"if(window.K2App?.muted)ci.mute();else ci.unmute();paused=false;window.K2Mobile?.resumeAudio();");write('dos_lifecycle.js',lifecycle);
// Preserve native menu entries now that direct touch is available.
write('dos_native_guard.js','window.K2NativeGuard={attach:function(){},observe:function(){},layout:function(){},state:function(){return {active:false};}};\n');
console.log('Prepared mobile web assets.');

require('./prepare-catalog.cjs');
