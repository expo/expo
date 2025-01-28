"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withConsoleDisabledAsync = void 0;
async function withConsoleDisabledAsync(block) {
    const loggingFunctions = {
        log: console.log,
        warn: console.warn,
        error: console.error,
    };
    // Disable logging for this command since the only thing printed to stdout should be the JSON output.
    console.log = function () { };
    console.warn = function () { };
    console.error = function () { };
    try {
        return await block();
    }
    finally {
        // Re-enable logging functions for testing.
        console.log = loggingFunctions.log;
        console.warn = loggingFunctions.warn;
        console.error = loggingFunctions.error;
    }
}
exports.withConsoleDisabledAsync = withConsoleDisabledAsync;
