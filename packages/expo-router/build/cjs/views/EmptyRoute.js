"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.EmptyRoute = EmptyRoute;
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
function _Route() {
  const data = require("../Route");
  _Route = function () {
    return data;
  };
  return data;
}
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function EmptyRoute() {
  const route = (0, _Route().useRouteNode)();
  return /*#__PURE__*/_react().default.createElement(_Toast().ToastWrapper, null, /*#__PURE__*/_react().default.createElement(_Toast().Toast, {
    warning: true,
    filename: route?.contextKey
  }, "Missing default export"));
}
//# sourceMappingURL=EmptyRoute.js.map