'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = useColorScheme;
var _Appearance = _interopRequireDefault(require("./Appearance"));
var _shim = require("use-sync-external-store/shim");
function useColorScheme() {
  return (0, _shim.useSyncExternalStore)(function (callback) {
    var appearanceSubscription = _Appearance.default.addChangeListener(callback);
    return function () {
      return appearanceSubscription.remove();
    };
  }, function () {
    return _Appearance.default.getColorScheme();
  });
}