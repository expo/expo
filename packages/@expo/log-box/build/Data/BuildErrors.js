"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetroPackageResolutionError = exports.MetroTransformError = exports.MetroBuildError = void 0;
const parseLogBoxLog_1 = require("./parseLogBoxLog");
const devServerEndpoints_1 = require("../utils/devServerEndpoints");
const METRO_ERROR_FORMAT = /^(?:InternalError Metro has encountered an error:) (.*): (.*) \((\d+):(\d+)\)\n\n([\s\S]+)/u;
class MetroBuildError extends Error {
    errorType;
    errors;
    ansiError;
    constructor(message, errorType, errors) {
        super(message);
        this.errorType = errorType;
        this.errors = errors;
        this.ansiError = message;
        // Strip the ansi so it shows as a normalized error in the console log.
        this.message = stripAnsi(message);
    }
    toLogBoxLogData() {
        // TODO: Split into different error
        const metroInternalError = this.ansiError.match(METRO_ERROR_FORMAT);
        if (metroInternalError) {
            const [content, fileName, row, column, codeFrame] = metroInternalError.slice(1);
            return {
                level: 'fatal',
                type: 'Metro Error',
                stack: [],
                isComponentError: false,
                componentStack: [],
                codeFrame: {
                    stack: {
                        fileName,
                        location: {
                            row: parseInt(row, 10),
                            column: parseInt(column, 10),
                        },
                        content: codeFrame,
                    },
                },
                message: {
                    content,
                    substitutions: [],
                },
                category: `${fileName}-${row}-${column}`,
            };
        }
        const babelCodeFrameError = this.ansiError.match(BABEL_CODE_FRAME_ERROR_FORMAT);
        if (babelCodeFrameError) {
            // Codeframe errors are thrown from any use of buildCodeFrameError.
            const [fileName, content, codeFrame] = babelCodeFrameError.slice(1);
            return {
                level: 'syntax',
                stack: [],
                isComponentError: false,
                componentStack: [],
                codeFrame: {
                    stack: {
                        fileName,
                        location: null, // We are not given the location.
                        content: codeFrame,
                    },
                },
                message: {
                    content,
                    substitutions: [],
                },
                category: `${fileName}-${1}-${1}`,
            };
        }
        return {
            level: 'fatal',
            stack: (0, devServerEndpoints_1.parseErrorStack)(this.stack),
            codeFrame: {},
            isComponentError: false,
            componentStack: [],
            ...(0, parseLogBoxLog_1.parseInterpolation)([this.ansiError]),
        };
    }
}
exports.MetroBuildError = MetroBuildError;
const BABEL_TRANSFORM_ERROR_FORMAT = /^(?:TransformError )?(?:SyntaxError: |ReferenceError: )(.*): (.*) \((\d+):(\d+)\)\n\n([\s\S]+)/;
const BABEL_CODE_FRAME_ERROR_FORMAT = /^(?:TransformError )?(?:.*):? (?:.*?)([/|\\].*): ([\s\S]+?)\n((?:[ >]*\d+[\s|]+[^\n]*\n?)+|\u{001b}\[[0-9;]*m(?:.*\n?)+?(?=\n\n|\n[^\u{001b}\s]|$))/mu;
class MetroTransformError extends MetroBuildError {
    errorType;
    errors;
    lineNumber;
    column;
    filename;
    codeFrame;
    constructor(message, errorType, errors, lineNumber, column, filename) {
        super(message);
        this.errorType = errorType;
        this.errors = errors;
        this.lineNumber = lineNumber;
        this.column = column;
        this.filename = filename;
        // TODO: Remove need for regex by passing code frame in error data from Metro.
        const babelTransformError = message.match(BABEL_TRANSFORM_ERROR_FORMAT);
        if (babelTransformError) {
            // Transform errors are thrown from inside the Babel transformer.
            const [content, codeFrame] = babelTransformError.slice(1);
            this.codeFrame = codeFrame;
            this.message = stripAnsi(content);
        }
    }
    toLogBoxLogData() {
        // MetroTransformError is a custom error type that we throw when the transformer fails.
        // It has a stack trace and a message.
        return {
            level: 'syntax',
            stack: [],
            isComponentError: false,
            componentStack: [],
            codeFrame: {
                stack: this.codeFrame
                    ? {
                        fileName: this.filename,
                        location: {
                            row: this.lineNumber,
                            column: this.column,
                        },
                        content: this.codeFrame,
                    }
                    : undefined,
            },
            message: {
                content: this.message,
                substitutions: [],
            },
            category: `${this.filename}-${this.lineNumber}-${this.column}`,
        };
    }
}
exports.MetroTransformError = MetroTransformError;
class MetroPackageResolutionError extends MetroBuildError {
    errorType;
    errors;
    originModulePath;
    targetModuleName;
    cause;
    constructor(message, errorType, errors, 
    /** "/Users/evanbacon/Documents/GitHub/expo/apps/router-e2e/__e2e__/05-errors/app/index.tsx" */
    originModulePath, 
    /** "foobar" */
    targetModuleName, cause) {
        super(message);
        this.errorType = errorType;
        this.errors = errors;
        this.originModulePath = originModulePath;
        this.targetModuleName = targetModuleName;
        this.cause = cause;
    }
    toLogBoxLogData() {
        const babelCodeFrameError = this.ansiError.match(BABEL_CODE_FRAME_ERROR_FORMAT);
        const dirPaths = this.cause?.dirPaths;
        return {
            level: 'resolution',
            // TODO: Add import stacks
            stack: [],
            isComponentError: false,
            componentStack: [],
            codeFrame: {
                stack: babelCodeFrameError?.[3]
                    ? {
                        fileName: this.originModulePath,
                        location: null, // We are not given the location.
                        content: babelCodeFrameError?.[3],
                    }
                    : undefined,
            },
            message: {
                content: `Unable to resolve module ${this.targetModuleName}`,
                substitutions: [],
            },
            // TODO: This doesn't work for initial bundling resolution errors (only for HMR)
            isMissingModuleError: dirPaths ? this.targetModuleName : undefined,
            category: `${this.originModulePath}-${1}-${1}`,
        };
    }
    toLogBoxLogDataLegacy() {
        const logBoxLogData = this.toLogBoxLogData();
        return {
            ...logBoxLogData,
            componentStack: [],
            codeFrame: logBoxLogData.codeFrame?.stack || undefined,
        };
    }
}
exports.MetroPackageResolutionError = MetroPackageResolutionError;
function stripAnsi(str) {
    if (!str) {
        return str;
    }
    const pattern = [
        '[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)',
        '(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~]))',
    ].join('|');
    return str.replace(new RegExp(pattern, 'g'), '');
}
