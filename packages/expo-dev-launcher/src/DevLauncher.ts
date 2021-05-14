import { ErrorUtils } from 'react-native';

// Similar interface to the one used in expo modules.
type CodeError = Error & { code?: string };

let errorHandlerWasRegistered = false;

function customizeModuleIsMissingMessage(error: Error) {
  error.message += `
      
  Possible solutions:
  - Make sure that you're using the newest version of your native shell app.
  - Make sure that you're not trying to load the old version of your js code.`;
}

function customizeError(error: Error | CodeError) {
  if ('code' in error) {
    // It's a CodeError from expo modules
    switch (error.code) {
      case 'ERR_UNAVAILABLE': {
        customizeModuleIsMissingMessage(error);
        break;
      }
    }
  } else if (error.message.includes('Native module cannot be null')) {
    customizeModuleIsMissingMessage(error);
  }
}

function errorHandler(fn, error, isFatal) {
  if (error instanceof Error) {
    customizeError(error);
  }

  fn(error, isFatal);
}

export function registerErrorHandlers() {
  if (errorHandlerWasRegistered) {
    return;
  }
  errorHandlerWasRegistered = true;

  const globalHandler = ErrorUtils.getGlobalHandler();
  ErrorUtils.setGlobalHandler(function(...args) {
    errorHandler(globalHandler, ...args);
  });
}
