const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..'),web=path.join(root,'assets/web'),original=path.resolve(root,'../inspection/assets/web');
function write(file,s){fs.writeFileSync(path.join(web,file),s);}
function replace(s,a,b){if(!s.includes(a))throw Error('Expected upstream source missing: '+a.slice(0,80));return s.replace(a,b);}
for(const f of ['mobile-core.js','mobile-fleet.js','mobile-trainer-form.js','mobile-motion.js','mobile-navigation.js','mobile-ui.js','mobile.css'])fs.copyFileSync(path.join(root,'src',f),path.join(web,f));
write('build-info.json',JSON.stringify({versionName:'7.8-mobile.6.1',versionCode:7}));
let skin=fs.readFileSync(path.join(original,'approved-skin.js'),'utf8');
skin=replace(skin,'if(!c||!s||!fit)return;var r=s.nativeRect','if(!c||!s||!fit)return;if(window.K2Mobile?.positionCanvas(c,cropSafe))return;var r=s.nativeRect');write('approved-skin.js',skin);
let html=fs.readFileSync(path.join(original,'index.html'),'utf8').replace(/\s*<script src="\.\/pointerless-test.js[^\n]+\n/,'\n');
html=replace(html,'<title>大航海時代Ⅱ</title>','<title>大航海时代2</title>');
html=html.replace('<script type="module"','<script src="./mobile-core.js"></script>\n    <script src="./mobile-fleet.js"></script>\n    <script src="./mobile-trainer-form.js"></script>\n    <script src="./mobile-motion.js"></script>\n    <script src="./mobile-navigation.js"></script>\n    <script src="./mobile-ui.js"></script>\n    <link rel="stylesheet" href="./mobile.css">\n    <script type="module"');write('index.html',html);
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
`;
slots=replace(slots,'  var api={',bridge+'\n  var api={mobilePending:function(){return mobilePending;},mobileRead:mobileRead,mobileReplace:mobileReplace,mobileRestore:mobileRestore,');
slots=replace(slots,'m.emulatorSpeed!==1','(m.emulatorSpeed<1||m.emulatorSpeed>3)');
slots=replace(slots,'saved={ci:ci,cycles:m.cpuMax','saved={ci:ci,speed:window.K2Mobile?.state().speed??Math.round(m.emulatorSpeed*100),cycles:m.cpuMax');
slots=replace(slots,"activeReadSpeed=saved;","activeReadSpeed=saved;ci.sendBackendEvent({type:'wc-trigger-event',event:'speed:100'});");
slots=replace(slots,"'speed:100','cycles:'+saved.cycles","'speed:'+saved.speed,'cycles:'+saved.cycles");
slots=replace(slots,'m.emulatorSpeed===1&&m.fastForward===saved.fastForward','m.emulatorSpeed===saved.speed/100&&m.fastForward===saved.fastForward');write('dos_slots.js',slots);
let audio=fs.readFileSync(path.join(original,'boot-audio.js'),'utf8');
audio=replace(audio,'m.cpuMax===3000&&m.fastForward===false&&m.emulatorSpeed===1','(window.K2Mobile?.isPlayClock(m)??(m.cpuMax===3000&&m.fastForward===false&&m.emulatorSpeed===1))');write('boot-audio.js',audio);
let lifecycle=fs.readFileSync(path.join(original,'dos_lifecycle.js'),'utf8');
lifecycle=replace(lifecycle,"canSave=!window.__k2Booting","canSave=!window.K2Mobile?.state().panel&&!window.K2Slots?.mobilePending()&&!window.__k2Booting");
lifecycle=replace(lifecycle,'ci.unmute();paused=false;',"if(window.K2App?.muted)ci.mute();else ci.unmute();paused=false;window.K2Mobile?.resumeAudio();");write('dos_lifecycle.js',lifecycle);
// Preserve native menu entries now that direct touch is available.
write('dos_native_guard.js','window.K2NativeGuard={attach:function(){},observe:function(){},layout:function(){},state:function(){return {active:false};}};\n');
console.log('Prepared mobile web assets.');
