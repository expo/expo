"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isExpoJsOutput = isExpoJsOutput;
exports.isTransformOptionTruthy = isTransformOptionTruthy;
function isExpoJsOutput(output) {
    return 'data' in output && typeof output.data === 'object';
}
// Because transform options can be passed directly during export, or through a query parameter
// during a request, we need to normalize the options.
function isTransformOptionTruthy(option) {
    return option === true || option === 'true' || option === '1';
}
//# sourceMappingURL=jsOutput.js.map