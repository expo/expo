import * as path from 'node:path';

import { MetroPackageResolutionError } from '../Data/BuildErrors';
import { LogBoxLogDataLegacy, MetroStackFrame } from '../Data/Types';

export function parseWebBuildErrors({
  error,
  projectRoot,
  parseErrorStack,
}: {
  error: Error & { type?: unknown };
  projectRoot: string;
  parseErrorStack: (
    projectRoot: string,
    stack?: string
  ) => (MetroStackFrame & { collapse?: boolean })[];
}): LogBoxLogDataLegacy {
  // NOTE: Ideally this will be merged with the parseWebHmrBuildErrors function

  // Remap direct Metro Node.js errors to a format that will appear more client-friendly in the logbox UI.
  let stack: MetroStackFrame[] | undefined;
  if (isTransformError(error) && error.filename) {
    // Syntax errors in static rendering.
    stack = [
      {
        file: path.join(projectRoot, error.filename),
        methodName: '<unknown>',
        arguments: [],
        // TODO: Import stack
        lineNumber: error.lineNumber,
        column: error.column,
      },
    ];
  } else if (
    'originModulePath' in error &&
    typeof error.originModulePath === 'string' &&
    'targetModuleName' in error &&
    typeof error.targetModuleName === 'string' &&
    'cause' in error
  ) {
    const message = [error.type, error.message].filter(Boolean).join(' ');

    const type: string | undefined = (error as any).type;
    const errors: any[] | undefined = (error as any).errors;
    // TODO: Use import stack here when the error is resolution based.
    return new MetroPackageResolutionError(
      message,
      type,
      errors,
      error.originModulePath,
      error.targetModuleName,
      error.cause as any
    ).toLogBoxLogDataLegacy();
  } else {
    stack = parseErrorStack(projectRoot, error.stack);
  }

  return {
    level: 'static',
    message: {
      content: error.message,
      substitutions: [],
    },
    isComponentError: false,
    stack,
    category: 'static',
    componentStack: [],
  };
}

function isTransformError(
  error: any
): error is { type: 'TransformError'; filename: string; lineNumber: number; column: number } {
  return error.type === 'TransformError';
}
