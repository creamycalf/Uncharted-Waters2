(function(){
 'use strict';
 window.K2MobileTrainerForm=function(panel,notify){
  const C=K2MobileCore,F=K2MobileFleet,fields=panel.querySelector('.mobile-fields'),categories=panel.querySelector('.mobile-categories'),entity=panel.querySelector('.mobile-entity');
  let raw,slot,base,fleet,error='',kind='basic',selected={ship:null,sailor:null},draft=new Map();
  const basic={money:['金钱（金币）',0,600000000],trade:['交易声望',0,50000],piracy:['海盗声望',0,50000],adventure:['冒险声望',0,50000]};
  function button(text,fn){const b=document.createElement('button');b.type='button';b.textContent=text;b.onclick=fn;return b;}
  function row(text,input){const r=document.createElement('label');r.className='mobile-row';const s=document.createElement('span');s.textContent=text;r.append(s,input);return r;}
  function object(){return kind==='basic'?base:fleet?.[kind==='ship'?'ships':'sailors'].find(x=>x.id===selected[kind]);}
  function key(){return kind+':'+(kind==='basic'?0:selected[kind]);}
  function pending(){return [...draft.values()].reduce((sum,d)=>sum+Object.keys(d.changes).length,0);}
  function changed(field,value){const obj=object(),id=key();if(!draft.has(id))draft.set(id,{kind,id:obj.id,expected:obj,changes:{}});const d=draft.get(id);if(String(value)===String(obj[field]))delete d.changes[field];else d.changes[field]=value;notify(pending()?'已暂存 '+pending()+' 项修改；切换分类会保留，点击“备份并应用”一起保存。':'数值没有变化。');}
  function patch(changes){for(const [field,value] of Object.entries(changes))changed(field,value);render();}
  function render(){
   fields.replaceChildren();entity.replaceChildren();for(const b of categories.children){b.setAttribute('aria-pressed',String(b.dataset.kind===kind));}
   const list=kind==='ship'?fleet?.ships:fleet?.sailors;
   if(kind!=='basic'){
    if(error||!list?.length){const p=document.createElement('p');p.textContent=error||(kind==='ship'?'此记录中还没有船只。取得船只后保存，再打开修改器。':'此记录中没有可修改的海员。');entity.append(p);return;}
    if(!list.some(x=>x.id===selected[kind]))selected[kind]=list[0].id;
    const sel=document.createElement('select');sel.setAttribute('aria-label',kind==='ship'?'选择船只':'选择海员');
    for(const o of list){const option=document.createElement('option');option.value=o.id;option.textContent=kind==='ship'?o.name+' · '+F.shipTypes[o.type]:(o.id===fleet.character?'主角':o.name+' · '+o.role)+'（航海 '+o.navigationLevel+' / 战斗 '+o.battleLevel+'）';sel.append(option);}
    sel.value=selected[kind];sel.onchange=()=>{selected[kind]=Number(sel.value);render();};entity.append(row(kind==='ship'?'选择船只':'选择海员',sel));
    const help=document.createElement('p');help.className='mobile-form-help';help.textContent=kind==='ship'?'只修改所选船。换船型保留现有性能和舱位，可分别调整；原游戏重新改造船舱时会按船型重新计算。':'包含主角与已加入的海员。按职务、等级和编号区分；原游戏姓名、雇佣关系与剧情数据保持原样。';entity.append(help);
   }
   const obj=object();if(!obj)return;const values={...obj,...draft.get(key())?.changes},defs=kind==='basic'?basic:kind==='ship'?F.shipFields:F.sailorFields;
   for(const [field,[label,min,max]] of Object.entries(defs)){
    if(field==='skills'){
     const box=document.createElement('fieldset');box.className='mobile-skills';const legend=document.createElement('legend');legend.textContent='海员技能';box.append(legend);
     F.skillNames.forEach((name,i)=>{const input=document.createElement('input');input.type='checkbox';input.name='skill-'+i;input.checked=!!(values.skills&(1<<i));input.onchange=()=>{const mask=[...box.querySelectorAll('input')].reduce((m,x,j)=>m|(x.checked?1<<j:0),0);changed('skills',mask);};box.append(row(name,input));});fields.append(box);continue;
    }
    let input;if(field==='type'){input=document.createElement('select');F.shipTypes.forEach((name,i)=>{const op=document.createElement('option');op.value=i;op.textContent=name+'（'+i+'）';input.append(op);});input.onchange=()=>changed(field,Number(input.value));}
    else{input=document.createElement('input');input.type='number';input.inputMode='numeric';input.min=min;input.max=max;input.step=1;input.oninput=()=>changed(field,input.value);}
    input.name=field;input.value=values[field];fields.append(row(label,input));
   }
   if(kind!=='basic'){
    const actions=document.createElement('div');actions.className='mobile-presets';
    if(kind==='ship')actions.append(button('修复到耐久上限',()=>patch({hull:Number(draft.get(key())?.changes.maxHull??obj.maxHull)})),button('水手补至舱位',()=>patch({crew:Number(draft.get(key())?.changes.crewCapacity??obj.crewCapacity)})));
    else actions.append(button('八项能力设为 100',()=>patch(Object.fromEntries(Object.keys(F.sailorFields).slice(0,8).map(k=>[k,100])))),button('学会全部技能',()=>patch({skills:31})));
    fields.append(actions);
   }
  }
  for(const [k,label] of [['basic','金钱与声望'],['ship','船只与水手'],['sailor','海员能力']]){const b=button(label,()=>{kind=k;render();});b.dataset.kind=k;categories.append(b);}
  function load(bytes,record){raw=bytes;slot=record;draft.clear();base=C.inspect(raw,slot);error='';try{fleet=F.inspect(raw,slot);}catch(e){fleet=null;error=e.message+'，船只与海员编辑已关闭。';}render();}
  function build(){let next=raw;for(const d of draft.values()){
   if(!Object.keys(d.changes).length)continue;const changes={};for(const [k,v] of Object.entries(d.changes)){if(String(v).trim()==='')throw Error('请输入完整数值');changes[k]=Number(v);}
   next=d.kind==='basic'?C.edit(next,slot,changes,d.expected):F.edit(next,slot,d.kind,d.id,changes,d.expected);
  }return {next,count:pending()};}
  function clear(){draft.clear();base=null;fleet=null;fields.replaceChildren();entity.replaceChildren();}
  return {load,build,clear};
 };
})();
