var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _NativeSourceCode = _interopRequireDefault(require("../../NativeModules/specs/NativeSourceCode"));
var _cachedDevServerURL;
var _cachedFullBundleURL;
var FALLBACK = 'http://localhost:8081/';
function getDevServer() {
  var _cachedDevServerURL2;
  if (_cachedDevServerURL === undefined) {
    var scriptUrl = _NativeSourceCode.default.getConstants().scriptURL;
    var match = scriptUrl.match(/^https?:\/\/.*?\//);
    _cachedDevServerURL = match ? match[0] : null;
    _cachedFullBundleURL = match ? scriptUrl : null;
  }
  return {
    url: (_cachedDevServerURL2 = _cachedDevServerURL) != null ? _cachedDevServerURL2 : FALLBACK,
    fullBundleUrl: _cachedFullBundleURL,
    bundleLoadedFromServer: _cachedDevServerURL !== null
  };
}
module.exports = getDevServer;
//# sourceMappingURL=getDevServer.js.map