'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));
var getDevServer = require("./getDevServer");
function symbolicateStackTrace(_x) {
  return _symbolicateStackTrace.apply(this, arguments);
}
function _symbolicateStackTrace() {
  _symbolicateStackTrace = (0, _asyncToGenerator2.default)(function* (stack) {
    var _global$fetch;
    var devServer = getDevServer();
    if (!devServer.bundleLoadedFromServer) {
      throw new Error('Bundle was not loaded from Metro.');
    }
    var fetch = (_global$fetch = global.fetch) != null ? _global$fetch : require("../../Network/fetch");
    var response = yield fetch(devServer.url + 'symbolicate', {
      method: 'POST',
      body: JSON.stringify({
        stack: stack
      })
    });
    return yield response.json();
  });
  return _symbolicateStackTrace.apply(this, arguments);
}
module.exports = symbolicateStackTrace;
//# sourceMappingURL=symbolicateStackTrace.js.map