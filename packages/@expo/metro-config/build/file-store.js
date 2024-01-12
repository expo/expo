"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.FileStore = void 0;
function _FileStore() {
  const data = _interopRequireDefault(require("metro-cache/src/stores/FileStore"));
  _FileStore = function () {
    return data;
  };
  return data;
}
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const debug = require('debug')('expo:metro:cache');
class FileStore extends _FileStore().default {
  async set(key, value) {
    var _value$output, _value$output$, _value$output$$data, _value$output$$data$c;
    // Prevent caching of CSS files that have the skipCache flag set.
    if (value !== null && value !== void 0 && (_value$output = value.output) !== null && _value$output !== void 0 && (_value$output$ = _value$output[0]) !== null && _value$output$ !== void 0 && (_value$output$$data = _value$output$.data) !== null && _value$output$$data !== void 0 && (_value$output$$data$c = _value$output$$data.css) !== null && _value$output$$data$c !== void 0 && _value$output$$data$c.skipCache) {
      debug('Skipping caching for CSS file:', value.path);
      return;
    }
    return await super.set(key, value);
  }
}
exports.FileStore = FileStore;
//# sourceMappingURL=file-store.js.map