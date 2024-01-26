// Similar interface to the one used in expo modules.
type CodedError = Error & { code?: string };

let isErrorHandlingEnabled = true;
let wasHit = false; // whether the original error handler was called

const unavailableErrorPossibleSolutions = `Some possible solutions:
- Make sure that the method is available on the current platform.
- Make sure you're using the newest available version of this development client.
- Make sure you're running a compatible version of your JavaScript code.
- If you've installed a new library recently, you may need to make a new development client build.`;

const moduleIsMissingPossibleSolutions = `Some possible solutions:
- Make sure you're using the newest available version of this development client.
- Make sure you're running a compatible version of your JavaScript code.
- If you've installed a new library recently, you may need to make a new development client build.`;

function customizeUnavailableMessage(error: CodedError) {
  error.message += '\n\n' + unavailableErrorPossibleSolutions;
}

function customizeModuleIsMissingMessage(error: Error) {
  error.message = `Your JavaScript code tried to access a native module that doesn't exist in this development client. 

${moduleIsMissingPossibleSolutions}`;
}

function customizeError(error: Error | CodedError) {
  if ('code' in error) {
    // It's a CodedError from expo modules
    switch (error.code) {
      case 'ERR_UNAVAILABLE': {
        customizeUnavailableMessage(error);
        break;
      }
    }
  } else if (
    error.message.includes('Native module cannot be null') || // RN 0.64 and below message
    error.message.includes('`new NativeEventEmitter()` requires a non-null argument.') // RN 0.65+ message
  ) {
    customizeModuleIsMissingMessage(error);
  }
}

function errorHandler(originalHandler, error, isFatal) {
  if (error instanceof Error) {
    // Suppresses `"main" has not been registered` error only if it was caused by a different error.
    // Otherwise, we want to show it, cause the user may forget to call `AppRegistry.registerComponent`.
    if (wasHit && error.message?.includes('has not been registered. This can happen if')) {
      return;
    }
    customizeError(error);
  }

  wasHit = true;
  originalHandler(error, isFatal);
}

/**
 * @hidden
 */
export function createErrorHandler(originalHandler) {
  return (error, isFatal) => {
    if (isErrorHandlingEnabled) {
      errorHandler(originalHandler, error, isFatal);
      return;
    }

    originalHandler(error, isFatal);
  };
}

/**
 * @hidden
 */
export function disableErrorHandling() {
  isErrorHandlingEnabled = false;
}
