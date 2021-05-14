let errorHandlerWasRegistered = false;
function customizeModuleIsMissingMessage(error) {
    error.message += `
      
  Possible solutions:
  - Make sure that you're using the newest version of your native shell app.
  - Make sure that you're not trying to load the old version of your js code.`;
}
function customizeError(error) {
    if ('code' in error) {
        // It's a CodeError from expo modules
        switch (error.code) {
            case 'ERR_UNAVAILABLE': {
                customizeModuleIsMissingMessage(error);
                break;
            }
        }
    }
    else if (error.message.includes('Native module cannot be null')) {
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
    ErrorUtils.setGlobalHandler(function (...args) {
        errorHandler(globalHandler, ...args);
    });
}
//# sourceMappingURL=DevLauncher.js.map