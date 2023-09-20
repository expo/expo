'use strict';

var infoLog = require('../Utilities/infoLog');
var JSEventLoopWatchdog = {
  getStats: function getStats() {
    return {
      stallCount: stallCount,
      totalStallTime: totalStallTime,
      longestStall: longestStall,
      acceptableBusyTime: acceptableBusyTime
    };
  },
  reset: function reset() {
    infoLog('JSEventLoopWatchdog: reset');
    totalStallTime = 0;
    stallCount = 0;
    longestStall = 0;
    lastInterval = global.performance.now();
  },
  addHandler: function addHandler(handler) {
    handlers.push(handler);
  },
  install: function install(_ref) {
    var thresholdMS = _ref.thresholdMS;
    acceptableBusyTime = thresholdMS;
    if (installed) {
      return;
    }
    installed = true;
    lastInterval = global.performance.now();
    function iteration() {
      var now = global.performance.now();
      var busyTime = now - lastInterval;
      if (busyTime >= thresholdMS) {
        var stallTime = busyTime - thresholdMS;
        stallCount++;
        totalStallTime += stallTime;
        longestStall = Math.max(longestStall, stallTime);
        var msg = `JSEventLoopWatchdog: JS thread busy for ${busyTime}ms. ` + `${totalStallTime}ms in ${stallCount} stalls so far. `;
        handlers.forEach(function (handler) {
          msg += handler.onStall({
            lastInterval: lastInterval,
            busyTime: busyTime
          }) || '';
        });
        infoLog(msg);
      }
      handlers.forEach(function (handler) {
        handler.onIterate && handler.onIterate();
      });
      lastInterval = now;
      setTimeout(iteration, thresholdMS / 5);
    }
    iteration();
  }
};
var acceptableBusyTime = 0;
var installed = false;
var totalStallTime = 0;
var stallCount = 0;
var longestStall = 0;
var lastInterval = 0;
var handlers = [];
module.exports = JSEventLoopWatchdog;
//# sourceMappingURL=JSEventLoopWatchdog.js.map