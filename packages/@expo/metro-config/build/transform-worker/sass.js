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
let sassInstance = null;
function getSassInstance(projectRoot) {
  if (!sassInstance) {
    const sassPath = _resolveFrom().default.silent(projectRoot, 'sass');
    if (!sassPath) {
      throw new Error(`Cannot parse Sass files without the module 'sass' installed. Run 'yarn add sass' and try again.`);
    }
    sassInstance = require(sassPath);
  }
  return sassInstance;
}
function matchSass(filename) {
  if (filename.endsWith('.sass')) {
    return 'indented';
  } else if (filename.endsWith('.scss')) {
    return 'scss';
  }
  return null;
}
function compileSass(projectRoot, {
  filename,
  src
},
// TODO: Expose to users somehow...
options) {
  const sass = getSassInstance(projectRoot);
  const result = sass.compileString(src, options);
  return {
    src: result.css,
    // TODO: Should we use this? Leaning towards no since the CSS will be parsed again by the CSS loader.
    map: result.sourceMap
  };
}
//# sourceMappingURL=sass.js.map