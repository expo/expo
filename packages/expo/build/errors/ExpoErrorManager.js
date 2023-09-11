export function createErrorHandler(originalHandler) {
    return (error, isFatal) => originalHandler(error, isFatal);
}
export function disableErrorHandling() { }
//# sourceMappingURL=ExpoErrorManager.js.map