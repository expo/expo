'use strict';

var SamplingProfiler = {
  poke: function poke(token) {
    var error = null;
    var result = null;
    try {
      result = global.pokeSamplingProfiler();
      if (result === null) {
        console.log('The JSC Sampling Profiler has started');
      } else {
        console.log('The JSC Sampling Profiler has stopped');
      }
    } catch (e) {
      console.log('Error occurred when restarting Sampling Profiler: ' + e.toString());
      error = e.toString();
    }
    var NativeJSCSamplingProfiler = require('./NativeJSCSamplingProfiler').default;
    if (NativeJSCSamplingProfiler) {
      NativeJSCSamplingProfiler.operationComplete(token, result, error);
    }
  }
};
module.exports = SamplingProfiler;
//# sourceMappingURL=SamplingProfiler.js.map