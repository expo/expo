"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Screen = Screen;
function _react() {
  const data = _interopRequireDefault(require("react"));
  _react = function () {
    return data;
  };
  return data;
}
function _useNavigation() {
  const data = require("../useNavigation");
  _useNavigation = function () {
    return data;
  };
  return data;
}
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const useLayoutEffect = typeof window !== 'undefined' ? _react().default.useLayoutEffect : function () {};

/** Component for setting the current screen's options dynamically. */
function Screen({
  name,
  options
}) {
  const navigation = (0, _useNavigation().useNavigation)(name);
  useLayoutEffect(() => {
    if (options &&
    // React Navigation will infinitely loop in some cases if an empty object is passed to setOptions.
    // https://github.com/expo/router/issues/452
    Object.keys(options).length) {
      navigation.setOptions(options);
    }
  }, [navigation, options]);
  return null;
}
//# sourceMappingURL=Screen.js.map