"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createGetFileNameFromUrl = exports.getCompilerForPlatform = exports.getPlatformFromRequest = exports.getFileFromCompilerAsync = void 0;
const assert_1 = __importDefault(require("assert"));
// @ts-ignore
const util_1 = require("webpack-dev-middleware/lib/util");
/**
 * Read a file from the webpack "compiler".
 *
 * @param compiler webpack compiler
 * @param filename Like: `/Users/evanbacon/Documents/GitHub/lab/yolo47/web-build/index.bundle`
 * @returns
 */
function getFileFromCompilerAsync(compiler, { fileName, platform }) {
    const platformCompiler = getCompilerForPlatform(compiler, platform);
    return new Promise((resolve, reject) => platformCompiler.outputFileSystem.readFile(fileName, (error, content) => {
        if (error || !content) {
            reject(error);
        }
        else {
            resolve(content.toString());
        }
    }));
}
exports.getFileFromCompilerAsync = getFileFromCompilerAsync;
function getPlatformFromRequest(request) {
    var _a, _b, _c, _d, _e;
    // Use the expo updates spec to check the platform.
    if (typeof request.headers['expo-platform'] === 'string') {
        return (_a = request.headers['expo-platform']) !== null && _a !== void 0 ? _a : null;
    }
    // Get the platform from the query params cheaply.
    return (_e = (_d = (_c = (_b = request === null || request === void 0 ? void 0 : request.url) === null || _b === void 0 ? void 0 : _b.match) === null || _c === void 0 ? void 0 : _c.call(_b, /[?|&]platform=(\w+)[&|\\]/)) === null || _d === void 0 ? void 0 : _d[1]) !== null && _e !== void 0 ? _e : null;
}
exports.getPlatformFromRequest = getPlatformFromRequest;
/**
 * Get the Webpack compiler for a given platform.
 * In Expo we distinguish platforms by using the `name` property of the Webpack config.
 *
 * When the platform is undefined, or the compiler cannot be identified, we assert.
 *
 * @param compiler
 * @param platform
 * @returns
 */
function getCompilerForPlatform(compiler, platform) {
    if (!('compilers' in compiler)) {
        return compiler;
    }
    (0, assert_1.default)(platform, 'platform must be provided for multi-compiler servers');
    const platformCompiler = compiler.compilers.find(({ options }) => options.name === platform);
    (0, assert_1.default)(platformCompiler, `Could not find Webpack compiler for platform: ${platform}`);
    return platformCompiler;
}
exports.getCompilerForPlatform = getCompilerForPlatform;
function createGetFileNameFromUrl(compiler, publicPath = '/') {
    return function ({ url, platform }) {
        const platformCompiler = getCompilerForPlatform(compiler, platform);
        const filename = (0, util_1.getFilenameFromUrl)(
        // public path
        publicPath, platformCompiler, url);
        if (!filename) {
            throw new Error(`Cannot get Webpack file name from url: ${url}`);
        }
        return filename;
    };
}
exports.createGetFileNameFromUrl = createGetFileNameFromUrl;
//# sourceMappingURL=getFileAsync.js.map