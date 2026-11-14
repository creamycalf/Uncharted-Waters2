/*
 * Derived from GPL-2.0 frontend source distributed in upstream v8.9:
 * GPL-Components-v8.9/local-modifications/frontend/trade-core.js
 * https://github.com/maxleolee-eng/Uncharted-Waters-2-Android/releases/tag/v8.9
 * Upstream SHA-256: c22b0d79594f16aa90484d90b8c384a784632d4bdf90094b1bf3329c77b2d1f2
 * Changes in this copy: source notice only. See docs/upstream/licenses/GPL-2.0.txt.
 * Read-only per-unit quotes. No time prediction, haggling or automatic trading.
 */
(function (root) {
  'use strict';
  function createTradeCore() {
    var PORTS = 100, GOODS = 46, MARKETS = 13, STRIDE = 37, MARKET_STRIDE = 128;
    function bytes(value, length, label) {
      if (!value || value.length !== length) throw Error('Invalid ' + label);
      return value;
    }
    function u16(value, at) { return value[at] | value[at + 1] << 8; }
    function ordinary(rate, base) { return Math.floor((rate + 50) * base / 100); }
    function build(snapshot, limits) {
      var economy = bytes(snapshot.economy, PORTS * STRIDE, 'port economy');
      var markets = bytes(snapshot.markets, MARKETS * MARKET_STRIDE, 'market definitions');
      var controllers = bytes(snapshot.controllers, PORTS, 'port controllers');
      var inventory = bytes(snapshot.inventory, 20, 'item inventory');
      bytes(limits, 10, 'categories');
      for (var i = 0; i < 10; i++) if (limits[i] <= (i ? limits[i - 1] : 0) || limits[i] > GOODS) throw Error('Invalid category boundary');
      if (limits[9] !== GOODS) throw Error('Incomplete goods categories');
      var categories = [], records = [], permits = [];
      for (i = 0; i < GOODS; i++) categories.push(limits.findIndex(function (limit) { return i < limit; }));
      for (i = 0; i < 6; i++) permits.push(inventory.includes(0x23 + i));
      for (var market = 0; market < MARKETS; market++) {
        var mp = market * MARKET_STRIDE, listed = [], found = new Set(), ended = false;
        for (var slot = 0; slot < 9; slot++) {
          var good = markets[mp + 0x6e + slot];
          if (good === 255) { ended = true; continue; }
          if (ended || good >= GOODS || found.has(good)) throw Error('Invalid market goods');
          found.add(good);
          var base = u16(markets, mp + 0x5c + slot * 2), threshold = markets[mp + 0x77 + slot];
          if (!base || base > 10000 || threshold > 100) throw Error('Invalid market purchase');
          listed.push({good:good, base:base, minimumEconomy:threshold * 10});
        }
        var sell = [];
        for (i = 0; i < GOODS; i++) {
          var saleBase = u16(markets, mp + i * 2);
          if (!saleBase || saleBase > 10000) throw Error('Invalid market sale');
          sell.push(saleBase);
        }
        records.push({buy:listed, sell:sell});
      }
      var table = [];
      for (var port = 0; port < PORTS; port++) {
        var p = port * STRIDE, marketId = economy[p + 0x23], controller = controllers[port];
        if (marketId >= MARKETS || controller > 6) throw Error('Invalid port market or controller');
        var commercial = u16(economy, p + 2), rates = Array.from(economy.slice(p + 0x10, p + 0x1a));
        if (commercial > 1000 || rates.some(function (rate) { return rate > 100; })) throw Error('Invalid port economy');
        var specialty = economy[p + 0x1c], specialBase = u16(economy, p + 0x1a), specialThreshold = economy[p + 0x1d] * 10;
        if (specialty !== 255 && (specialty >= GOODS || !specialBase || specialBase > 10000)) throw Error('Invalid specialty');
        var permit = controller < 6 && permits[controller], definition = records[marketId], offers = [];
        function offer(good, base) {
          var price = ordinary(rates[categories[good]], base);
          if (!permit) price = Math.floor(price * 12 / 10);
          offers.push({good:good, price:price});
        }
        definition.buy.forEach(function (item) { if (item.minimumEconomy <= commercial) offer(item.good, item.base); });
        if (specialty < GOODS && specialThreshold <= commercial && rates[categories[specialty]] < 90 && !offers.some(function (item) { return item.good === specialty; })) offer(specialty, specialBase);
        var sell = definition.sell.map(function (base, good) {
          var price = ordinary(rates[categories[good]], good === specialty ? specialBase : base);
          return good === specialty ? Math.floor(price / 2) : price;
        });
        table.push({port:port, market:marketId, controller:controller, taxExempt:permit, offers:offers, sell:sell});
      }
      return table;
    }
    function bestRoute(table, origin, offer) {
      var best = null;
      for (var port = 0; port < PORTS; port++) {
        if (port === origin) continue;
        var sale = table[port].sell[offer.good], margin = sale - offer.price;
        if (!best || margin > best.margin) best = {good:offer.good, origin:origin, destination:port, buy:offer.price, sell:sale, margin:margin};
      }
      return best;
    }
    function topTwo(table, origin) {
      if (!Number.isInteger(origin) || origin < 0 || origin >= PORTS || !table || table.length !== PORTS) return [];
      var candidates = table[origin].offers.map(function (offer) {
        return bestRoute(table, origin, offer);
      }).filter(function (route) { return route.margin > 0; });
      candidates.sort(function (a, b) { return b.margin - a.margin || a.good - b.good || a.destination - b.destination; });
      return candidates.slice(0, 2);
    }
    return {build:build, topTwo:topTwo, bestRoute:bestRoute};
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = createTradeCore;
  else root.K2TradeCore = createTradeCore;
})(typeof window === 'undefined' ? globalThis : window);
