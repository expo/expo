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
const LogBoxData = __importStar(require("./Data/LogBoxData"));
const parseLogBoxLog_1 = require("./Data/parseLogBoxLog");
/**
 * LogBox displays logs in the app.
 */
let originalConsoleError;
let consoleErrorImpl;
let isLogBoxInstalled = false;
const LogBox = {
    install() {
        if (isLogBoxInstalled) {
            return;
        }
        isLogBoxInstalled = true;
        // Trigger lazy initialization of module.
        // require("../NativeModules/specs/NativeLogBox");
        // IMPORTANT: we only overwrite `console.error` and `console.warn` once.
        // When we uninstall we keep the same reference and only change its
        // internal implementation
        const isFirstInstall = originalConsoleError == null;
        if (isFirstInstall) {
            originalConsoleError = console.error.bind(console);
            console.error = (...args) => {
                consoleErrorImpl?.(...args);
            };
        }
        consoleErrorImpl = consoleErrorMiddleware;
        if (process.env.NODE_ENV === 'test') {
            LogBoxData.setDisabled(true);
        }
    },
    uninstall() {
        if (!isLogBoxInstalled) {
            return;
        }
        isLogBoxInstalled = false;
        // IMPORTANT: we don't re-assign to `console` in case the method has been
        // decorated again after installing LogBox. E.g.:
        // Before uninstalling: original > LogBox > OtherErrorHandler
        // After uninstalling:  original > LogBox (noop) > OtherErrorHandler
        consoleErrorImpl = originalConsoleError;
        delete console.disableLogBox;
    },
    ignoreLogs(patterns) {
        LogBoxData.addIgnorePatterns(patterns);
    },
    ignoreAllLogs(value) {
        LogBoxData.setDisabled(value == null ? true : value);
    },
    clearAllLogs() {
        LogBoxData.clear();
    },
    addLog(log) {
        if (isLogBoxInstalled) {
            LogBoxData.addLog(log);
        }
    },
    addException(error) {
        if (isLogBoxInstalled) {
            LogBoxData.addException(error);
        }
    },
};
function consoleErrorMiddleware(...args) {
    // Let errors within LogBox itself fall through.
    // TODO: Drop this in favor of a more generalized tagging solution.
    if (LogBoxData.isLogBoxErrorMessage(args[0])) {
        originalConsoleError?.(...args);
        return;
    }
    const { category, message, componentStack } = (0, parseLogBoxLog_1.parseLogBoxLog)(args);
    if (LogBoxData.isMessageIgnored(message.content)) {
        return;
    }
    // NOTE: Unlike React Native, we'll just pass the logs directly to the console
    originalConsoleError?.(...args);
    // Interpolate the message so they are formatted for adb and other CLIs.
    // This is different than the message.content above because it includes component stacks.
    // const interpolated = parseInterpolation(args);
    // originalConsoleError?.(interpolated.message.content);
    LogBoxData.addLog({
        // Always show the static rendering issues as full screen since they
        // are too confusing otherwise.
        // TODO: We can change this with a collection of improvements from React 19.1.
        level: /did not match\. Server:/.test(message.content) ? 'fatal' : 'error',
        category,
        message,
        componentStack,
    });
}
exports.default = LogBox;
