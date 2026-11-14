/*
 * Market memory observer and read-only panel, adapted from the GPL-2.0
 * frontend source distributed in upstream v8.9, chiefly world-position.js.
 * Upstream release: https://github.com/maxleolee-eng/Uncharted-Waters-2-Android/releases/tag/v8.9
 * See docs/upstream/licenses/GPL-2.0.txt and NOTICE.md for attribution.
 * Local changes add the compact Android panel and retain no game/save writes.
 */
(function () {
  'use strict';
  var nativeWorker = window.Worker, liveWorker = null, latest = null;
  var catalog = null, simplified = null, open = false, panel = null, body = null, rendered = null, mode = 'prices', selectedGood = null, sorting = 'near', selectedPort = null, searchTerm = '', projection = null, mapZoom = 1, mapScrollX = 0, mapScrollY = 0, mapCenter = null, initialFocusPending = false;
  function loadMapZoom(){try{var value=Number(localStorage.getItem('uw2-market-map-zoom'));return [1,2,4].includes(value)?value:1;}catch(_){return 1;}}
  function saveMapZoom(value){try{localStorage.setItem('uw2-market-map-zoom',String(value));}catch(_){}}
  mapZoom=loadMapZoom();
  var anchor = '0a080a0909080a0a0a090a0a0a0a0a0a08090a0a0a0a0a0a06070809090a090a040606070708090a06070809090a090a08090a0a0a0a0a0a0a090a0a0a0a0a0a0001010100ffffffffff0001010100ff';

  // Serialized into the classic DOSBox-X worker. Every guest-memory access is read-only.
  function readMarket(signature, createTradeCore) {
    var bytes = Uint8Array.from(signature.match(/../g), function (n) { return parseInt(n, 16); });
    var ds = -1, scan = 0, nextScan = 0, lastReady = false;
    var core = createTradeCore(), tradeSnapshot = null, quotes = null;

    function readTrade(memory, base, port) {
      if (port >= 100) return null;
      var economy = memory.subarray(base + 0x6a7e, base + 0x6a7e + 100 * 37);
      var markets = memory.subarray(base + 0x78f4, base + 0x78f4 + 13 * 128);
      var inventory = memory.subarray(base + 0x2e57, base + 0x2e57 + 20);
      var controllers = Uint8Array.from({length:100}, function (_, i) {
        return memory[base + 0x5f54 + 22 * i + 21] & 7;
      });
      var snapshot = {economy:economy, markets:markets, inventory:inventory, controllers:controllers};
      var fields = Object.keys(snapshot);
      if (!tradeSnapshot || fields.some(function (key) {
        return snapshot[key].some(function (byte, i) { return byte !== tradeSnapshot[key][i]; });
      })) {
        try {
          quotes = core.build(snapshot, Array.from(memory.subarray(base + 0x784, base + 0x78e)));
          tradeSnapshot = Object.fromEntries(fields.map(function (key) { return [key, snapshot[key].slice()]; }));
        } catch (error) {
          tradeSnapshot = quotes = null;
        }
      }
      if (!quotes) return null;
      var specialty = economy[port * 37 + 0x1c];
      var offer = quotes[port].offers.find(function (row) { return row.good === specialty; });
      return {specialty:specialty, specialtyRoute:offer ? core.bestRoute(quotes, port, offer) : null, top:core.topTwo(quotes, port), offers:quotes[port].offers, sales:quotes.map(function (q) { return q.sell; })};
    }

    function valid(memory, base) {
      if (base < 0 || base + 0xc2d6 >= memory.length) return null;
      for (var i = 0; i < bytes.length; i++) if (memory[base + 0x6d8 + i] !== bytes[i]) return null;
      var view = new DataView(memory.buffer, memory.byteOffset, memory.byteLength);
      // Traditional-Chinese MAIN layout: protagonist -> 50-byte sailor record -> fleet.
      var hero = memory[base + 0x12b5];
      if (hero >= 120) return null;
      var fleet = memory[base + 0x12b6 + hero * 50 + 0x2c];
      if (fleet >= 70) return null;
      var pointer = view.getUint16(base + 0xc2d4, true);
      if (pointer !== 0x2e76 + fleet * 133) return null;
      var x = view.getUint16(base + pointer, true), y = view.getUint16(base + pointer + 2, true);
      var year = memory[base + 0x532], month = memory[base + 0x533];
      var day = memory[base + 0x534], tick = memory[base + 0x535];
      var port = memory[base + 0xcae];
      if (x >= 2160 || y >= 1080 || year > 200 || month >= 12 || day >= 31 || tick >= 72 || (port >= 130 && port !== 255)) return null;
      return {port:port, x:x, y:y};
    }

    function locate(memory) {
      var end = memory.length - 0xc2d6, began = performance.now();
      while (scan < end && performance.now() - began < 2) {
        var at = memory.indexOf(bytes[0], scan + 0x6d8);
        if (at < 0) { scan = end; break; }
        scan = at - 0x6d8 + 1;
        var candidate = at - 0x6d8, value = valid(memory, candidate);
        if (value) { ds = candidate; scan = 0; return value; }
      }
      if (scan >= end) { scan = 0; nextScan = performance.now() + 1500; }
      return null;
    }

    function basePort(i) { return ds + 0x5f54 + i * 22; }
    function sample() {
      try {
        var memory = self.Module && self.Module.HEAPU8;
        if (!memory) return;
        var value = ds >= 0 ? valid(memory, ds) : null;
        if (!value) {
          ds = -1;
          if (lastReady) { self.postMessage({__k2Market:null}); lastReady = false; }
          if (performance.now() >= nextScan) value = locate(memory);
        }
        if (value) {
          lastReady = true;
          var view = new DataView(memory.buffer, memory.byteOffset, memory.byteLength);
          var ports = Array.from({length:130}, function (_, i) { var p = basePort(i); return {x:view.getUint16(p,true), y:view.getUint16(p+2,true)}; });
          if (ports.some(function (p) { return p.x >= 2160 || p.y >= 1080; })) ports = [];
          self.postMessage({__k2Market:{port:value.port, x:value.x, y:value.y, ports:ports, trade:readTrade(memory, ds, value.port)}});
        }
      } catch (error) {
        ds = -1; lastReady = false;
        self.postMessage({__k2Market:null});
      }
    }
    // Small bounded scan, sampled at 4 Hz like the upstream live observer.
    setInterval(sample, 250);
  }

  if (nativeWorker) {
    window.Worker = class extends nativeWorker {
      constructor(url, options) {
        var address = String(url);
        var supported = (!options || options.type !== 'module') && (address.startsWith('blob:') || /\/wdosbox-x\.js(?:[?#]|$)/.test(address));
        var wrapped = supported ? URL.createObjectURL(new Blob([
          'importScripts(' + JSON.stringify(address) + ');\n(' + readMarket.toString() + ')(' + JSON.stringify(anchor) + ', ' + window.K2TradeCore.toString() + ');'
        ], {type:'application/javascript'})) : null;
        super(wrapped || url, options);
        if (wrapped) {
          var worker = this;
          liveWorker = worker; latest = null; refresh();
          this.addEventListener('message', function (event) {
            if (!event.data || !Object.prototype.hasOwnProperty.call(event.data, '__k2Market')) return;
            event.stopImmediatePropagation();
            if (worker !== liveWorker) return;
            latest = event.data.__k2Market ? Object.assign({receivedAt:performance.now()}, event.data.__k2Market) : null;
            refresh();
          }, true);
          this.addEventListener('error', function () { if (worker === liveWorker) { latest = null; refresh(); } });
          setTimeout(function () { URL.revokeObjectURL(wrapped); }, 30000);
        }
      }
    };
  }

  function scene() { return window.K2UI && window.K2UI.state().scene; }
  function current() {
    if (!latest || performance.now() - latest.receivedAt > 2000 || !window.__ci || window.__k2Booting || window.K2Slots?.isOpen() || document.hidden || !['port','sea'].includes(scene())) return null;
    return latest;
  }
  function element(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function portName(index) { return simplified?.ports[index] || catalog?.ports[index] || ('港口 ' + (index + 1)); }
  function goodName(index) { return simplified?.goods[index] || catalog?.goods[index] || ('商品 ' + (index + 1)); }
  function routeCard(route, label) {
    var card = element('article', 'mobile-market-route');
    var heading = element('h3', '', (label ? label + ' · ' : '') + goodName(route.good));
    var details = element('p', '', portName(route.origin) + ' 买入 ' + route.buy + '　→　' + portName(route.destination) + ' 卖出 ' + route.sell);
    var margin = route.margin >= 0 ? '+' + route.margin : String(route.margin);
    var spread = element('strong', '', '每单位差价 ' + margin);
    card.append(heading, details, spread);
    return card;
  }
  function distance(a, b) {
    var dx = Math.abs(a.x-b.x); dx = Math.min(dx,2160-dx);
    return Math.round(Math.hypot(dx,a.y-b.y));
  }
  // Projection grid matches the original author's v8.9 world map artwork.
  function projected(x,y) {
    if (!projection) return [x/2160,y/1080];
    var cols=projection.columns, rows=projection.rows, grid=projection.grid;
    var xx=((x+projection.worldOffsetX)%2160+2160)%2160/2160*(cols-1), yy=Math.max(0,Math.min(1,y/1080))*(rows-1);
    var col=Math.min(cols-2,Math.floor(xx)), row=Math.min(rows-2,Math.floor(yy)), dx=xx-col, dy=yy-row, out=[0,0];
    for(var j=0;j<2;j++)for(var i=0;i<2;i++){var v=grid[(row+j)*cols+col+i], w=(i?dx:1-dx)*(j?dy:1-dy);out[0]+=v[0]*w;out[1]+=v[1]*w;}
    return [((out[0]%1)+1)%1,Math.max(0,Math.min(1,out[1]))];
  }
  function draw(value) {
    if (!body) return;
    body.replaceChildren();
    if (!value) { body.append(element('p','mobile-market-status','正在读取游戏状态，请稍候…')); return; }
    var layout=element('div','market-layout'), left=element('div','market-list'), right=element('div','market-map-column');
    var header=element('p','mobile-market-port',scene()==='port' && value.port<130 ? '当前港口：'+portName(value.port) : '当前位置：X '+value.x+' / Y '+value.y); left.append(header);
    var trade=scene()==='port' && value.port<100 ? value.trade : null;
    var offers=trade && trade.offers || [];
    if (offers.length && !offers.some(function(o){return o.good===selectedGood;})) selectedGood=(offers.find(function(o){return o.good===trade.specialty;})||offers[0]).good;
    var offer=offers.find(function(o){return o.good===selectedGood;});
    if (offers.length) {
      var select=element('select','market-good');select.setAttribute('aria-label','选择本港商品');select.dataset.marketGroup='controls';select.dataset.marketKey='good';
      offers.forEach(function(o){var option=element('option','',goodName(o.good)+' · 买入 '+o.price);option.value=o.good;option.selected=o.good===selectedGood;select.append(option);});
      select.onchange=function(){selectedGood=Number(select.value);rendered=null;render();};left.append(select);
    } else left.append(element('p','mobile-market-status',scene()==='sea'?'进入港口后可查看可购买商品。':'本港行情暂不可用。'));
    var search=element('input','market-search');search.type='search';search.placeholder='搜索港口';search.value=searchTerm;search.setAttribute('aria-label','搜索港口');search.dataset.marketGroup='controls';search.dataset.marketKey='search';left.append(search);
    var controls=element('div','mobile-market-nav');
    [['near','附近优先'],['profit','利润优先']].forEach(function(item){var button=element('button','',item[1]);button.type='button';button.setAttribute('aria-pressed',String(sorting===item[0]));button.dataset.marketGroup='controls';button.dataset.marketKey='sort-'+item[0];button.onclick=function(){sorting=item[0];rendered=null;render();};controls.append(button);});left.append(controls);
    var origin=value.ports[value.port] || {x:value.x,y:value.y};
    var rows=value.ports.map(function(p,i){var sale=trade && trade.sales[i] && offer ? trade.sales[i][offer.good] : null;return {destination:i,point:p,sell:sale,margin:sale===null?null:sale-offer.price,distance:distance(origin,p)};}).filter(function(row){return row.destination!==value.port;});
    rows.sort(sorting==='profit' && offer ? function(a,b){return (b.margin ?? -Infinity)-(a.margin ?? -Infinity)||a.distance-b.distance;} : function(a,b){return a.distance-b.distance;});
    var list=element('div','market-results');left.append(list);
    var mapbar=element('div','market-map-bar');mapbar.append(element('p','mobile-market-port',projection?'世界航海图':'世界港口坐标图'));
    var zoomout=element('button','market-zoom','−'), zoomin=element('button','market-zoom','+'), zoomtext=element('span','market-zoom-value',mapZoom+'×');
    zoomout.type=zoomin.type='button';zoomout.dataset.marketGroup=zoomin.dataset.marketGroup='map';zoomout.dataset.marketKey='zoom-out';zoomin.dataset.marketKey='zoom-in';zoomout.setAttribute('aria-label','缩小地图');zoomin.setAttribute('aria-label','放大地图');
    zoomout.disabled=mapZoom<=1;zoomin.disabled=mapZoom>=4;
    function changeZoom(next){var target=value.ports[selectedPort] || {x:value.x,y:value.y};mapCenter=projected(target.x,target.y);mapZoom=next;saveMapZoom(mapZoom);rendered=null;render();}
    zoomout.onclick=function(){changeZoom(Math.max(1,mapZoom/2));};
    zoomin.onclick=function(){changeZoom(Math.min(4,mapZoom*2));};
    mapbar.append(zoomout,zoomtext,zoomin);right.append(mapbar);
    var viewport=element('div','market-map-viewport');viewport.setAttribute('aria-label','可滚动航海图');
    var map=element('div','mobile-world-map');map.style.width=(mapZoom*100)+'%';map.setAttribute('aria-label',projection?'世界航海图':'世界港口坐标示意图');
    if(projection)map.classList.add('has-sea-chart');
    var dots=[];value.ports.forEach(function(p,i){var pos=projected(p.x,p.y),dot=element('button','mobile-world-dot');dot.type='button';dot.tabIndex=-1;dot.style.left=(pos[0]*100)+'%';dot.style.top=(pos[1]*100)+'%';dot.setAttribute('aria-label',portName(i));dot.title=portName(i);dot.onclick=function(){selectedPort=i;rendered=null;render();};map.append(dot);dots.push(dot);});
    var player=projected(value.x,value.y),marker=element('span','mobile-world-player');marker.style.left=(player[0]*100)+'%';marker.style.top=(player[1]*100)+'%';map.append(marker);
    var names=new Set();if(value.port<130)names.add(value.port);if(selectedPort!==null)names.add(selectedPort);
    names.forEach(function(i){var p=value.ports[i];if(!p)return;var pos=projected(p.x,p.y),name=element('span','market-map-label',portName(i));name.style.left=(pos[0]*100)+'%';name.style.top=(pos[1]*100)+'%';map.append(name);});
    if(selectedPort!==null && dots[selectedPort])dots[selectedPort].classList.add('selected');
    viewport.append(map);viewport.addEventListener('scroll',function(){mapScrollX=viewport.scrollLeft;mapScrollY=viewport.scrollTop;});right.append(viewport);
    var chosen=rows.find(function(r){return r.destination===selectedPort;});
    if(chosen){var detail=element('div','market-detail');detail.append(element('strong','',portName(chosen.destination)),element('p','',chosen.sell===null?'坐标 X '+chosen.point.x+' / Y '+chosen.point.y:'卖出 '+chosen.sell+'　每单位差价 '+(chosen.margin>=0?'+':'')+chosen.margin),element('p','','坐标距离 '+chosen.distance));right.append(detail);}
    right.append(element('p','mobile-market-caveat',projection?'使用原作者海图投影；可用 + / − 缩放并拖动查看。坐标距离并非实际航程。':'未找到海图投影，显示坐标示意；坐标距离并非实际航程。'));
    function updateList(){list.replaceChildren();var term=searchTerm.trim().toLowerCase();var filtered=rows.filter(function(r){return !term || portName(r.destination).toLowerCase().includes(term) || (catalog?.ports[r.destination] || '').toLowerCase().includes(term);});filtered.slice(0,term?30:12).forEach(function(row){var card=element('button','mobile-market-route market-route');card.type='button';card.dataset.marketGroup='results';card.dataset.marketKey='port-'+row.destination;card.setAttribute('aria-pressed',String(row.destination===selectedPort));card.append(element('strong','',portName(row.destination)+' · 坐标距离 '+row.distance),element('span','',row.sell===null?'坐标 X '+row.point.x+' / Y '+row.point.y:'卖出 '+row.sell+'　每单位差价 '+(row.margin>=0?'+':'')+row.margin));card.onclick=function(){selectedPort=row.destination;rendered=null;render();};list.append(card);});if(!filtered.length)list.append(element('p','mobile-market-status','没有找到匹配的港口。'));}
    search.oninput=function(){searchTerm=search.value;updateList();};updateList();layout.append(left,right);body.append(layout);
    if(mapCenter && viewport.clientWidth){mapScrollX=mapCenter[0]*map.clientWidth-viewport.clientWidth/2;mapScrollY=mapCenter[1]*map.clientHeight-viewport.clientHeight/2;mapCenter=null;}
    viewport.scrollLeft=mapScrollX;viewport.scrollTop=mapScrollY;
  }
  function render() {
    if (!open || !panel) return;
    var value = current(), key = value ? JSON.stringify({port:value.port,seaCell:scene()==='sea'?[Math.floor(value.x/64),Math.floor(value.y/64)]:null,trade:value.trade,mode:mode,selectedGood:selectedGood,sorting:sorting,selectedPort:selectedPort,mapZoom:mapZoom,hasProjection:!!projection}) : 'empty|' + scene() + '|' + !!window.__ci;
    if (key !== rendered) { var active=panel.contains(document.activeElement)?document.activeElement:null, focusKey=active?.dataset?.marketKey; rendered = key; draw(value); if(focusKey){var restored=Array.from(panel.querySelectorAll('[data-market-key]')).find(function(e){return e.dataset.marketKey===focusKey&&!e.disabled;});if(!restored&&active.dataset.marketGroup)restored=Array.from(panel.querySelectorAll('[data-market-group]')).find(function(e){return e.dataset.marketGroup===active.dataset.marketGroup&&!e.disabled;});if(restored)focusMarket(restored);}else if(initialFocusPending&&value){var choices=Array.from(panel.querySelectorAll('[data-market-group=results]'));var first=choices.find(function(e){return e.dataset.marketKey==='port-'+selectedPort;})||choices[0]||panel.querySelector('[data-market-group=controls]')||panel.querySelector('.mobile-market-close');if(first){focusMarket(first);initialFocusPending=false;}} }
    else if(value && body?.querySelector){var marker=body.querySelector('.mobile-world-player');if(marker){var pos=projected(value.x,value.y);marker.style.left=(pos[0]*100)+'%';marker.style.top=(pos[1]*100)+'%';}}
  }
  function focusMarket(node) { if(!node)return; node.focus({preventScroll:true});node.scrollIntoView?.({block:'nearest',inline:'nearest'});document.documentElement.classList.add('k2-hardware-nav'); }
  function navigate(direction) {
    if(!open||!panel)return false;
    var groups=['controls','results','map'], active=panel.contains(document.activeElement)?document.activeElement:null;
    var group=active?.dataset?.marketGroup||'results', index=groups.indexOf(group), horizontal=direction==='left'||direction==='west'||direction==='right'||direction==='east';
    function items(g){return Array.from(panel.querySelectorAll('[data-market-group="'+g+'"]')).filter(function(e){return !e.disabled&&!e.hidden&&e.getClientRects().length;});}
    var target=null;
    if(horizontal){var step=(direction==='left'||direction==='west')?-1:1;for(var i=index+step;i>=0&&i<groups.length;i+=step){var next=items(groups[i]);if(next.length){target=(groups[i]==='results'&&next.find(function(e){return e.dataset.marketKey==='port-'+selectedPort;}))||next[0];break;}}}
    else {var list=items(group), pos=list.indexOf(active), step=(direction==='up'||direction==='north')?-1:1;if(list.length)target=list[Math.max(0,Math.min(list.length-1,pos<0?0:pos+step))];}
    if(target)focusMarket(target);return true;
  }
  function close() {
    open = false; rendered = null;initialFocusPending=false;
    if (panel) panel.remove();
    panel = body = null;
  }
  function toggle() {
    if (open) { close(); return true; }
    if (!window.__ci || !['port','sea'].includes(scene()) || window.K2Slots?.isOpen()) return false;
    mode=scene()==='sea'?'map':'prices';searchTerm='';mapScrollX=mapScrollY=0;var position=current(),centerPort=position?.ports?.[selectedPort];mapCenter=mapZoom>1&&position?projected(centerPort?.x??position.x,centerPort?.y??position.y):null;
    open = true;
    panel = element('section'); panel.id = 'mobile-market'; panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true'); panel.setAttribute('aria-label', '港口行情');
    var sheet = element('div', 'mobile-market-sheet'), header = element('header', 'mobile-market-header');
    header.append(element('h2', '', '港口行情'));
    var closeButton = element('button', 'mobile-market-close', '返回游戏'); closeButton.type = 'button'; closeButton.addEventListener('click', close); header.append(closeButton);
    body = element('div', 'mobile-market-body');
    sheet.append(header, body); panel.append(sheet);
    panel.addEventListener('pointerdown', function (event) { if (event.target === panel) close(); });
    document.body.append(panel); rendered = null; initialFocusPending=true;render();if(initialFocusPending)closeButton.focus({preventScroll:true});
    return true;
  }
  function refresh() {
    if (open && (!window.__ci || !['port','sea'].includes(scene()) || window.K2Slots?.isOpen())) close();
    render();
  }

  fetch('port-goods.json').then(function (response) {
    if (!response.ok) throw Error('port-goods.json HTTP ' + response.status);
    return response.json();
  }).then(function (value) {
    if (!value || !Array.isArray(value.goods) || value.goods.length !== 46 || !Array.isArray(value.ports) || value.ports.length < 100) throw Error('Invalid port catalog');
    catalog = value; rendered = null; render();
  }).catch(function (error) { console.warn('Market catalog unavailable:', error); });
  fetch('port-goods-simplified.json').then(function(response){if(!response.ok) throw Error('Simplified catalog unavailable');return response.json();}).then(function(value){if(value.goods?.length===46 && value.ports?.length===130){simplified=value;rendered=null;render();}}).catch(function(error){console.warn('Simplified catalog:',error);});
  fetch('world-projection.json').then(function(response){if(!response.ok)throw Error('No chart projection');return response.json();}).then(function(value){if(value.worldWidth!==2160||value.worldHeight!==1080||value.worldOffsetX!==720||value.columns!==91||value.rows!==46||value.grid?.length!==value.columns*value.rows||value.grid.some(function(p){return !Array.isArray(p)||p.length!==2||!p.every(Number.isFinite);}))throw Error('Invalid chart projection');projection=value;rendered=null;render();}).catch(function(error){console.warn('Chart projection:',error);});
  addEventListener('k2:load-complete', function () { latest = null; refresh(); });
  document.addEventListener('visibilitychange', refresh);
  setInterval(refresh, 250);
  window.K2MobileMarket = {toggle:toggle, close:close, refresh:refresh, current:current, navigate:navigate,
    state:function () { return {open:open, port:current()?.port ?? null, available:!!catalog}; }};
})();
