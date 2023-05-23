"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.cssPreprocessors = cssPreprocessors;
function _postcss() {
  const data = require("./postcss");
  _postcss = function () {
    return data;
  };
  return data;
}
function _sass() {
  const data = require("./sass");
  _sass = function () {
    return data;
  };
  return data;
}
async function cssPreprocessors(projectRoot, filename, data) {
  let code = data.toString('utf8');

  // Apply postcss transforms
  code = await (0, _postcss().transformPostCssModule)(projectRoot, {
    src: code,
    filename
  });

  // TODO: When native has CSS support, this will need to move higher up.
  const syntax = (0, _sass().matchSass)(filename);
  if (syntax) {
    code = (0, _sass().compileSass)(projectRoot, {
      filename,
      src: code
    }, {
      syntax
    }).src;
  }
  return code;
}
//# sourceMappingURL=preprocessors.js.map