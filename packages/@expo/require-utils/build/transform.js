"use strict";

exports.__esModule = true;
exports.toCommonJS = toCommonJS;
function _core() {
  const data = require("@babel/core");
  _core = function () {
    return data;
  };
  return data;
}
function toCommonJS(filename, code, importInterop = 'node') {
  const result = (0, _core().transformSync)(code, {
    filename,
    babelrc: false,
    configFile: false,
    plugins: [[require('@babel/plugin-transform-modules-commonjs'), {
      // Preserve legacy JavaScript imports of the whole CommonJS exports object.
      // TypeScript's stripping fallback opts into Babel's __esModule interop.
      importInterop,
      loose: true
    }]]
  });
  return result?.code ?? code;
}
//# sourceMappingURL=transform.js.map