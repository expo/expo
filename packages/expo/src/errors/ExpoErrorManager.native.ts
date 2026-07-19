import type { ErrorHandlerCallback } from 'react-native';

// Similar interface to the one used in expo modules.
type CodedError = Error & { code?: string };

let isErrorHandlingEnabled = true;

const developmentBuildMessage = `If you're trying to use a module that is not supported in Expo Go, you need to create a development build of your app. See https://docs.expo.dev/development/introduction/ for more info.`;

function customizeUnavailableMessage(error: CodedError) {
  error.message += '\n\n' + developmentBuildMessage;
}

function customizeModuleIsMissingMessage(error: Error) {
  error.message = `Your JavaScript code tried to access a native module that doesn't exist. 

${developmentBuildMessage}`;
}

function customizeError(error: Error | CodedError) {
  if ('code' in error && error.code === 'ERR_UNAVAILABLE') {
    customizeUnavailableMessage(error);
  } else if (
    error.message.includes('Native module cannot be null') || // RN 0.64 and below message
    error.message.includes('`new NativeEventEmitter()` requires a non-null argument.') // RN 0.65+ message
  ) {
    customizeModuleIsMissingMessage(error);
  }
}

function errorHandler(originalHandler: ErrorHandlerCallback, error: any, isFatal?: boolean): void {
  if (error instanceof Error) {
    customizeError(error);
  }
  originalHandler(error, isFatal);
}

export function createErrorHandler(originalHandler: ErrorHandlerCallback): ErrorHandlerCallback {
  return (error, isFatal) => {
    if (isErrorHandlingEnabled) {
      errorHandler(originalHandler, error, isFatal);
      return;
    }

    originalHandler(error, isFatal);
  };
}

export function disableErrorHandling() {
  isErrorHandlingEnabled = false;
}
