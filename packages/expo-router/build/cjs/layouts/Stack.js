"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.Stack = void 0;
function _nativeStack() {
  const data = require("@react-navigation/native-stack");
  _nativeStack = function () {
    return data;
  };
  return data;
}
function _withLayoutContext() {
  const data = require("./withLayoutContext");
  _withLayoutContext = function () {
    return data;
  };
  return data;
}
const NativeStackNavigator = (0, _nativeStack().createNativeStackNavigator)().Navigator;
const Stack = exports.Stack = (0, _withLayoutContext().withLayoutContext)(NativeStackNavigator);
var _default = exports.default = Stack;
//# sourceMappingURL=Stack.js.map