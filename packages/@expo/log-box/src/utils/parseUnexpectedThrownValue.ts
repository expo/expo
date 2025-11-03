/**
 * Copyright (c) 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { parseErrorStack } from './parseErrorStack';
import { ExtendedExceptionData } from '../LogBox';
import { withoutANSIColorStyles } from './withoutANSIStyles';

/**
 * Handles the developer-visible aspect of errors and exceptions
 */
let exceptionID = 0;

/**
 * Logs exceptions to the (native) console and displays them
 */
export function parseUnexpectedThrownValue(error: Error | string): ExtendedExceptionData {
  let e: Error & {
    componentStack?: string;
    jsEngine?: string;
    isComponentError?: boolean;
    originalMessage?: string;
  };
  if (error instanceof Error) {
    e = error;
  } else {
    // Workaround for reporting errors caused by `throw 'some string'`
    // Unfortunately there is no way to figure out the stacktrace in this
    // case, so if you ended up here trying to trace an error, look for
    // `throw '<error message>'` somewhere in your codebase.
    e = new Error(error);
  }

  const stack = parseErrorStack(e?.stack);
  const currentExceptionID = ++exceptionID;

  // Keep the ansi error formatting to the message for CLI/Bundler errors such as missing imports.
  const originalMessage = e.originalMessage || e.message || '';

  // This ensures the console.error has ansi stripped.
  let message = withoutANSIColorStyles(originalMessage);
  if (e.componentStack != null) {
    message += `\n\nThis error is located at:${e.componentStack}`;
  }

  const namePrefix = e.name == null || e.name === '' ? '' : `${e.name}: `;

  if (!message.startsWith(namePrefix)) {
    message = namePrefix + message;
  }

  const data = {
    message,
    originalMessage: message === originalMessage ? undefined : originalMessage,
    name: e.name == null || e.name === '' ? undefined : e.name,
    componentStack: typeof e.componentStack === 'string' ? e.componentStack : undefined,
    stack,
    id: currentExceptionID,
    isFatal: true,
    extraData: {
      jsEngine: e.jsEngine,
      rawStack: e.stack,
    },
  };

  return {
    ...data,
    isComponentError: !!e.isComponentError,
  };
}
