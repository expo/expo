let enableLogging = false;
export function log(...params) {
    if (enableLogging) {
        console.log(...params);
    }
}
export function debug(...params) {
    if (enableLogging) {
        console.debug(...params);
    }
}
export function info(...params) {
    if (enableLogging) {
        console.info(...params);
    }
}
export function warn(...params) {
    if (enableLogging) {
        console.warn(...params);
    }
}
export function setEnableLogging(enabled) {
    enableLogging = enabled;
}
//# sourceMappingURL=logger.js.map