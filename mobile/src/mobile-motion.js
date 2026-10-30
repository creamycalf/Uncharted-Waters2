(function(root){'use strict';
 const codes={north:265,east:262,south:264,west:263},seaCodes={northwest:55,north:56,northeast:57,west:52,east:54,southwest:49,south:50,southeast:51};
 function steering(send,{setTimer=setTimeout,clearTimer=clearTimeout,rate=()=>1,active=()=>true}={}){
  let name=null,pressed=null,nextTimer=null,upTimer=null,generation=0;
  function up(){if(pressed!==null){send(pressed,false);pressed=null;}}
  function stop(){generation++;clearTimer(nextTimer);clearTimer(upTimer);nextTimer=upTimer=null;up();name=null;}
  function set(next,sea=false){if(next===name)return;const changing=name!==null;stop();if(!next)return;const code=(sea?seaCodes:codes)[next];if(!code)return;name=next;const token=generation;
   function pulse(){if(token!==generation)return;if(!active()){stop();return;}pressed=code;send(code,true);upTimer=setTimer(()=>{if(token===generation)up();},Math.max(18,35/rate()));nextTimer=setTimer(pulse,Math.max(80,220/rate()));}
   if(changing)nextTimer=setTimer(pulse,24);else pulse();
  }
  return {set,stop,state:()=>({heading:name,pressed})};
 }
 root.K2MobileMotion={steering,codes,seaCodes};if(typeof module!=='undefined')module.exports=root.K2MobileMotion;
})(typeof window==='undefined'?globalThis:window);
