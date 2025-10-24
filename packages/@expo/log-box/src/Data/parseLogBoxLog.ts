/**
 * Copyright (c) 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';

import type { Category, LogBoxLogData, Message, MetroStackFrame } from './Types';
import {
  parseBabelCodeFrameError,
  parseBabelTransformError,
  type ParsedBuildError,
  parseMetroError,
} from '../utils/metroBuildErrorsFormat';
import { parseErrorStack } from '../utils/parseErrorStack';

type ExceptionData = {
  message: string;
  originalMessage: string | undefined;
  name: string | undefined;
  componentStack: string | undefined;
  stack: {
    column: number | null;
    file: string | null;
    lineNumber: number | null;
    methodName: string;
    collapse?: boolean;
  }[];
  id: number;
  isFatal: boolean;
  extraData?: Record<string, unknown>;
  [key: string]: unknown;
};

export type ExtendedExceptionData = ExceptionData & {
  isComponentError: boolean;
  [key: string]: any;
};

const SUBSTITUTION = '\ufeff%s';

// https://github.com/krystofwoldrich/react-native/blob/7db31e2fca0f828aa6bf489ae6dc4adef9b7b7c3/packages/react-native/Libraries/LogBox/Data/parseLogBoxLog.js#L130
// In RN the original is not used outside of this file.
// TODO: Get rid of this. The substitution logic is wild.
export function parseInterpolation(args: readonly any[]): {
  category: Category;
  message: Message;
} {
  const categoryParts: string[] = [];
  const contentParts: string[] = [];
  const substitutionOffsets: { length: number; offset: number }[] = [];

  const remaining = [...args];
  if (typeof remaining[0] === 'string') {
    const formatString = String(remaining.shift());
    const formatStringParts = formatString.split('%s');
    const substitutionCount = formatStringParts.length - 1;
    const substitutions = remaining.splice(0, substitutionCount);

    let categoryString = '';
    let contentString = '';

    let substitutionIndex = 0;
    for (const formatStringPart of formatStringParts) {
      categoryString += formatStringPart;
      contentString += formatStringPart;

      if (substitutionIndex < substitutionCount) {
        if (substitutionIndex < substitutions.length) {
          // Don't stringify a string type.
          // It adds quotation mark wrappers around the string,
          // which causes the LogBox to look odd.
          const substitution =
            typeof substitutions[substitutionIndex] === 'string'
              ? substitutions[substitutionIndex]
              : stringifySafe(substitutions[substitutionIndex]);
          substitutionOffsets.push({
            length: substitution.length,
            offset: contentString.length,
          });

          categoryString += SUBSTITUTION;
          contentString += substitution;
        } else {
          substitutionOffsets.push({
            length: 2,
            offset: contentString.length,
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

  const remainingArgs = remaining.map((arg) => {
    // Don't stringify a string type.
    // It adds quotation mark wrappers around the string,
    // which causes the LogBox to look odd.
    return typeof arg === 'string' ? arg : stringifySafe(arg);
  });
  categoryParts.push(...remainingArgs);
  contentParts.push(...remainingArgs);

  return {
    category: categoryParts.join(' '),
    message: {
      content: contentParts.join(' '),
      substitutions: substitutionOffsets,
    },
  };
}

export function parseLogBoxException(error: ExtendedExceptionData): LogBoxLogData {
  const message = error.originalMessage != null ? error.originalMessage : 'Unknown';
  let parsed: ParsedBuildError | null = null;

  if ((parsed = parseMetroError(message))) {
    const { content, fileName, row, column, codeFrame } = parsed;
    return {
      level: 'fatal',
      type: 'Metro Error',
      stack: [],
      isComponentError: false,
      componentStack: [],
      codeFrame: {
        stack: {
          fileName,
          location: {
            row,
            column,
          },
          content: codeFrame,
        },
      },
      message: {
        content,
        substitutions: [],
      },
      category: `${fileName}-${row}-${column}`,
      extraData: error.extraData,
    };
  }

  if ((parsed = parseBabelTransformError(message))) {
    // Transform errors are thrown from inside the Babel transformer.
    const { fileName, content, row, column, codeFrame } = parsed;

    return {
      level: 'syntax',
      stack: [],
      isComponentError: false,
      componentStack: [],
      codeFrame: {
        stack: {
          fileName,
          location: {
            row,
            column,
          },
          content: codeFrame,
        },
      },
      message: {
        content,
        substitutions: [],
      },
      category: `${fileName}-${row}-${column}`,
      extraData: error.extraData,
    };
  }

  if ((parsed = parseBabelCodeFrameError(message))) {
    const { fileName, content, codeFrame } = parsed;

    return {
      level: 'syntax',
      stack: [],
      isComponentError: false,
      componentStack: [],
      codeFrame: {
        stack: {
          fileName,
          location: null, // We are not given the location.
          content: codeFrame,
        },
      },
      message: {
        content,
        substitutions: [],
      },
      category: `${fileName}-${1}-${1}`,
      extraData: error.extraData,
    };
  }

  if (message.match(/^TransformError /)) {
    return {
      level: 'syntax',
      stack: error.stack,
      isComponentError: error.isComponentError,
      componentStack: [],
      codeFrame: {},
      message: {
        content: message,
        substitutions: [],
      },
      category: message,
      extraData: error.extraData,
    };
  }

  const componentStack = error.componentStack;
  if (error.isFatal || error.isComponentError) {
    return {
      level: 'fatal',
      stack: error.stack,
      codeFrame: {},
      isComponentError: error.isComponentError,
      componentStack: componentStack != null ? parseErrorStack(componentStack) : [],
      extraData: error.extraData,
      ...parseInterpolation([message]),
    };
  }

  if (componentStack != null) {
    // It is possible that console errors have a componentStack.
    return {
      level: 'error',
      stack: error.stack,
      codeFrame: {},
      isComponentError: error.isComponentError,
      componentStack: parseErrorStack(componentStack),
      extraData: error.extraData,
      ...parseInterpolation([message]),
    };
  }

  // Most `console.error` calls won't have a componentStack. We parse them like
  // regular logs which have the component stack buried in the message.
  return {
    level: 'error',
    stack: error.stack,
    codeFrame: {},
    isComponentError: error.isComponentError,
    extraData: error.extraData,
    ...parseLogBoxLog([message]),
  };
}

function interpolateLikeConsole(...args: any[]) {
  let output = '';

  if (typeof args[0] === 'string') {
    const format = args[0];
    const rest = args.slice(1);
    let argIndex = 0;

    // TODO: %c for colors
    output = format.replace(/%[sdifoO%]/g, (match) => {
      if (match === '%%') return '%'; // escape %%
      const arg = rest[argIndex++];
      switch (match) {
        case '%s':
          return String(arg);
        case '%d':
        case '%i':
          return parseInt(arg, 10).toString();
        case '%f':
          return parseFloat(arg).toString();
        case '%o':
        case '%O':
          return stringifySafe(arg);
        default:
          return match;
      }
    });

    // Append any remaining arguments
    for (; argIndex < rest.length; argIndex++) {
      const arg = rest[argIndex];
      output +=
        ' ' +
        (typeof arg === 'object'
          ? arg instanceof Error
            ? arg.stack || arg.toString()
            : JSON.stringify(arg, null, 2)
          : String(arg));
    }
  } else {
    // No format string, just join args with spaces
    output = args.map((arg) => stringifySafe(arg)).join(' ');
  }

  return output;
}

export function isError(err: any): err is Error {
  return typeof err === 'object' && err !== null && 'name' in err && 'message' in err;
}

export function parseLogBoxLog(args: any[]): {
  componentStack: MetroStackFrame[];
  category: Category;
  message: Message;
} {
  // React will pass a full error object to the console.error function.
  // https://github.com/facebook/react/blob/c44e4a250557e53b120e40db8b01fb5fd93f1e35/packages/react-reconciler/src/ReactFiberErrorLogger.js#L105
  // But we can't be sure at which order, so we'll check all arguments.
  let error: Error | undefined;
  for (const arg of args) {
    if (isError(arg)) {
      error = arg;
      break;
    }
  }

  // Create a string representation of the error arguments.
  const message = interpolateLikeConsole(...args);
  // If no error was passed, create a new Error object with the message.
  if (!isError(error)) {
    error = new Error(message);
  }

  // Use the official stack from componentDidCatch
  if ('componentStack' in error) {
    // @ts-expect-error
    error.stack = error.componentStack;
  } else {
    // Try to capture owner stack now if missing.
    error.stack = React.captureOwnerStack() || undefined;
  }

  return {
    componentStack: parseErrorStack(error.stack ?? ''),
    category: error.message,
    message: {
      content: message,
      substitutions: [],
    },
  };
}

/**
 * Tries to stringify with JSON.stringify and toString, but catches exceptions
 * (e.g. from circular objects) and always returns a string and never throws.
 */
