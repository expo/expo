"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SuspenseFallback = SuspenseFallback;
function _react() {
  const data = _interopRequireDefault(require("react"));
  _react = function () {
    return data;
  };
  return data;
}
function _Toast() {
  const data = require("./Toast");
  _Toast = function () {
    return data;
  };
  return data;
}
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function SuspenseFallback({
  route
}) {
  if (__DEV__) {
    return /*#__PURE__*/_react().default.createElement(_Toast().ToastWrapper, null, /*#__PURE__*/_react().default.createElement(_Toast().Toast, {
      filename: route?.contextKey
    }, "Bundling..."));
  }
  // TODO: Support user's customizing the fallback.
  return null;
}
//# sourceMappingURL=SuspenseFallback.js.map