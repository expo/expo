"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shouldMinify = shouldMinify;
function isHermesEngine(options) {
    // NOTE: This has multiple inputs since we also use the `customTransformOptions.engine` option to indicate the Hermes engine.
    return (options.unstable_transformProfile === 'hermes-canary' ||
        options.unstable_transformProfile === 'hermes-stable');
}
function isBytecodeEnabled(options) {
    return options.customTransformOptions?.bytecode === '1';
}
function shouldMinify(options) {
    // If using Hermes + bytecode, then skip minification because the Hermes compiler will minify the code.
    if (isHermesEngine(options) && isBytecodeEnabled(options)) {
        return false;
    }
    return options.minify;
}
//# sourceMappingURL=resolveOptions.js.map