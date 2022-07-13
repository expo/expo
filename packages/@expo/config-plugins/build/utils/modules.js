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
  var _await$statAsync$isFi, _await$statAsync;

  return (_await$statAsync$isFi = (_await$statAsync = await statAsync(file)) === null || _await$statAsync === void 0 ? void 0 : _await$statAsync.isFile()) !== null && _await$statAsync$isFi !== void 0 ? _await$statAsync$isFi : false;
}

async function directoryExistsAsync(file) {
  var _await$statAsync$isDi, _await$statAsync2;

  return (_await$statAsync$isDi = (_await$statAsync2 = await statAsync(file)) === null || _await$statAsync2 === void 0 ? void 0 : _await$statAsync2.isDirectory()) !== null && _await$statAsync$isDi !== void 0 ? _await$statAsync$isDi : false;
}

function fileExists(file) {
  try {
    return _fs().default.statSync(file).isFile();
  } catch {
    return false;
  }
}
//# sourceMappingURL=modules.js.map