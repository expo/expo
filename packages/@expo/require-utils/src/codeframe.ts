import url from 'node:url';
import type { Diagnostic } from 'typescript';

function errorToLoc(filename: string, error: Error) {
  if (error.name === 'ReferenceError' || error.name === 'SyntaxError') {
    let stack = `${error.stack || ''}`;
    stack = stack.slice(error.name.length + 2 /* '${name}: ' prefix */);
    stack = stack.slice(error.message.length);
    const trace = stack.match(/at ([^\n]+):(\d+):(\d+)/m);
    if (url.pathToFileURL(filename).href === trace?.[1]) {
      const line = Number(trace[2]);
      return Number.isSafeInteger(line) ? { line, column: Number(trace[3]) || undefined } : null;
    }
  }
  return null;
}

export function formatDiagnostic(diagnostic: Diagnostic | undefined) {
  if (!diagnostic) {
    return null;
  }
  const { start, file, messageText } = diagnostic;
  if (file && messageText && start != null) {
    const { codeFrameColumns }: typeof import('@babel/code-frame') = require('@babel/code-frame');
    const { line, character } = file.getLineAndCharacterOfPosition(start);
    const loc = { line: line + 1, column: character + 1 };
    const codeFrame = codeFrameColumns(file.getText(), { start: loc }, { highlightCode: true });
    const annotatedError = new SyntaxError(`${messageText}\n${codeFrame}`) as SyntaxError & {
      codeFrame: string;
    };
    annotatedError.codeFrame = codeFrame;
    delete annotatedError.stack;
    return annotatedError;
  }
  return null;
}

export function annotateError(code: string | null, filename: string, error: Error) {
  if (typeof error !== 'object' || error == null) {
    return null;
  }
  if (code) {
    const loc = errorToLoc(filename, error);
    if (loc) {
      const { codeFrameColumns }: typeof import('@babel/code-frame') = require('@babel/code-frame');
      const codeFrame = codeFrameColumns(code, { start: loc }, { highlightCode: true });
      const annotatedError = error as Error & { codeFrame: string };
      annotatedError.codeFrame = codeFrame;
      annotatedError.message += `\n${codeFrame}`;
      delete annotatedError.stack;
      return annotatedError;
    }
  }
  return null;
}
