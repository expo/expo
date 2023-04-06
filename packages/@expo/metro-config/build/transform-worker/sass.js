"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.compileSass = compileSass;
exports.matchSass = matchSass;
function _resolveFrom() {
  const data = _interopRequireDefault(require("resolve-from"));
  _resolveFrom = function () {
    return data;
  };
  return data;
}
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function matchSass(filename) {
  if (filename.endsWith('.sass')) {
    return 'indented';
  } else if (filename.endsWith('.scss')) {
    return 'scss';
  }
  return null;
}
let sassInstance = null;
function getSassInstance(projectRoot, {
  filename
}) {
  if (!sassInstance) {
    const sassPath = _resolveFrom().default.silent(projectRoot, 'sass');
    if (!sassPath) {
      throw new Error(`Cannot find module 'sass' from '${projectRoot}'. Make sure it's installed. Parsing: ${filename}`);
    }
    sassInstance = require(sassPath);
  }
  return sassInstance;
}
function compileSass(projectRoot, {
  filename,
  src
}, options) {
  const sass = getSassInstance(projectRoot, {
    filename
  });
  const result = sass.compileString(src, options);
  return {
    src: result.css,
    map: result.sourceMap
  };
}
//# sourceMappingURL=sass.js.map