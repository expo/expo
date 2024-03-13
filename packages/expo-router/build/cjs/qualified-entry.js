"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.App = App;
function _ctx() {
  const data = require("expo-router/_ctx");
  _ctx = function () {
    return data;
  };
  return data;
}
function _react() {
  const data = _interopRequireDefault(require("react"));
  _react = function () {
    return data;
  };
  return data;
}
function _ExpoRoot() {
  const data = require("./ExpoRoot");
  _ExpoRoot = function () {
    return data;
  };
  return data;
}
function _head() {
  const data = require("./head");
  _head = function () {
    return data;
  };
  return data;
}
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
// The entry component (one that uses context modules) cannot be in the same file as the
// entry side-effects, otherwise they'll be updated when files are added/removed from the
// app directory. This will cause a lot of unfortunate errors regarding HMR and Fast Refresh.
// This is because Fast Refresh is sending the entire file containing an updated component.

// This has to be the string "expo-router/_ctx" as we resolve the exact string to
// a different file in a custom resolver for bundle splitting in Node.js.

// Must be exported or Fast Refresh won't update the context
function App() {
  return /*#__PURE__*/_react().default.createElement(_head().Head.Provider, null, /*#__PURE__*/_react().default.createElement(_ExpoRoot().ExpoRoot, {
    context: _ctx().ctx
  }));
}
//# sourceMappingURL=qualified-entry.js.map