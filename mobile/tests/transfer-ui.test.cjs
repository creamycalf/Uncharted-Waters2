const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

function fixture() {
  const source=fs.readFileSync(require.resolve('../src/mobile-ui.js'),'utf8');
  const code=source.slice(source.indexOf(' function transferNote('),source.indexOf(' async function open(){'));
  const nodes={};for(const name of ['.transfer-note','.transfer-confirm','.transfer-load','.transfer-import','.transfer-export','.transfer-share','.transfer-preview'])nodes[name]={textContent:'',hidden:false,disabled:false};
  const panel={hidden:false,removed:false,remove(){this.removed=true;},querySelector:s=>nodes[s],querySelectorAll:()=>Object.values(nodes)};
  let writes=0,opened=0,exported='',shared='',paused=0;const events={};
  const existing=Uint8Array.from([1,2,3]), incoming=Uint8Array.from([4,5,6]);
  const ctx={Uint8Array,Promise,Error,setTimeout:fn=>fn(),addEventListener:(name,fn)=>{events[name]=fn;},release(){},owner:{pause(){paused++;}},working:false,transferOpen:true,transferNeedsReload:false,transferCandidate:null,transferNative:null,transferRestoreArmed:false,transferPicking:false,verified:true,panel,
    window:{K2Lifecycle:{state:()=>({saving:false})},K2Slots:{isBusy:()=>false,open:async()=>true,mobileRead:async()=>existing.slice(),list:()=>[{record:2,filled:true}],mobilePending:()=>false,transferReplace:async(old,next)=>{assert.deepEqual(old,existing);assert.deepEqual(next,incoming);writes++;}},
      K2TransferCore:{pack:async()=>'{exported}',unpack:async payload=>{if(payload!=='valid')throw Error('校验失败');return {bytes:incoming,records:[{record:1},{record:3}]};}},Android:{importSave(){opened++;},exportSave(s){exported=s;},shareSave(s){shared=s;}}}};
  vm.createContext(ctx);vm.runInContext(code+';installTransferListeners();globalThis.api={transferImport,transferExport,transferApply,transferLoad,nativeResult:transferNativeResult};',ctx);
  return {ctx,nodes,panel,events,paused:()=>paused,writes:()=>writes,opened:()=>opened,exported:()=>exported,shared:()=>shared};
}

test('import selection previews both devices and changes nothing until confirmed',async()=>{
  const f=fixture();await f.ctx.api.transferImport();assert.equal(f.opened(),1);
  await f.ctx.api.nativeResult('import','ok','valid');assert.equal(f.writes(),0);
  assert.match(f.nodes['.transfer-preview'].textContent,/记录：1、3/);assert.match(f.nodes['.transfer-preview'].textContent,/本机现有记录：2/);
  assert.equal(f.nodes['.transfer-confirm'].hidden,false);
  await f.ctx.api.transferApply();assert.equal(f.writes(),1);assert.equal(f.ctx.transferNeedsReload,true);
});

test('cancelled or invalid import never replaces records',async()=>{
  const f=fixture();await f.ctx.api.transferImport();await f.ctx.api.nativeResult('import','cancelled','');assert.equal(f.writes(),0);
  await f.ctx.api.transferImport();await f.ctx.api.nativeResult('import','ok','invalid');assert.equal(f.writes(),0);assert.match(f.nodes['.transfer-note'].textContent,/校验失败/);
});

test('export passes a packed snapshot to the native picker and never writes records',async()=>{
  const f=fixture();await f.ctx.api.transferExport();assert.equal(f.exported(),'{exported}');assert.equal(f.writes(),0);
  await f.ctx.api.nativeResult('export','ok','');assert.match(f.nodes['.transfer-note'].textContent,/导出完成/);
});

test('cancelling the required reload returns to the protected transfer panel',async()=>{
  const f=fixture();await f.ctx.api.transferImport();await f.ctx.api.nativeResult('import','ok','valid');await f.ctx.api.transferApply();
  await f.ctx.api.transferLoad();assert.equal(f.panel.hidden,true);
  f.events['k2:transfer-picker-closed']({detail:{loaded:false}});
  assert.equal(f.panel.hidden,false);assert.equal(f.ctx.transferNeedsReload,true);assert.equal(f.paused(),1);
  await f.ctx.api.transferLoad();f.events['k2:transfer-picker-closed']({detail:{loaded:true}});f.events['k2:load-complete']();
  assert.equal(f.panel.removed,true);assert.equal(f.ctx.transferNeedsReload,false);assert.equal(f.ctx.transferOpen,false);
});

test('sharing sends a packed snapshot to the Android chooser without writing records',async()=>{const f=fixture();await f.ctx.api.transferExport(true);assert.equal(f.shared(),'{exported}');assert.equal(f.writes(),0);await f.ctx.api.nativeResult('share','ok','');assert.match(f.nodes['.transfer-note'].textContent,/在云盘确认上传结果/);});

test('sharing failure leaves saves unchanged and reports the share error',async()=>{const f=fixture();await f.ctx.api.transferExport(true);await f.ctx.api.nativeResult('share','error','无法打开系统分享界面');assert.equal(f.writes(),0);assert.match(f.nodes['.transfer-note'].textContent,/未分享/);});
