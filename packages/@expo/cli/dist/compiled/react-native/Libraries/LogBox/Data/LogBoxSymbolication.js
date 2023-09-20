var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.deleteStack = deleteStack;
exports.symbolicate = symbolicate;
var _symbolicateStackTrace = _interopRequireDefault(require("../../Core/Devtools/symbolicateStackTrace"));
var cache = new Map();
var sanitize = function sanitize(_ref) {
  var maybeStack = _ref.stack,
    codeFrame = _ref.codeFrame;
  if (!Array.isArray(maybeStack)) {
    throw new Error('Expected stack to be an array.');
  }
  var stack = [];
  for (var maybeFrame of maybeStack) {
    var collapse = false;
    if ('collapse' in maybeFrame) {
      if (typeof maybeFrame.collapse !== 'boolean') {
        throw new Error('Expected stack frame `collapse` to be a boolean.');
      }
      collapse = maybeFrame.collapse;
    }
    stack.push({
      column: maybeFrame.column,
      file: maybeFrame.file,
      lineNumber: maybeFrame.lineNumber,
      methodName: maybeFrame.methodName,
      collapse: collapse
    });
  }
  return {
    stack: stack,
    codeFrame: codeFrame
  };
};
function deleteStack(stack) {
  cache.delete(stack);
}
function symbolicate(stack) {
  var promise = cache.get(stack);
  if (promise == null) {
    promise = (0, _symbolicateStackTrace.default)(stack).then(sanitize);
    cache.set(stack, promise);
  }
  return promise;
}
//# sourceMappingURL=LogBoxSymbolication.js.map