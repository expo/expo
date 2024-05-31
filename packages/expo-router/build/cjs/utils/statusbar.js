"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.hasViewControllerBasedStatusBarAppearance = void 0;
function _expoConstants() {
  const data = _interopRequireDefault(require("expo-constants"));
  _expoConstants = function () {
    return data;
  };
  return data;
}
function _Platform() {
  const data = _interopRequireDefault(require("react-native-web/dist/exports/Platform"));
  _Platform = function () {
    return data;
  };
  return data;
}
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const hasViewControllerBasedStatusBarAppearance = exports.hasViewControllerBasedStatusBarAppearance = _Platform().default.OS === 'ios' && !!_expoConstants().default.expoConfig?.ios?.infoPlist?.UIViewControllerBasedStatusBarAppearance;
//# sourceMappingURL=statusbar.js.map