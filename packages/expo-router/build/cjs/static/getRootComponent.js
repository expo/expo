"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getRootComponent = getRootComponent;
function _ctxHtml() {
  const data = require("../../_ctx-html");
  _ctxHtml = function () {
    return data;
  };
  return data;
}
/**
 * Copyright © 2023 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

function getRootComponent() {
  const keys = _ctxHtml().ctx.keys();
  if (!keys.length) {
    return require('./html').Html;
  }
  if (keys.length > 1) {
    throw new Error(`Multiple components match the root HTML element: ${keys.join(', ')}`);
  }
  const exp = (0, _ctxHtml().ctx)(keys[0]);
  if (!exp.default) {
    throw new Error(`The root HTML element "${keys[0]}" is missing the required default export.`);
  }
  return exp.default;
}
//# sourceMappingURL=getRootComponent.js.map