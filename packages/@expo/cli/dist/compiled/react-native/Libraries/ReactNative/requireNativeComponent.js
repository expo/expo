'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var createReactNativeComponentClass = require('../Renderer/shims/createReactNativeComponentClass');
var getNativeComponentAttributes = require('./getNativeComponentAttributes');
var requireNativeComponent = function requireNativeComponent(uiViewClassName) {
  return createReactNativeComponentClass(uiViewClassName, function () {
    return getNativeComponentAttributes(uiViewClassName);
  });
};
var _default = requireNativeComponent;
exports.default = _default;