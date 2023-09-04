"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeOptionsAsync = exports.DEFAULT_IGNORES = exports.FINGERPRINT_IGNORE_FILENAME = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
exports.FINGERPRINT_IGNORE_FILENAME = '.fingerprintignore';
exports.DEFAULT_IGNORES = [
    exports.FINGERPRINT_IGNORE_FILENAME,
    '**/android/build/**/*',
    '**/android/app/build/**/*',
    '**/android/app/.cxx/**/*',
    '**/ios/Pods/**/*',
];
async function normalizeOptionsAsync(projectRoot, options) {
    return {
        ...options,
        platforms: options?.platforms ?? ['android', 'ios'],
        concurrentIoLimit: options?.concurrentIoLimit ?? os_1.default.cpus().length,
        hashAlgorithm: options?.hashAlgorithm ?? 'sha1',
        ignores: await collectIgnoresAsync(projectRoot, options),
    };
}
exports.normalizeOptionsAsync = normalizeOptionsAsync;
async function collectIgnoresAsync(projectRoot, options) {
    const ignores = [
        ...exports.DEFAULT_IGNORES,
        ...(options?.ignores ?? []),
        ...(options?.dirExcludes?.map((dirExclude) => `${dirExclude}/**/*`) ?? []),
    ];
    const fingerprintIgnorePath = path_1.default.join(projectRoot, exports.FINGERPRINT_IGNORE_FILENAME);
    try {
        const fingerprintIgnore = await promises_1.default.readFile(fingerprintIgnorePath, 'utf8');
        const fingerprintIgnoreLines = fingerprintIgnore.split('\n');
        for (const line of fingerprintIgnoreLines) {
            const trimmedLine = line.trim();
            if (trimmedLine) {
                ignores.push(trimmedLine);
            }
        }
    }
    catch { }
    return ignores;
}
//# sourceMappingURL=Options.js.map