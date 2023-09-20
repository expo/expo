var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.parseComponentStack = parseComponentStack;
exports.parseInterpolation = parseInterpolation;
exports.parseLogBoxException = parseLogBoxException;
exports.parseLogBoxLog = parseLogBoxLog;
var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));
var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));
var _parseErrorStack = _interopRequireDefault(require("../../Core/Devtools/parseErrorStack"));
var _UTFSequence = _interopRequireDefault(require("../../UTFSequence"));
var _stringifySafe = _interopRequireDefault(require("../../Utilities/stringifySafe"));
var BABEL_TRANSFORM_ERROR_FORMAT = /^(?:TransformError )?(?:SyntaxError: |ReferenceError: )(.*): (.*) \((\d+):(\d+)\)\n\n([\s\S]+)/;
var BABEL_CODE_FRAME_ERROR_FORMAT = /^(?:TransformError )?(?:(?:[\0-\t\x0B\f\x0E-\u2027\u202A-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])*):? (?:(?:[\0-\t\x0B\f\x0E-\u2027\u202A-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])*?)(\/(?:[\0-\t\x0B\f\x0E-\u2027\u202A-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])*): ((?:[\0-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])+?)\n([ >]{2}[\t-\r 0-9\xA0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000\uFEFF]+ \|(?:[\0-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])+|\x1B(?:[\0-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])+)/;
var METRO_ERROR_FORMAT = /^(?:InternalError Metro has encountered an error:) ((?:[\0-\t\x0B\f\x0E-\u2027\u202A-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])*): ((?:[\0-\t\x0B\f\x0E-\u2027\u202A-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])*) \(([0-9]+):([0-9]+)\)\n\n((?:[\0-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])+)/;
var SUBSTITUTION = _UTFSequence.default.BOM + '%s';
function parseInterpolation(args) {
  var categoryParts = [];
  var contentParts = [];
  var substitutionOffsets = [];
  var remaining = (0, _toConsumableArray2.default)(args);
  if (typeof remaining[0] === 'string') {
    var formatString = String(remaining.shift());
    var formatStringParts = formatString.split('%s');
    var substitutionCount = formatStringParts.length - 1;
    var substitutions = remaining.splice(0, substitutionCount);
    var categoryString = '';
    var contentString = '';
    var substitutionIndex = 0;
    for (var formatStringPart of formatStringParts) {
      categoryString += formatStringPart;
      contentString += formatStringPart;
      if (substitutionIndex < substitutionCount) {
        if (substitutionIndex < substitutions.length) {
          var substitution = typeof substitutions[substitutionIndex] === 'string' ? substitutions[substitutionIndex] : (0, _stringifySafe.default)(substitutions[substitutionIndex]);
          substitutionOffsets.push({
            length: substitution.length,
            offset: contentString.length
          });
          categoryString += SUBSTITUTION;
          contentString += substitution;
        } else {
          substitutionOffsets.push({
            length: 2,
            offset: contentString.length
          });
          categoryString += '%s';
          contentString += '%s';
        }
        substitutionIndex++;
      }
    }
    categoryParts.push(categoryString);
    contentParts.push(contentString);
  }
  var remainingArgs = remaining.map(function (arg) {
    return typeof arg === 'string' ? arg : (0, _stringifySafe.default)(arg);
  });
  categoryParts.push.apply(categoryParts, (0, _toConsumableArray2.default)(remainingArgs));
  contentParts.push.apply(contentParts, (0, _toConsumableArray2.default)(remainingArgs));
  return {
    category: categoryParts.join(' '),
    message: {
      content: contentParts.join(' '),
      substitutions: substitutionOffsets
    }
  };
}
function isComponentStack(consoleArgument) {
  var isOldComponentStackFormat = / {4}in/.test(consoleArgument);
  var isNewComponentStackFormat = / {4}at/.test(consoleArgument);
  var isNewJSCComponentStackFormat = /@.*\n/.test(consoleArgument);
  return isOldComponentStackFormat || isNewComponentStackFormat || isNewJSCComponentStackFormat;
}
function parseComponentStack(message) {
  var stack = (0, _parseErrorStack.default)(message);
  if (stack && stack.length > 0) {
    return stack.map(function (frame) {
      return {
        content: frame.methodName,
        collapse: frame.collapse || false,
        fileName: frame.file == null ? 'unknown' : frame.file,
        location: {
          column: frame.column == null ? -1 : frame.column,
          row: frame.lineNumber == null ? -1 : frame.lineNumber
        }
      };
    });
  }
  return message.split(/\n {4}in /g).map(function (s) {
    if (!s) {
      return null;
    }
    var match = s.match(/(.*) \(at (.*\.js):([\d]+)\)/);
    if (!match) {
      return null;
    }
    var _match$slice = match.slice(1),
      _match$slice2 = (0, _slicedToArray2.default)(_match$slice, 3),
      content = _match$slice2[0],
      fileName = _match$slice2[1],
      row = _match$slice2[2];
    return {
      content: content,
      fileName: fileName,
      location: {
        column: -1,
        row: parseInt(row, 10)
      }
    };
  }).filter(Boolean);
}
function parseLogBoxException(error) {
  var message = error.originalMessage != null ? error.originalMessage : 'Unknown';
  var metroInternalError = message.match(METRO_ERROR_FORMAT);
  if (metroInternalError) {
    var _metroInternalError$s = metroInternalError.slice(1),
      _metroInternalError$s2 = (0, _slicedToArray2.default)(_metroInternalError$s, 5),
      content = _metroInternalError$s2[0],
      fileName = _metroInternalError$s2[1],
      row = _metroInternalError$s2[2],
      column = _metroInternalError$s2[3],
      codeFrame = _metroInternalError$s2[4];
    return {
      level: 'fatal',
      type: 'Metro Error',
      stack: [],
      isComponentError: false,
      componentStack: [],
      codeFrame: {
        fileName: fileName,
        location: {
          row: parseInt(row, 10),
          column: parseInt(column, 10)
        },
        content: codeFrame
      },
      message: {
        content: content,
        substitutions: []
      },
      category: `${fileName}-${row}-${column}`
    };
  }
  var babelTransformError = message.match(BABEL_TRANSFORM_ERROR_FORMAT);
  if (babelTransformError) {
    var _babelTransformError$ = babelTransformError.slice(1),
      _babelTransformError$2 = (0, _slicedToArray2.default)(_babelTransformError$, 5),
      _fileName = _babelTransformError$2[0],
      _content = _babelTransformError$2[1],
      _row = _babelTransformError$2[2],
      _column = _babelTransformError$2[3],
      _codeFrame = _babelTransformError$2[4];
    return {
      level: 'syntax',
      stack: [],
      isComponentError: false,
      componentStack: [],
      codeFrame: {
        fileName: _fileName,
        location: {
          row: parseInt(_row, 10),
          column: parseInt(_column, 10)
        },
        content: _codeFrame
      },
      message: {
        content: _content,
        substitutions: []
      },
      category: `${_fileName}-${_row}-${_column}`
    };
  }
  var babelCodeFrameError = message.match(BABEL_CODE_FRAME_ERROR_FORMAT);
  if (babelCodeFrameError) {
    var _babelCodeFrameError$ = babelCodeFrameError.slice(1),
      _babelCodeFrameError$2 = (0, _slicedToArray2.default)(_babelCodeFrameError$, 3),
      _fileName2 = _babelCodeFrameError$2[0],
      _content2 = _babelCodeFrameError$2[1],
      _codeFrame2 = _babelCodeFrameError$2[2];
    return {
      level: 'syntax',
      stack: [],
      isComponentError: false,
      componentStack: [],
      codeFrame: {
        fileName: _fileName2,
        location: null,
        content: _codeFrame2
      },
      message: {
        content: _content2,
        substitutions: []
      },
      category: `${_fileName2}-${1}-${1}`
    };
  }
  if (message.match(/^TransformError /)) {
    return {
      level: 'syntax',
      stack: error.stack,
      isComponentError: error.isComponentError,
      componentStack: [],
      message: {
        content: message,
        substitutions: []
      },
      category: message
    };
  }
  var componentStack = error.componentStack;
  if (error.isFatal || error.isComponentError) {
    return Object.assign({
      level: 'fatal',
      stack: error.stack,
      isComponentError: error.isComponentError,
      componentStack: componentStack != null ? parseComponentStack(componentStack) : []
    }, parseInterpolation([message]));
  }
  if (componentStack != null) {
    return Object.assign({
      level: 'error',
      stack: error.stack,
      isComponentError: error.isComponentError,
      componentStack: parseComponentStack(componentStack)
    }, parseInterpolation([message]));
  }
  return Object.assign({
    level: 'error',
    stack: error.stack,
    isComponentError: error.isComponentError
  }, parseLogBoxLog([message]));
}
function parseLogBoxLog(args) {
  var message = args[0];
  var argsWithoutComponentStack = [];
  var componentStack = [];
  if (typeof message === 'string' && message.slice(-2) === '%s' && args.length > 0) {
    var lastArg = args[args.length - 1];
    if (typeof lastArg === 'string' && isComponentStack(lastArg)) {
      argsWithoutComponentStack = args.slice(0, -1);
      argsWithoutComponentStack[0] = message.slice(0, -2);
      componentStack = parseComponentStack(lastArg);
    }
  }
  if (componentStack.length === 0) {
    for (var arg of args) {
      if (typeof arg === 'string' && isComponentStack(arg)) {
        var messageEndIndex = arg.search(/\n {4}(in|at) /);
        if (messageEndIndex < 0) {
          messageEndIndex = arg.search(/\n/);
        }
        if (messageEndIndex > 0) {
          argsWithoutComponentStack.push(arg.slice(0, messageEndIndex));
        }
        componentStack = parseComponentStack(arg);
      } else {
        argsWithoutComponentStack.push(arg);
      }
    }
  }
  return Object.assign({}, parseInterpolation(argsWithoutComponentStack), {
    componentStack: componentStack
  });
}
//# sourceMappingURL=parseLogBoxLog.js.map