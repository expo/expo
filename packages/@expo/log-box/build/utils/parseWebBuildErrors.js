"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseWebBuildErrors = parseWebBuildErrors;
const path = __importStar(require("node:path"));
const BuildErrors_1 = require("../Data/BuildErrors");
function parseWebBuildErrors({ error, projectRoot, parseErrorStack, }) {
    // NOTE: Ideally this will be merged with the parseWebHmrBuildErrors function
    // Remap direct Metro Node.js errors to a format that will appear more client-friendly in the logbox UI.
    let stack;
    if (isTransformError(error) && error.filename) {
        // Syntax errors in static rendering.
        stack = [
            {
                file: path.join(projectRoot, error.filename),
                methodName: '<unknown>',
                arguments: [],
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
        const message = [error.type, error.message].filter(Boolean).join(' ');
        const type = error.type;
        const errors = error.errors;
        // TODO: Use import stack here when the error is resolution based.
        return new BuildErrors_1.MetroPackageResolutionError(message, type, errors, error.originModulePath, error.targetModuleName, error.cause).toLogBoxLogDataLegacy();
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
