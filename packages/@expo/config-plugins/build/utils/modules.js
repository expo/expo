"use strict";

exports.__esModule = true;
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
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
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
    const stat = _fs().default.lstatSync(file, {
      throwIfNoEntry: false
    });
    if (!stat) {
      return false;
    } else if (stat.isFile()) {
      return true;
    } else if (stat.isSymbolicLink()) {
      return isRealpathFileSync(file);
    } else {
      return false;
    }
  } catch {
    return false;
  }
}
function isRealpathFileSync(target) {
  try {
    const realpath = _fs().default.realpathSync(target);
    return !!_fs().default.lstatSync(realpath, {
      throwIfNoEntry: false
    })?.isFile();
  } catch {
    return false;
  }
}
//# sourceMappingURL=modules.js.map