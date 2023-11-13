"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isExpoJsOutput = isExpoJsOutput;
exports.isTransformOptionTruthy = isTransformOptionTruthy;
/**
 * Copyright © 2023-present 650 Industries (Expo). All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

function isExpoJsOutput(output) {
  return 'data' in output && typeof output.data === 'object';
}

// Because transform options can be passed directly during export, or through a query parameter
// during a request, we need to normalize the options.
function isTransformOptionTruthy(option) {
  return option === true || option === 'true' || option === '1';
}
//# sourceMappingURL=jsOutput.js.map