"use strict";
// Keep module interface compatible with
// https://github.com/facebook/react-native/blob/50b1bec2d56cd1b06ceb0be284a30fd90e39c342/packages/react-native/Libraries/LogBox/Data/parseLogBoxLog.js
// NOTE(@kitten): Types here were converted/copied manually from Flow. Unclear where they were originally defined
// TODO(@kitten): There were type errors here after conversion; needs a review!
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
exports.parseInterpolation = void 0;
exports.withoutANSIColorStyles = withoutANSIColorStyles;
exports.parseLogBoxException = parseLogBoxException;
exports.parseLogBoxLog = parseLogBoxLog;
exports.parseComponentStack = parseComponentStack;
exports.hasComponentStack = hasComponentStack;
// End of web-specific imports
const log_box_utils_1 = require("@expo/log-box-utils");
const parseLogBoxLogWeb = __importStar(require("./parseLogBoxLog"));
const parseErrorStack_1 = require("../utils/parseErrorStack");
// Exported method must be compatible with upstream React Native.
var parseLogBoxLog_1 = require("./parseLogBoxLog");
Object.defineProperty(exports, "parseInterpolation", { enumerable: true, get: function () { return parseLogBoxLog_1.parseInterpolation; } });
function withoutANSIColorStyles(text) {
    return (0, log_box_utils_1.withoutANSIColorStyles)(text);
}
function parseLogBoxException(error) {
    const parsed = parseLogBoxLogWeb.parseLogBoxException(error);
    return {
        ...parsed,
        // @ts-ignore metro types only accepts undefined | number for column
        stack: parsed.stack,
        componentStack: parsed.componentStack.map(convertMetroToComponentFrame),
        level: ['resolution', 'static'].includes(parsed.level) ? 'syntax' : parsed.level,
        componentStackType: 'stack',
        extraData: {},
        onNotificationPress: () => { },
        // @ts-ignore metro types only accepts undefined | number for location
        codeFrame: parsed.codeFrame['stack'],
        componentCodeFrame: parsed.codeFrame['component'],
    };
}
function parseLogBoxLog(args) {
    const parsed = parseLogBoxLogWeb.parseLogBoxLog(args);
    return {
        ...parsed,
        componentStack: parsed.componentStack.map(convertMetroToComponentFrame),
        componentStackType: 'stack',
    };
}
// TODO(@kitten): Can't be assigned to stack, check this
function convertMetroToComponentFrame(frame) {
    return {
        content: frame.methodName,
        collapse: frame.collapse || false,
        fileName: frame.file == null ? 'unknown' : frame.file,
        location: {
            column: frame.column == null ? -1 : frame.column,
            row: frame.lineNumber == null ? -1 : frame.lineNumber,
        },
    };
}
// Below
// Not used in Expo code, but required for matching exports with upstream.
// https://github.com/krystofwoldrich/react-native/blob/7db31e2fca0f828aa6bf489ae6dc4adef9b7b7c3/packages/react-native/Libraries/LogBox/Data/parseLogBoxLog.js#L220
function parseComponentStack(message) {
    // We removed legacy parsing since we are in control of the React version used.
    const stack = (0, parseErrorStack_1.parseErrorStack)(message);
    return {
        type: 'stack',
        stack: stack.map((frame) => ({
            content: frame.methodName,
            collapse: frame.collapse || false,
            fileName: frame.file == null ? 'unknown' : frame.file,
            location: {
                column: frame.column == null ? -1 : frame.column,
                row: frame.lineNumber == null ? -1 : frame.lineNumber,
            },
        })),
    };
}
function hasComponentStack(args) {
    for (const arg of args) {
        if (typeof arg === 'string' && isComponentStack(arg)) {
            return true;
        }
    }
    return false;
}
const RE_COMPONENT_STACK_LINE_OLD = / {4}in/;
const RE_COMPONENT_STACK_LINE_NEW = / {4}at/;
const RE_COMPONENT_STACK_LINE_STACK_FRAME = /@.*\n/;
function isComponentStack(consoleArgument) {
    const isOldComponentStackFormat = RE_COMPONENT_STACK_LINE_OLD.test(consoleArgument);
    const isNewComponentStackFormat = RE_COMPONENT_STACK_LINE_NEW.test(consoleArgument);
    const isNewJSCComponentStackFormat = RE_COMPONENT_STACK_LINE_STACK_FRAME.test(consoleArgument);
    return isOldComponentStackFormat || isNewComponentStackFormat || isNewJSCComponentStackFormat;
}
//# sourceMappingURL=parseLogBoxLogNative.js.map