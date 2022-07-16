"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createGetFileNameFromUrl = createGetFileNameFromUrl;
exports.getCompilerForPlatform = getCompilerForPlatform;
exports.getFileFromCompilerAsync = getFileFromCompilerAsync;
exports.getPlatformFromRequest = getPlatformFromRequest;

function _assert() {
  const data = _interopRequireDefault(require("assert"));

  _assert = function () {
    return data;
  };

  return data;
}

function _util() {
  const data = require("webpack-dev-middleware/lib/util");

  _util = function () {
    return data;
  };

  return data;
}

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// @ts-ignore

/**
 * Read a file from the webpack "compiler".
 *
 * @param compiler webpack compiler
 * @param filename Like: `/Users/evanbacon/Documents/GitHub/lab/yolo47/web-build/index.bundle`
 * @returns
 */
function getFileFromCompilerAsync(compiler, {
  fileName,
  platform
}) {
  const platformCompiler = getCompilerForPlatform(compiler, platform);
  return new Promise((resolve, reject) => platformCompiler.outputFileSystem.readFile(fileName, (error, content) => {
    if (error || !content) {
      reject(error);
    } else {
      resolve(content.toString());
    }
  }));
}

function getPlatformFromRequest(request) {
  var _request$url$match$, _request$url, _request$url$match, _request$url$match$ca;

  // Use the expo updates spec to check the platform.
  if (typeof request.headers['expo-platform'] === 'string') {
    var _request$headers$expo;

    return (_request$headers$expo = request.headers['expo-platform']) !== null && _request$headers$expo !== void 0 ? _request$headers$expo : null;
  } // Get the platform from the query params cheaply.


  return (_request$url$match$ = request === null || request === void 0 ? void 0 : (_request$url = request.url) === null || _request$url === void 0 ? void 0 : (_request$url$match = _request$url.match) === null || _request$url$match === void 0 ? void 0 : (_request$url$match$ca = _request$url$match.call(_request$url, /[?|&]platform=(\w+)[&|\\]/)) === null || _request$url$match$ca === void 0 ? void 0 : _request$url$match$ca[1]) !== null && _request$url$match$ !== void 0 ? _request$url$match$ : null;
}
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

  (0, _assert().default)(platform, 'platform must be provided for multi-compiler servers');
  const platformCompiler = compiler.compilers.find(({
    options
  }) => options.name === platform);
  (0, _assert().default)(platformCompiler, `Could not find Webpack compiler for platform: ${platform}`);
  return platformCompiler;
}

function createGetFileNameFromUrl(compiler, publicPath = '/') {
  return function ({
    url,
    platform
  }) {
    const platformCompiler = getCompilerForPlatform(compiler, platform);
    const filename = (0, _util().getFilenameFromUrl)( // public path
    publicPath, platformCompiler, url);

    if (!filename) {
      throw new Error(`Cannot get Webpack file name from url: ${url}`);
    }

    return filename;
  };
}
//# sourceMappingURL=getFileAsync.js.map