var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _Platform = _interopRequireDefault(require("../Utilities/Platform"));
if (__DEV__) {
  require('./setUpReactDevTools');
  var JSInspector = require('../JSInspector/JSInspector');
  JSInspector.registerAgent(require('../JSInspector/NetworkAgent'));
  var isLikelyARealBrowser = global.navigator != null && global.navigator.appName === 'Netscape';
  if (!_Platform.default.isTesting) {
    var HMRClient = require('../Utilities/HMRClient');
    if (console._isPolyfilled) {
      ['trace', 'info', 'warn', 'error', 'log', 'group', 'groupCollapsed', 'groupEnd', 'debug'].forEach(function (level) {
        var originalFunction = console[level];
        console[level] = function () {
          for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
          }
          HMRClient.log(level, args);
          originalFunction.apply(console, args);
        };
      });
    } else {
      HMRClient.log('log', [`JavaScript logs will appear in your ${isLikelyARealBrowser ? 'browser' : 'environment'} console`]);
    }
  }
  require('./setUpReactRefresh');
}