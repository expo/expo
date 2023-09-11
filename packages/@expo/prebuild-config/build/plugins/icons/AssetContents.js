"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createContentsJsonItem = createContentsJsonItem;
exports.writeContentsJsonAsync = writeContentsJsonAsync;
function _fsExtra() {
  const data = _interopRequireDefault(require("fs-extra"));
  _fsExtra = function () {
    return data;
  };
  return data;
}
function _path() {
  const data = require("path");
  _path = function () {
    return data;
  };
  return data;
}
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function createContentsJsonItem(item) {
  return item;
}

/**
 * Writes the Config.json which is used to assign images to their respective platform, dpi, and idiom.
 *
 * @param directory path to add the Contents.json to.
 * @param contents image json data
 */
async function writeContentsJsonAsync(directory, {
  images
}) {
  await _fsExtra().default.ensureDir(directory);
  await _fsExtra().default.writeFile((0, _path().join)(directory, 'Contents.json'), JSON.stringify({
    images,
    info: {
      version: 1,
      // common practice is for the tool that generated the icons to be the "author"
      author: 'expo'
    }
  }, null, 2));
}
//# sourceMappingURL=AssetContents.js.map