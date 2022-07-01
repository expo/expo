let isErrorHandlingEnabled = true;
let wasHit = false; // whether the original error handler was called
const developmentBuildMessage = `If you're trying to use a module that is not supported in Expo Go, you can create a custom development build. See https://docs.expo.dev/development/introduction/ for more info.`;
function customizeUnavailableMessage(error) {
    error.message += '\n\n' + developmentBuildMessage;
}
function customizeModuleIsMissingMessage(error) {
    error.message = `Your JavaScript code tried to access a native module that doesn't exist. 

${developmentBuildMessage}`;
}
function customizeError(error) {
    if ('code' in error && error.code === 'ERR_UNAVAILABLE') {
        customizeUnavailableMessage(error);
    }
    else if (error.message.includes('Native module cannot be null') || // RN 0.64 and below message
        error.message.includes('`new NativeEventEmitter()` requires a non-null argument.') // RN 0.65+ message
    ) {
        customizeModuleIsMissingMessage(error);
    }
}
function errorHandler(originalHandler, error, isFatal) {
    if (error instanceof Error) {
        // Suppresses `"main" has not been registered` error only if it was caused by a different error.
        // Otherwise, we want to show it, in case the user forgot to call `AppRegistry.registerComponent`.
        if (wasHit && error.message?.includes('has not been registered. This can happen if')) {
            return;
        }
        customizeError(error);
    }
    wasHit = true;
    originalHandler(error, isFatal);
}
export function createErrorHandler(originalHandler) {
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
//# sourceMappingURL=ExpoErrorManager.js.map