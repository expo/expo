"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_SOURCE_SKIPS = exports.DEFAULT_IGNORE_PATHS = exports.FINGERPRINT_IGNORE_FILENAME = void 0;
exports.normalizeOptionsAsync = normalizeOptionsAsync;
const promises_1 = __importDefault(require("fs/promises"));
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const Config_1 = require("./Config");
const ExpoResolver_1 = require("./ExpoResolver");
const ProjectWorkflow_1 = require("./ProjectWorkflow");
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
    // Ignore CocoaPods generated files
    // https://github.com/expo/expo/blob/d0e39858ead9a194d90990f89903e773b9d33582/packages/expo-sqlite/ios/ExpoSQLite.podspec#L25-L36
    // https://github.com/expo/expo/blob/d0e39858ead9a194d90990f89903e773b9d33582/packages/expo-updates/ios/EXUpdates.podspec#L51-L58
    '**/node_modules/expo-sqlite/ios/sqlite3.[ch]',
    '**/node_modules/expo-updates/ios/EXUpdates/BSPatch/bspatch.c',
    // Ignore nested node_modules
    '**/node_modules/**/node_modules/**',
    // Ignore node binaries that might be platform dependent
    '**/node_modules/**/*.node',
    '**/node_modules/@img/sharp-*/**/*',
    '**/node_modules/sharp/{build,vendor}/**/*',
];
exports.DEFAULT_SOURCE_SKIPS = SourceSkips_1.SourceSkips.PackageJsonAndroidAndIosScriptsIfNotContainRun;
async function normalizeOptionsAsync(projectRoot, options) {
    const config = await (0, Config_1.loadConfigAsync)(projectRoot, options?.silent ?? false);
    const ignorePathMatchObjects = await collectIgnorePathsAsync(projectRoot, config?.ignorePaths, options);
    const useCNGForPlatforms = await resolveUseCNGAsync(projectRoot, options, ignorePathMatchObjects);
    if (useCNGForPlatforms.android) {
        (0, Path_1.appendIgnorePath)(ignorePathMatchObjects, 'android/**/*');
    }
    if (useCNGForPlatforms.ios) {
        (0, Path_1.appendIgnorePath)(ignorePathMatchObjects, 'ios/**/*');
    }
    return {
        // Defaults
        platforms: ['android', 'ios'],
        concurrentIoLimit: os_1.default.cpus().length,
        hashAlgorithm: 'sha1',
        sourceSkips: exports.DEFAULT_SOURCE_SKIPS,
        // Options from config
        ...config,
        // Explicit options
        ...Object.fromEntries(Object.entries(options ?? {}).filter(([_, v]) => v != null)),
        // These options are computed by both default and explicit options, so we put them last.
        enableReactImportsPatcher: options?.enableReactImportsPatcher ??
            config?.enableReactImportsPatcher ??
            (0, ExpoResolver_1.satisfyExpoVersion)(projectRoot, '<52.0.0') ??
            false,
        ignorePathMatchObjects,
        ignoreDirMatchObjects: (0, Path_1.buildDirMatchObjects)(ignorePathMatchObjects),
        useCNGForPlatforms,
    };
}
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
async function resolveUseCNGAsync(projectRoot, options, ignorePathMatchObjects) {
    const results = {
        android: false,
        ios: false,
    };
    const platforms = options?.platforms ?? ['android', 'ios'];
    for (const platform of platforms) {
        const projectWorkflow = await (0, ProjectWorkflow_1.resolveProjectWorkflowAsync)(projectRoot, platform, ignorePathMatchObjects);
        results[platform] = projectWorkflow === 'managed';
    }
    return results;
}
//# sourceMappingURL=Options.js.map