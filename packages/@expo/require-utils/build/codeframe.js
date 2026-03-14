"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.annotateError = annotateError;
exports.formatDiagnostic = formatDiagnostic;
function _nodeUrl() {
  const data = _interopRequireDefault(require("node:url"));
  _nodeUrl = function () {
    return data;
  };
  return data;
}
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function errorToLoc(filename, error) {
  if (error.name === 'ReferenceError' || error.name === 'SyntaxError') {
    let stack = `${error.stack || ''}`;
    stack = stack.slice(error.name.length + 2 /* '${name}: ' prefix */);
    stack = stack.slice(error.message.length);
    const trace = stack.match(/at ([^\n]+):(\d+):(\d+)/m);
    if (_nodeUrl().default.pathToFileURL(filename).href === trace?.[1]) {
      const line = Number(trace[2]);
      return Number.isSafeInteger(line) ? {
        line,
        column: Number(trace[3]) || undefined
      } : null;
    }
  }
  return null;
}
function formatDiagnostic(diagnostic) {
  if (!diagnostic) {
    return null;
  }
  const {
    start,
    file,
    messageText
  } = diagnostic;
  if (file && messageText && start != null) {
    const {
      codeFrameColumns
    } = require('@babel/code-frame');
    const {
      line,
      character
    } = file.getLineAndCharacterOfPosition(start);
    const loc = {
      line: line + 1,
      column: character + 1
    };
    const codeFrame = codeFrameColumns(file.getText(), {
      start: loc
    }, {
      highlightCode: true
    });
    const annotatedError = new SyntaxError(`${messageText}\n${codeFrame}`);
    annotatedError.codeFrame = codeFrame;
    delete annotatedError.stack;
    return annotatedError;
  }
  return null;
}
function annotateError(code, filename, error) {
  if (typeof error !== 'object' || error == null) {
    return null;
  }
  if (code) {
    const loc = errorToLoc(filename, error);
    if (loc) {
      const {
        codeFrameColumns
      } = require('@babel/code-frame');
      const codeFrame = codeFrameColumns(code, {
        start: loc
      }, {
        highlightCode: true
      });
      const annotatedError = error;
      annotatedError.codeFrame = codeFrame;
      annotatedError.message += `\n${codeFrame}`;
      delete annotatedError.stack;
      return annotatedError;
    }
  }
  return null;
}
//# sourceMappingURL=codeframe.js.map