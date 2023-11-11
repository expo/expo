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
const debug = require('debug')('expo:metro:cache');
class ExpoMetroFileStore extends _FileStore().default {
  async set(key, value) {
    var _value$output, _value$output$, _value$output$$data, _value$output2, _value$output2$, _value$output2$$data, _value$output2$$data$;
    const src = value === null || value === void 0 ? void 0 : (_value$output = value.output) === null || _value$output === void 0 ? void 0 : (_value$output$ = _value$output[0]) === null || _value$output$ === void 0 ? void 0 : (_value$output$$data = _value$output$.data) === null || _value$output$$data === void 0 ? void 0 : _value$output$$data.code;
    // console.log('CACHE:', value?.output?.[0]?.data?.css);
    if (value !== null && value !== void 0 && (_value$output2 = value.output) !== null && _value$output2 !== void 0 && (_value$output2$ = _value$output2[0]) !== null && _value$output2$ !== void 0 && (_value$output2$$data = _value$output2$.data) !== null && _value$output2$$data !== void 0 && (_value$output2$$data$ = _value$output2$$data.css) !== null && _value$output2$$data$ !== void 0 && _value$output2$$data$.skipCache) {
      debug('Skipping caching for CSS file:', value.path);
      return;
    }
    if (src) {
      // Match `// @metro no-cache` or `/** @metro no-cache`
      if (src.match(/^(?:[\s\t]+)(?:\/\/|\/[*]+)(?:[\s\t]+)?@metro\s(?:[\s\t]+)?no-cache/m)) {
        debug('Skipping caching');
        return;
      }
    }
    return await super.set(key, value);
  }
}
exports.ExpoMetroFileStore = ExpoMetroFileStore;
//# sourceMappingURL=file-store.js.map