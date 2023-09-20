var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _Platform = _interopRequireDefault(require("../Utilities/Platform"));
function nativeImageSource(spec) {
  var uri = _Platform.default.select({
    android: spec.android,
    default: spec.default,
    ios: spec.ios
  });
  if (uri == null) {
    console.warn('nativeImageSource(...): No image name supplied for `%s`:\n%s', _Platform.default.OS, JSON.stringify(spec, null, 2));
    uri = '';
  }
  return {
    deprecated: true,
    height: spec.height,
    uri: uri,
    width: spec.width
  };
}
module.exports = nativeImageSource;
//# sourceMappingURL=nativeImageSource.js.map