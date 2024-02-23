"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.directoryExistsAsync = directoryExistsAsync;
exports.fileExists = fileExists;
exports.fileExistsAsync = fileExistsAsync;
function _fs() {
  const data = _interopRequireDefault(require("fs"));
  _fs = function () {
    return data;
  };
  return data;
}
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
/**
 * A non-failing version of async FS stat.
 *
 * @param file
 */
async function statAsync(file) {
  try {
    return await _fs().default.promises.stat(file);
  } catch {
    return null;
  }
}
async function fileExistsAsync(file) {
  return (await statAsync(file))?.isFile() ?? false;
}
async function directoryExistsAsync(file) {
  return (await statAsync(file))?.isDirectory() ?? false;
}
function fileExists(file) {
  try {
    return _fs().default.statSync(file).isFile();
  } catch {
    return false;
  }
}
//# sourceMappingURL=modules.js.map