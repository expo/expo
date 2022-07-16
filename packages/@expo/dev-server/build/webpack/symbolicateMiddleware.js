"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createSymbolicateMiddleware = createSymbolicateMiddleware;

function _metroConfig() {
  const data = require("@expo/metro-config");

  _metroConfig = function () {
    return data;
  };

  return data;
}

function _path() {
  const data = _interopRequireDefault(require("path"));

  _path = function () {
    return data;
  };

  return data;
}

function _Symbolicator() {
  const data = require("./Symbolicator");

  _Symbolicator = function () {
    return data;
  };

  return data;
}

function _getFileAsync() {
  const data = require("./getFileAsync");

  _getFileAsync = function () {
    return data;
  };

  return data;
}

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Customize the stack frames like we do in Metro projects.
function customizeFrame(frame) {
  let collapse = Boolean(frame.file && _metroConfig().INTERNAL_CALLSITES_REGEX.test(frame.file));

  if (!collapse) {
    var _frame$file;

    // This represents the first frame of the stacktrace.
    // Often this looks like: `__r(0);`.
    // The URL will also be unactionable in the app and therefore not very useful to the developer.
    if (frame.column === 3 && frame.methodName === 'global code' && (_frame$file = frame.file) !== null && _frame$file !== void 0 && _frame$file.match(/^https?:\/\//g)) {
      collapse = true;
    }
  }

  return { ...(frame || {}),
    collapse
  };
}

function createSymbolicateMiddleware({
  projectRoot,
  logger,
  compiler
}) {
  const getFilenameFromUrl = (0, _getFileAsync().createGetFileNameFromUrl)(compiler);
  const symbolicate = new (_Symbolicator().Symbolicator)({
    projectRoot,
    logger,
    customizeFrame,

    async getFileAsync(props) {
      const fileName = getFilenameFromUrl(props);
      return (0, _getFileAsync().getFileFromCompilerAsync)(compiler, {
        fileName,
        platform: props.platform
      });
    },

    async getSourceMapAsync(props) {
      var _exec, _sourceMappingUrl$spl;

      const fileName = getFilenameFromUrl(props);
      const fallbackSourceMapFilename = `${fileName}.map`;
      const bundle = await (0, _getFileAsync().getFileFromCompilerAsync)(compiler, {
        fileName,
        platform: props.platform
      });
      const sourceMappingUrl = (_exec = /sourceMappingURL=(.+)$/.exec(bundle)) === null || _exec === void 0 ? void 0 : _exec[1];
      const sourceMapBasename = sourceMappingUrl === null || sourceMappingUrl === void 0 ? void 0 : (_sourceMappingUrl$spl = sourceMappingUrl.split('?')) === null || _sourceMappingUrl$spl === void 0 ? void 0 : _sourceMappingUrl$spl[0];
      let sourceMapFilename = fallbackSourceMapFilename;

      if (sourceMapBasename) {
        sourceMapFilename = _path().default.join(_path().default.dirname(fileName), sourceMapBasename);
      }

      let parseError = null;

      for (const file of [sourceMapFilename, fallbackSourceMapFilename]) {
        try {
          return await (0, _getFileAsync().getFileFromCompilerAsync)(compiler, {
            fileName: file,
            platform: props.platform
          });
        } catch (error) {
          parseError = error;
          console.warn('Failed to read source map from sourceMappingURL:', file); // logger.warn({ tag: 'dev-server' }, 'Failed to read source map from sourceMappingURL');
        }
      }

      throw parseError;
    }

  });
  return async function (req, res) {
    try {
      var _ref, _getPlatformFromReque;

      if (!req.rawBody) {
        return res.writeHead(400).end('Missing request rawBody.');
      }

      const {
        stack
      } = JSON.parse(req.rawBody);
      const platform = (_ref = (_getPlatformFromReque = (0, _getFileAsync().getPlatformFromRequest)(req)) !== null && _getPlatformFromReque !== void 0 ? _getPlatformFromReque : _Symbolicator().Symbolicator.inferPlatformFromStack(stack)) !== null && _ref !== void 0 ? _ref : 'web';

      if (!platform) {
        return res.writeHead(400).end('Missing expo-platform header, platform query parameter, or platform parameter in source map comment url');
      }

      const parsed = await symbolicate.process(stack, {
        platform
      });
      return res.end(JSON.stringify(parsed));
    } catch (error) {
      console.error(`Failed to symbolicate: ${error} ${error.stack}`); // logger.error({ tag: 'dev-server' }, `Failed to symbolicate: ${error} ${error.stack}`);

      res.statusCode = 500;
      return res.end(JSON.stringify({
        error: error.message
      }));
    }
  };
}
//# sourceMappingURL=symbolicateMiddleware.js.map