/**
 * Copyright (c) 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import parseErrorStack from '../parseErrorStack';

type ExtendedError = any;

class SyntheticError extends Error {
  name: string = '';
}

/**
 * Handles the developer-visible aspect of errors and exceptions
 */
let exceptionID = 0;

function parseException(e: ExtendedError, isFatal: boolean) {
  const stack = parseErrorStack(e?.stack);
  const currentExceptionID = ++exceptionID;
  const originalMessage = e.message || '';
  let message = originalMessage;
  if (e.componentStack != null) {
    message += `\n\nThis error is located at:${e.componentStack}`;
  }
  const namePrefix = e.name == null || e.name === '' ? '' : `${e.name}: `;

  if (!message.startsWith(namePrefix)) {
    message = namePrefix + message;
  }

  message = e.jsEngine == null ? message : `${message}, js engine: ${e.jsEngine}`;

  const data = {
    message,
    originalMessage: message === originalMessage ? null : originalMessage,
    name: e.name == null || e.name === '' ? null : e.name,
    componentStack: typeof e.componentStack === 'string' ? e.componentStack : null,
    stack,
    id: currentExceptionID,
    isFatal,
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

/**
 * Logs exceptions to the (native) console and displays them
 */
function handleException(e: any) {
  let error: Error;
  if (e instanceof Error) {
    error = e;
  } else {
    // Workaround for reporting errors caused by `throw 'some string'`
    // Unfortunately there is no way to figure out the stacktrace in this
    // case, so if you ended up here trying to trace an error, look for
    // `throw '<error message>'` somewhere in your codebase.
    error = new SyntheticError(e);
  }

  require('../../LogBox').default.addException(parseException(error, true));
}

const ErrorUtils = {
  parseException,
  handleException,
  SyntheticError,
};

export default ErrorUtils;
