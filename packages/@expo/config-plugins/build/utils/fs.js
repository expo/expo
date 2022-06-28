"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.copyFilePathToPathAsync = copyFilePathToPathAsync;
exports.removeFile = removeFile;

function _fs() {
  const data = _interopRequireDefault(require("fs"));

  _fs = function () {
    return data;
  };

  return data;
}

function _path() {
  const data = _interopRequireDefault(require("path"));

  _path = function () {
    return data;
  };

  return data;
}

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/** A basic function that copies a single file to another file location. */
async function copyFilePathToPathAsync(src, dest) {
  const srcFile = await _fs().default.promises.readFile(src);
  await _fs().default.promises.mkdir(_path().default.dirname(dest), {
    recursive: true
  });
  await _fs().default.promises.writeFile(dest, srcFile);
}
/** Remove a single file (not directory). Returns `true` if a file was actually deleted. */


function removeFile(filePath) {
  try {
    _fs().default.unlinkSync(filePath);

    return true;
  } catch (error) {
    // Skip if the remove did nothing.
    if (error.code === 'ENOENT') {
      return false;
    }

    throw error;
  }
}
//# sourceMappingURL=fs.js.map