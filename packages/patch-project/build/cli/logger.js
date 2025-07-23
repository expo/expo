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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.error = exports.log = void 0;
exports.exception = exception;
exports.exit = exit;
const chalk_1 = __importDefault(require("chalk"));
const env = __importStar(require("../env"));
exports.log = console.log;
exports.error = console.error;
/** Print an error and provide additional info (the stack trace) in debug mode. */
function exception(e) {
    (0, exports.error)(chalk_1.default.red(e.toString()) + (env.EXPO_DEBUG ? '\n' + chalk_1.default.gray(e.stack) : ''));
}
/** Log a message and exit the current process. If the `code` is non-zero then `console.error` will be used instead of `console.log`. */
function exit(message, code = 1) {
    if (message instanceof Error) {
        exception(message);
        process.exit(code);
    }
    if (message) {
        if (code === 0) {
            (0, exports.log)(message);
        }
        else {
            (0, exports.error)(message);
        }
    }
    process.exit(code);
}
//# sourceMappingURL=logger.js.map