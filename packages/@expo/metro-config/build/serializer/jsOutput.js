"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isTransformOptionTruthy = exports.isExpoJsOutput = void 0;
function isExpoJsOutput(output) {
    return 'data' in output && typeof output.data === 'object';
}
exports.isExpoJsOutput = isExpoJsOutput;
// Because transform options can be passed directly during export, or through a query parameter
// during a request, we need to normalize the options.
function isTransformOptionTruthy(option) {
    return option === true || option === 'true' || option === '1';
}
exports.isTransformOptionTruthy = isTransformOptionTruthy;
//# sourceMappingURL=jsOutput.js.map