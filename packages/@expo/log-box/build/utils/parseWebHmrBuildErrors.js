"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseWebHmrBuildErrors = parseWebHmrBuildErrors;
const BuildErrors_1 = require("../Data/BuildErrors");
function parseWebHmrBuildErrors(data) {
    const message = [data.type, data.message].filter(Boolean).join(' ');
    const type = data.type;
    const errors = data.errors;
    if ('originModulePath' in data &&
        typeof data.originModulePath === 'string' &&
        'targetModuleName' in data &&
        typeof data.targetModuleName === 'string' &&
        'cause' in data) {
        return new BuildErrors_1.MetroPackageResolutionError(message, type, errors, data.originModulePath, data.targetModuleName, data.cause);
    }
    if (type === 'TransformError') {
        assert('lineNumber' in data, '[Internal] Expected lineNumber to be in Metro HMR error update');
        assert('column' in data, '[Internal] Expected column to be in Metro HMR error update');
        assert('filename' in data, '[Internal] Expected filename to be in Metro HMR error update');
        return new BuildErrors_1.MetroTransformError(message, type, errors, 
        // @ts-ignore
        data.lineNumber, data.column, data.filename);
    }
    // TODO: Add import stack to the error
    // if ('stack' in data && typeof data.stack === 'string') {
    //   error.stack = stripAnsi(data.stack);
    // }
    return new BuildErrors_1.MetroBuildError(message, type, errors);
}
function assert(foo, msg) {
    if (!foo)
        throw new Error(msg);
}
