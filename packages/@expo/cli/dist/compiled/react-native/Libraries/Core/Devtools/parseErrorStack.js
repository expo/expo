'use strict';

var parseHermesStack = require('./parseHermesStack');
function convertHermesStack(stack) {
  var frames = [];
  for (var entry of stack.entries) {
    if (entry.type !== 'FRAME') {
      continue;
    }
    var location = entry.location,
      functionName = entry.functionName;
    if (location.type === 'NATIVE' || location.type === 'INTERNAL_BYTECODE') {
      continue;
    }
    frames.push({
      methodName: functionName,
      file: location.sourceUrl,
      lineNumber: location.line1Based,
      column: location.type === 'SOURCE' ? location.column1Based - 1 : location.virtualOffset0Based
    });
  }
  return frames;
}
function parseErrorStack(errorStack) {
  if (errorStack == null) {
    return [];
  }
  var stacktraceParser = require('stacktrace-parser');
  var parsedStack = Array.isArray(errorStack) ? errorStack : global.HermesInternal ? convertHermesStack(parseHermesStack(errorStack)) : stacktraceParser.parse(errorStack).map(function (frame) {
    return Object.assign({}, frame, {
      column: frame.column != null ? frame.column - 1 : null
    });
  });
  return parsedStack;
}
module.exports = parseErrorStack;
//# sourceMappingURL=parseErrorStack.js.map