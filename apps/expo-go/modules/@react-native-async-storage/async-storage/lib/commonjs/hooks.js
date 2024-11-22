"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.useAsyncStorage = useAsyncStorage;
var _AsyncStorage = _interopRequireDefault(require("./AsyncStorage"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function useAsyncStorage(key) {
  return {
    getItem: (...args) => _AsyncStorage.default.getItem(key, ...args),
    setItem: (...args) => _AsyncStorage.default.setItem(key, ...args),
    mergeItem: (...args) => _AsyncStorage.default.mergeItem(key, ...args),
    removeItem: (...args) => _AsyncStorage.default.removeItem(key, ...args)
  };
}
//# sourceMappingURL=hooks.js.map