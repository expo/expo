"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeOptionsAsync = exports.DEFAULT_SOURCE_SKIPS = exports.DEFAULT_IGNORE_PATHS = exports.FINGERPRINT_IGNORE_FILENAME = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const Config_1 = require("./Config");
const ExpoResolver_1 = require("./ExpoResolver");
const SourceSkips_1 = require("./sourcer/SourceSkips");
const Path_1 = require("./utils/Path");
exports.FINGERPRINT_IGNORE_FILENAME = '.fingerprintignore';
exports.DEFAULT_IGNORE_PATHS = [
    exports.FINGERPRINT_IGNORE_FILENAME,
    // Android
    '**/android/build/**/*',
    '**/android/.cxx/**/*',
    '**/android/.gradle/**/*',
    '**/android/app/build/**/*',
    '**/android/app/.cxx/**/*',
    '**/android/app/.gradle/**/*',
    '**/android-annotation/build/**/*',
    '**/android-annotation/.cxx/**/*',
    '**/android-annotation/.gradle/**/*',
    '**/android-annotation-processor/build/**/*',
    '**/android-annotation-processor/.cxx/**/*',
    '**/android-annotation-processor/.gradle/**/*',
    // Often has different line endings, thus we have to ignore it
    '**/android/gradlew.bat',
    // Android gradle plugins
    '**/*-gradle-plugin/build/**/*',
    '**/*-gradle-plugin/.cxx/**/*',
    '**/*-gradle-plugin/.gradle/**/*',
    // iOS
    '**/ios/Pods/**/*',
    '**/ios/build/**/*',
    '**/ios/.xcode.env.local',
    '**/ios/**/project.xcworkspace',
    '**/ios/*.xcworkspace/xcuserdata/**/*',
    // System files that differ from machine to machine
    '**/.DS_Store',
    // Ignore all expo configs because we will read expo config in a HashSourceContents already
    'app.config.ts',
    'app.config.js',
    'app.config.json',
    'app.json',
    // Ignore nested node_modules
    '**/node_modules/**/node_modules/**',
];
exports.DEFAULT_SOURCE_SKIPS = SourceSkips_1.SourceSkips.PackageJsonAndroidAndIosScriptsIfNotContainRun;
async function normalizeOptionsAsync(projectRoot, options) {
    const config = await (0, Config_1.loadConfigAsync)(projectRoot, options?.silent ?? false);
    const ignorePathMatchObjects = await collectIgnorePathsAsync(projectRoot, config?.ignorePaths, options);
    return {
        // Defaults
        platforms: ['android', 'ios'],
        concurrentIoLimit: os_1.default.cpus().length,
        hashAlgorithm: 'sha1',
        sourceSkips: exports.DEFAULT_SOURCE_SKIPS,
        // Options from config
        ...config,
        // Explicit options
        ...options,
        // These options are computed by both default and explicit options, so we put them last.
        enableReactImportsPatcher: options?.enableReactImportsPatcher ??
            config?.enableReactImportsPatcher ??
            (0, ExpoResolver_1.satisfyExpoVersion)(projectRoot, '<52.0.0') ??
            false,
        ignorePathMatchObjects,
        ignoreDirMatchObjects: (0, Path_1.buildDirMatchObjects)(ignorePathMatchObjects),
    };
}
exports.normalizeOptionsAsync = normalizeOptionsAsync;
async function collectIgnorePathsAsync(projectRoot, pathsFromConfig, options) {
    const ignorePaths = [
        ...exports.DEFAULT_IGNORE_PATHS,
        ...(pathsFromConfig ?? []),
        ...(options?.ignorePaths ?? []),
        ...(options?.dirExcludes?.map((dirExclude) => `${dirExclude}/**/*`) ?? []),
    ];
    const fingerprintIgnorePath = path_1.default.join(projectRoot, exports.FINGERPRINT_IGNORE_FILENAME);
    try {
        const fingerprintIgnore = await promises_1.default.readFile(fingerprintIgnorePath, 'utf8');
        const fingerprintIgnoreLines = fingerprintIgnore.split('\n');
        for (const line of fingerprintIgnoreLines) {
            const trimmedLine = line.trim();
            if (trimmedLine) {
                ignorePaths.push(trimmedLine);
            }
        }
    }
    catch { }
    return (0, Path_1.buildPathMatchObjects)(ignorePaths);
}
//# sourceMappingURL=Options.js.map