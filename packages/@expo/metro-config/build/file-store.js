"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ExpoMetroFileStore = void 0;
function _FileStore() {
  const data = _interopRequireDefault(require("metro-cache/src/stores/FileStore"));
  _FileStore = function () {
    return data;
  };
  return data;
}
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return typeof key === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (typeof input !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (typeof res !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
const debug = require('debug')('expo:metro:cache');
class ExpoMetroFileStore {
  constructor(options) {
    _defineProperty(this, "fileStore", void 0);
    this.fileStore = new (_FileStore().default)(options);
  }
  async get(key) {
    const result = await this.fileStore.get(key);
    return result;
  }
  async set(key, value) {
    var _value$output, _value$output$, _value$output$$data;
    const src = value === null || value === void 0 ? void 0 : (_value$output = value.output) === null || _value$output === void 0 ? void 0 : (_value$output$ = _value$output[0]) === null || _value$output$ === void 0 ? void 0 : (_value$output$$data = _value$output$.data) === null || _value$output$$data === void 0 ? void 0 : _value$output$$data.code;
    if (src) {
      if (src.match(/^(?:[\s\t]+)\/\/(?:\s+)?@metro no-cache/m)) {
        debug('Skipping caching');
        return;
      }
    }
    return await this.fileStore.set(key, value);
  }
  clear() {
    this.fileStore.clear();
  }
}
exports.ExpoMetroFileStore = ExpoMetroFileStore;
//# sourceMappingURL=file-store.js.map