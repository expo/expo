"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolvedFixedXCFrameworks = exports.ensureCorrectFlavor = exports.enumeratePrecompiledModules = void 0;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const commands_1 = require("./commands");
const constants_1 = require("./constants");
/**
 * Pod directories that host xcframeworks already covered by the fixed `XCFramework` constants
 * (hermesvm, React, ReactNativeDependencies). Excluded from enumerated Expo-module results
 * so they aren't double-copied into the Swift Package output.
 */
const RESERVED_POD_DIRS = new Set(['hermes-engine', 'React-Core-prebuilt', 'ReactNativeDependencies']);
/**
 * Scans `ios/Pods/` for Expo modules that were installed as prebuilt xcframeworks (i.e. pod
 * install ran with `EXPO_USE_PRECOMPILED_MODULES=1`). A pod is identified as "precompiled"
 * when its directory contains both a `<Product>.xcframework/` dir and an
 * `artifacts/<Product>-{debug,release}.tar.gz` tarball — the exact signature written by
 * `Expo::PrecompiledModules.ensure_artifacts` in expo-modules-autolinking.
 */
const enumeratePrecompiledModules = (iosDir) => {
    const podsDir = node_path_1.default.join(iosDir, 'Pods');
    if (!node_fs_1.default.existsSync(podsDir)) {
        return [];
    }
    const results = [];
    for (const entry of node_fs_1.default.readdirSync(podsDir, { withFileTypes: true })) {
        if (!entry.isDirectory() || RESERVED_POD_DIRS.has(entry.name)) {
            continue;
        }
        const podDir = node_path_1.default.join(podsDir, entry.name);
        const artifactsDir = node_path_1.default.join(podDir, 'artifacts');
        if (!node_fs_1.default.existsSync(artifactsDir)) {
            continue;
        }
        const tarballs = node_fs_1.default.readdirSync(artifactsDir).filter((f) => f.endsWith('.tar.gz'));
        if (tarballs.length === 0) {
            continue;
        }
        const xcframeworks = node_fs_1.default
            .readdirSync(podDir, { withFileTypes: true })
            .filter((f) => f.isDirectory() && f.name.endsWith('.xcframework'))
            .map((f) => f.name);
        for (const xcframework of xcframeworks) {
            const name = xcframework.replace(/\.xcframework$/, '');
            // Confirm the tarball naming lines up with this xcframework to avoid mistakenly
            // picking up unrelated vendored frameworks that happen to sit next to an artifacts/ dir.
            const hasMatchingTarball = tarballs.some((f) => f === `${name}-debug.tar.gz` || f === `${name}-release.tar.gz`);
            if (!hasMatchingTarball) {
                continue;
            }
            results.push({
                name,
                podDir,
                xcframeworkPath: node_path_1.default.join(podDir, xcframework),
            });
        }
    }
    return results;
};
exports.enumeratePrecompiledModules = enumeratePrecompiledModules;
/**
 * Reads `<podDir>/artifacts/.last_build_configuration` and, if it doesn't match the requested
 * build configuration, shells out to autolinking's `replace-xcframework.js` to extract the
 * correct flavor tarball in place. This protects against the user having run
 * `EXPO_PRECOMPILED_FLAVOR=debug pod install` but then asking for a `--release` brownfield
 * build (or vice-versa).
 */
const ensureCorrectFlavor = async (module, buildConfiguration, options) => {
    const flavor = buildConfiguration.toLowerCase();
    const lastConfigFile = node_path_1.default.join(module.podDir, 'artifacts', '.last_build_configuration');
    if (node_fs_1.default.existsSync(lastConfigFile)) {
        const last = node_fs_1.default.readFileSync(lastConfigFile, 'utf8').trim();
        if (last === flavor) {
            return;
        }
    }
    let scriptPath;
    try {
        scriptPath = require.resolve('expo-modules-autolinking/scripts/ios/replace-xcframework.js', { paths: [process.cwd()] });
    }
    catch {
        throw new Error(`Could not locate expo-modules-autolinking's replace-xcframework.js. ` +
            `Install expo-modules-autolinking in your project (it is usually a transitive dep of expo) ` +
            `and re-run with --use-prebuilds.`);
    }
    await (0, commands_1.runCommand)('node', [scriptPath, '-c', flavor, '-m', module.name, '-x', module.podDir], { verbose: options.verbose });
};
exports.ensureCorrectFlavor = ensureCorrectFlavor;
const resolvedFixedXCFrameworks = () => {
    return Object.values(constants_1.XCFramework).map((f) => f.name);
};
exports.resolvedFixedXCFrameworks = resolvedFixedXCFrameworks;
//# sourceMappingURL=precompiled.js.map