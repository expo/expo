"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseWebBuildErrors = parseWebBuildErrors;
const metroBuildErrorsFormat_1 = require("./metroBuildErrorsFormat");
/**
 * Called in expo/cli, the return value is injected into the static error page which is bundled
 * instead of the app when the web build fails.
 */
function parseWebBuildErrors({ error, projectRoot, parseErrorStack, }) {
    // NOTE: Ideally this will be merged with the parseWebHmrBuildErrors function
    // Remap direct Metro Node.js errors to a format that will appear more client-friendly in the logbox UI.
    let stack;
    if (isTransformError(error) && error.filename) {
        // Syntax errors in static rendering.
        stack = [
            {
                // Avoid using node:path to be compatible with web and RN runtime.
                file: `${projectRoot}/${error.filename}`,
                methodName: '<unknown>',
                // TODO: Import stack
                lineNumber: error.lineNumber,
                column: error.column,
            },
        ];
    }
    else if ('originModulePath' in error &&
        typeof error.originModulePath === 'string' &&
        'targetModuleName' in error &&
        typeof error.targetModuleName === 'string' &&
        'cause' in error) {
        const { codeFrame } = (0, metroBuildErrorsFormat_1.parseBabelCodeFrameError)(error.message) || {};
        // We are purposely not using the parsed fileName or content here
        // because we have the original data in the error object.
        const content = `Unable to resolve module ${error.targetModuleName}`;
        return {
            level: 'resolution',
            // TODO: Add import stacks
            stack: [],
            isComponentError: false,
            componentStack: [],
            codeFrame: codeFrame
                ? {
                    fileName: error.originModulePath,
                    location: null, // We are not given the location.
                    content: codeFrame,
                }
                : undefined,
            message: {
                content,
                substitutions: [],
            },
            category: `${error.originModulePath}-${1}-${1}`,
        };
    }
    else {
        stack = parseErrorStack(projectRoot, error.stack);
    }
    return {
        level: 'static',
        message: {
            content: error.message,
            substitutions: [],
        },
        isComponentError: false,
        stack,
        category: 'static',
        componentStack: [],
    };
}
function isTransformError(error) {
    return error.type === 'TransformError';
}
