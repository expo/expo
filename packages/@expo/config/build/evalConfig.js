"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.evalConfig = evalConfig;
exports.resolveConfigExport = resolveConfigExport;
function _fs() {
  const data = require("fs");
  _fs = function () {
    return data;
  };
  return data;
}
function _requireFromString() {
  const data = _interopRequireDefault(require("require-from-string"));
  _requireFromString = function () {
    return data;
  };
  return data;
}
function _sucrase() {
  const data = require("sucrase");
  _sucrase = function () {
    return data;
  };
  return data;
}
function _Errors() {
  const data = require("./Errors");
  _Errors = function () {
    return data;
  };
  return data;
}
function _Serialize() {
  const data = require("./Serialize");
  _Serialize = function () {
    return data;
  };
  return data;
}
function _environment() {
  const data = require("./environment");
  _environment = function () {
    return data;
  };
  return data;
}
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
/**
 * Transpile and evaluate the dynamic config object.
 * This method is shared between the standard reading method in getConfig, and the headless script.
 *
 * @param options configFile path to the dynamic app.config.*, request to send to the dynamic config if it exports a function.
 * @returns the serialized and evaluated config along with the exported object type (object or function).
 */
function evalConfig(configFile, request) {
  const contents = (0, _fs().readFileSync)(configFile, 'utf8');
  let result;
  try {
    const {
      code
    } = (0, _sucrase().transform)(contents, {
      filePath: configFile,
      transforms: ['typescript', 'imports']
    });
    result = (0, _requireFromString().default)(code, configFile);
  } catch (error) {
    const location = extractLocationFromSyntaxError(error);

    // Apply a code frame preview to the error if possible, sucrase doesn't do this by default.
    if (location) {
      const {
        codeFrameColumns
      } = require('@babel/code-frame');
      const codeFrame = codeFrameColumns(contents, {
        start: error.loc
      }, {
        highlightCode: true
      });
      error.codeFrame = codeFrame;
      error.message += `\n${codeFrame}`;
    } else {
      const importantStack = extractImportantStackFromNodeError(error);
      if (importantStack) {
        error.message += `\n${importantStack}`;
      }
    }
    throw error;
  }
  return resolveConfigExport(result, configFile, request);
}
function extractLocationFromSyntaxError(error) {
  // sucrase provides the `loc` object
  if (error.loc) {
    return error.loc;
  }

  // `SyntaxError`s provide the `lineNumber` and `columnNumber` properties
  if ('lineNumber' in error && 'columnNumber' in error) {
    return {
      line: error.lineNumber,
      column: error.columnNumber
    };
  }
  return null;
}

// These kinda errors often come from syntax errors in files that were imported by the main file.
// An example is a module that includes an import statement.
function extractImportantStackFromNodeError(error) {
  if (isSyntaxError(error)) {
    const traces = error.stack?.split('\n').filter(line => !line.startsWith('    at '));
    if (!traces) return null;

    // Remove redundant line
    if (traces[traces.length - 1].startsWith('SyntaxError:')) {
      traces.pop();
    }
    return traces.join('\n');
  }
  return null;
}
function isSyntaxError(error) {
  return error instanceof SyntaxError || error.constructor.name === 'SyntaxError';
}

/**
 * - Resolve the exported contents of an Expo config (be it default or module.exports)
 * - Assert no promise exports
 * - Return config type
 * - Serialize config
 *
 * @param result
 * @param configFile
 * @param request
 */
function resolveConfigExport(result, configFile, request) {
  // add key to static config that we'll check for after the dynamic is evaluated
  // to see if the static config was used in determining the dynamic
  const hasBaseStaticConfig = _environment().NON_STANDARD_SYMBOL;
  if (request?.config) {
    // @ts-ignore
    request.config[hasBaseStaticConfig] = true;
  }
  if (result.default != null) {
    result = result.default;
  }
  const exportedObjectType = typeof result;
  if (typeof result === 'function') {
    result = result(request);
  }
  if (result instanceof Promise) {
    throw new (_Errors().ConfigError)(`Config file ${configFile} cannot return a Promise.`, 'INVALID_CONFIG');
  }

  // If the key is not added, it suggests that the static config was not used as the base for the dynamic.
  // note(Keith): This is the most common way to use static and dynamic config together, but not the only way.
  // Hence, this is only output from getConfig() for informational purposes for use by tools like Expo Doctor
  // to suggest that there *may* be a problem.
  const mayHaveUnusedStaticConfig =
  // @ts-ignore
  request?.config?.[hasBaseStaticConfig] && !result?.[hasBaseStaticConfig];
  if (result) {
    delete result._hasBaseStaticConfig;
  }

  // If the expo object exists, ignore all other values.
  if (result?.expo) {
    result = (0, _Serialize().serializeSkippingMods)(result.expo);
  } else {
    result = (0, _Serialize().serializeSkippingMods)(result);
  }
  return {
    config: result,
    exportedObjectType,
    mayHaveUnusedStaticConfig
  };
}
//# sourceMappingURL=evalConfig.js.map