function createStringifySafeWithLimits(limits: {
  maxDepth?: number;
  maxStringLimit?: number;
  maxArrayLimit?: number;
  maxObjectKeysLimit?: number;
}): (foo: any) => string {
  const {
    maxDepth = Number.POSITIVE_INFINITY,
    maxStringLimit = Number.POSITIVE_INFINITY,
    maxArrayLimit = Number.POSITIVE_INFINITY,
    maxObjectKeysLimit = Number.POSITIVE_INFINITY,
  } = limits;
  const stack: any[] = [];
  function replacer(this: unknown, _key: string, value: any): any {
    while (stack.length && this !== stack[0]) {
      stack.shift();
    }

    if (typeof value === 'string') {
      const truncatedString = '...(truncated)...';
      if (value.length > maxStringLimit + truncatedString.length) {
        return value.substring(0, maxStringLimit) + truncatedString;
      }
      return value;
    }
    if (typeof value !== 'object' || value === null) {
      return value;
    }

    let retval = value;
    if (Array.isArray(value)) {
      if (stack.length >= maxDepth) {
        retval = `[ ... array with ${value.length} values ... ]`;
      } else if (value.length > maxArrayLimit) {
        retval = value
          .slice(0, maxArrayLimit)
          .concat([`... extra ${value.length - maxArrayLimit} values truncated ...`]);
      }
    } else {
      // Add refinement after Array.isArray call.
      if (typeof value !== 'object') {
        throw new Error('This was already found earlier');
      }
      const keys = Object.keys(value);
      if (stack.length >= maxDepth) {
        retval = `{ ... object with ${keys.length} keys ... }`;
      } else if (keys.length > maxObjectKeysLimit) {
        // Return a sample of the keys.
        retval = {};
        for (const k of keys.slice(0, maxObjectKeysLimit)) {
          retval[k] = value[k];
        }
        const truncatedKey = '...(truncated keys)...';
        retval[truncatedKey] = keys.length - maxObjectKeysLimit;
      }
    }
    stack.unshift(retval);
    return retval;
  }

  return function stringifySafe(arg: any): string {
    if (arg === undefined) {
      return 'undefined';
    } else if (arg === null) {
      return 'null';
    } else if (typeof arg === 'function') {
      try {
        return arg.toString();
      } catch {
        return '[function unknown]';
      }
    } else if (arg instanceof Error) {
      return arg.message;
      // return arg.name + ': ' + arg.message;
    } else {
      // Perform a try catch, just in case the object has a circular
      // reference or stringify throws for some other reason.
      try {
        const ret = JSON.stringify(arg, replacer);
        if (ret === undefined) {
          return '["' + typeof arg + '" failed to stringify]';
        }
        return ret;
      } catch {
        if (typeof arg.toString === 'function') {
          try {
            // $FlowFixMe[incompatible-use] : toString shouldn't take any arguments in general.
            return arg.toString();
          } catch {}
        }
      }
    }
    return '["' + typeof arg + '" failed to stringify]';
  };
}

const stringifySafe = createStringifySafeWithLimits({
  maxDepth: 10,
  maxStringLimit: 100,
  maxArrayLimit: 50,
  maxObjectKeysLimit: 50,
});
