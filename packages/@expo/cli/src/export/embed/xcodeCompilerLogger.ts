/**
 * Copyright © 2023 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import fs from 'fs';
import path from 'path';

import { Log } from '../../log';

function isPossiblyUnableToResolveError(
  error: any
): error is { message: string; originModulePath: string; targetModuleName: string } {
  return (
    'message' in error &&
    typeof error.message === 'string' &&
    'originModulePath' in error &&
    typeof error.originModulePath === 'string' &&
    'targetModuleName' in error &&
    typeof error.targetModuleName === 'string'
  );
}
function isPossiblyTransformError(
  error: any
): error is { message: string; filename: string; lineNumber: number; column?: number } {
  return (
    'message' in error &&
    typeof error.message === 'string' &&
    'filename' in error &&
    typeof error.filename === 'string' &&
    'lineNumber' in error &&
    typeof error.lineNumber === 'number'
  );
}

export function getXcodeCompilerErrorMessage(
  projectRoot: string,
  error: Error | any
): string | null {
  const makeFilepathAbsolute = (filepath: string) =>
    filepath.startsWith('/') ? filepath : path.join(projectRoot, filepath);

  if (typeof error === 'string') {
    return makeXcodeCompilerLog('error', error);
  } else if ('message' in error) {
    // Metro's `UnableToResolveError`
    if (isPossiblyUnableToResolveError(error)) {
      const loc = getLineNumberForStringInFile(error.originModulePath, error.targetModuleName);
      return makeXcodeCompilerLog('error', error.message, {
        fileName: error.originModulePath,
        lineNumber: loc?.lineNumber,
        column: loc?.column,
      });
    } else if (isPossiblyTransformError(error)) {
      return makeXcodeCompilerLog('error', error.message, {
        // Metro generally returns the filename as relative from the project root.
        fileName: makeFilepathAbsolute(error.filename),
        lineNumber: error.lineNumber,
        column: error.column,
      });
      // TODO: ResourceNotFoundError, GraphNotFoundError, RevisionNotFoundError, AmbiguousModuleResolutionError
    } else {
      // Unknown error
      return makeXcodeCompilerLog('error', error.message);
    }
  }

  return null;
}

/** Log an error that can be parsed by Xcode and related build tools https://developer.apple.com/documentation/xcode/running-custom-scripts-during-a-build#Log-errors-and-warnings-from-your-script */
export function logMetroErrorInXcode(projectRoot: string, error: Error | string) {
  const message = getXcodeCompilerErrorMessage(projectRoot, error);
  if (message != null) {
    console.error(message);
  }
}

export function logInXcode(message: string) {
  Log.log(makeXcodeCompilerLog('note', message));
}

export function warnInXcode(message: string) {
  Log.warn(makeXcodeCompilerLog('warning', message));
}

// Detect running in xcode build script. This means the logs need to be formatted in a way that Xcode can parse them, it also means that the shell is not reliable or interactive.
// https://developer.apple.com/documentation/xcode/running-custom-scripts-during-a-build#Access-script-related-files-from-environment-variables
export function isExecutingFromXcodebuild() {
  return !!process.env.BUILT_PRODUCTS_DIR;
}

function makeXcodeCompilerLog(
  type: 'error' | 'fatal error' | 'warning' | 'note',
  message: string,
  {
    fileName,
    lineNumber,
    column,
  }: {
    /** Absolute file path to link to in Xcode. */
    fileName?: string;
    lineNumber?: number;
    column?: number;
  } = {}
) {
  if (!isExecutingFromXcodebuild()) {
    return message;
  }
  // TODO: Figure out how to support multi-line logs.
  const firstLine = message.split('\n')[0];
  if (fileName && !fileName?.includes(':')) {
    return `${fileName}:${lineNumber || 0}:${
      column != null ? column + ':' : ''
    } ${type}: ${firstLine}`;
  }
  return `${type}: ${firstLine}`;
}

// TODO: Metro doesn't expose this info even though it knows it.
function getLineNumberForStringInFile(originModulePath: string, targetModuleName: string) {
  let file;
  try {
    file = fs.readFileSync(originModulePath, 'utf8');
  } catch (error: any) {
    if (error.code === 'ENOENT' || error.code === 'EISDIR') {
      // We're probably dealing with a virtualised file system where
      // `this.originModulePath` doesn't actually exist on disk.
      // We can't show a code frame, but there's no need to let this I/O
      // error shadow the original module resolution error.
      return null;
    }
    throw error;
  }
  const lines = file.split('\n');
  let lineNumber = 0;
  let column = -1;
  for (let line = 0; line < lines.length; line++) {
    const columnLocation = lines[line].lastIndexOf(targetModuleName);
    if (columnLocation >= 0) {
      lineNumber = line;
      column = columnLocation;
      break;
    }
  }
  return { lineNumber, column };
}
