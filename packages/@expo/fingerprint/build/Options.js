"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeOptions = void 0;
const os_1 = __importDefault(require("os"));
function normalizeOptions(options) {
    return {
        ...options,
        platforms: options?.platforms ?? ['android', 'ios'],
        concurrentIoLimit: options?.concurrentIoLimit ?? os_1.default.cpus().length,
        hashAlgorithm: options?.hashAlgorithm ?? 'sha1',
        dirExcludes: options?.dirExcludes ?? [
            '**/android/build',
            '**/android/app/build',
            '**/android/app/.cxx',
            'ios/Pods',
        ],
    };
}
exports.normalizeOptions = normalizeOptions;
//# sourceMappingURL=Options.js.map