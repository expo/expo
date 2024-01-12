"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.transformSync = transformSync;
function babel() {
  const data = _interopRequireWildcard(require("./babel-core"));
  babel = function () {
    return data;
  };
  return data;
}
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
/**
 * Copyright (c) 650 Industries (Expo). All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// TS detection conditions copied from @react-native/babel-preset
function isTypeScriptSource(fileName) {
  return fileName === null || fileName === void 0 ? void 0 : fileName.endsWith('.ts');
}
function isTSXSource(fileName) {
  return fileName === null || fileName === void 0 ? void 0 : fileName.endsWith('.tsx');
}
function transformSync(src, babelConfig, {
  hermesParser
}) {
  const useBabelCore = isTypeScriptSource(babelConfig.filename) || isTSXSource(babelConfig.filename) || !hermesParser;
  const parser = useBabelCore ? parseWithBabel : parseWithHermes;
  return parser(src, babelConfig);
}
function parseWithHermes(src, babelConfig) {
  const sourceAst = require('hermes-parser').parse(src, {
    babel: true,
    sourceType: babelConfig.sourceType
  });
  return babel().transformFromAstSync(sourceAst, src, babelConfig);
}
function parseWithBabel(src, babelConfig) {
  return babel().transformSync(src, babelConfig);
}
//# sourceMappingURL=transformSync.js.map