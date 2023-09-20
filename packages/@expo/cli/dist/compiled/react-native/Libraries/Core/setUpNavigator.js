'use strict';

var _require = require("../Utilities/PolyfillFunctions"),
  polyfillObjectProperty = _require.polyfillObjectProperty;
var navigator = global.navigator;
if (navigator === undefined) {
  global.navigator = {
    product: 'ReactNative'
  };
} else {
  polyfillObjectProperty(navigator, 'product', function () {
    return 'ReactNative';
  });
}
//# sourceMappingURL=setUpNavigator.js.map