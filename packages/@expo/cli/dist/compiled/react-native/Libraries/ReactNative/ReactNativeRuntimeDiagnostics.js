'use strict';
var flags = [];
var _isEnabled = false;
var shouldEnableAll = false;
if (__DEV__) {
  if (typeof global.RN$DiagnosticFlags === 'string') {
    global.RN$DiagnosticFlags.split(',').forEach(function (flag) {
      switch (flag) {
        case 'early_js_errors':
        case 'all':
          flags.push(flag);
          break;
        default:
          throw Error(`RuntimeDiagnosticsFlags: unknown flag was supplied: '${flag}'`);
      }
    });
    _isEnabled = flags.length > 0;
    shouldEnableAll = flags.includes('all');
  }
}
var ReactNativeRuntimeDiagnostics = {
  isEnabled: function isEnabled() {
    return _isEnabled;
  },
  simulateEarlyJavaScriptErrors: function simulateEarlyJavaScriptErrors() {
    if (__DEV__) {
      if (!_isEnabled) {
        return;
      }
      if (shouldEnableAll || flags.includes('early_js_errors')) {
        throw Error('[Runtime Diagnostics] Throwing a JavaScript error.');
      }
    }
  }
};
module.exports = ReactNativeRuntimeDiagnostics;