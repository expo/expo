"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveSwiftPackageModuleAsync = resolveSwiftPackageModuleAsync;
const spawn_async_1 = __importDefault(require("@expo/spawn-async"));
const path_1 = __importDefault(require("path"));
const utils_1 = require("../../utils");
/**
 * Locates the `Package.swift` for an Expo module. Root-level only for now —
 * if a future module ships its manifest under a subdirectory we'll add a
 * config override (analog of `apple.podspecPath`).
 */
async function findSwiftPackagePathAsync(revision) {
    const candidate = path_1.default.join(revision.path, 'Package.swift');
    return (await (0, utils_1.fileExistsAsync)(candidate)) ? candidate : null;
}
/**
 * Runs `swift package dump-package` and parses the JSON output.
 *
 * The autolinking resolver itself is invoked from inside another
 * `Package.swift` (the umbrella). Disable the shared manifest cache so the
 * inner SwiftPM run doesn't try to write into a sandbox-blocked location.
 *
 * Throws if the Swift toolchain isn't available or the manifest fails to evaluate.
 */
async function dumpSwiftPackageAsync(packagePath) {
    // The autolinking resolver is invoked from inside another `Package.swift`.
    // The outer manifest sandbox is inherited by this nested `swift package`,
    // which then fails on lock file I/O. Callers must disable the outer
    // sandbox: pass `--disable-sandbox` to `swift package` from a CLI, or set
    // `defaults write com.apple.dt.Xcode IDEPackageSupportDisableManifestSandbox -bool YES`
    // for Xcode-driven builds.
    const { stdout } = await (0, spawn_async_1.default)('swift', ['package', '--package-path', packagePath, 'dump-package'], { stdio: ['ignore', 'pipe', 'inherit'] });
    return JSON.parse(stdout);
}
/**
 * Resolves a module's SwiftPM package: its identity, on-disk path, and
 * `.library` product names. Returns `null` if no `Package.swift` is present.
 */
async function resolveSwiftPackageInfoAsync(revision) {
    const manifestPath = await findSwiftPackagePathAsync(revision);
    if (!manifestPath) {
        return null;
    }
    const packagePath = path_1.default.dirname(manifestPath);
    const dump = await dumpSwiftPackageAsync(packagePath);
    return {
        packageName: dump.name,
        packagePath,
        productNames: dump.products.map((product) => product.name),
    };
}
/**
 * SwiftPM-mode counterpart of the CocoaPods resolver in `apple.ts`. Builds a
 * `ModuleDescriptorIos` with the `swiftPackage` field populated and `pods`
 * left empty. Modules without a `Package.swift` are skipped so SwiftPM
 * adoption can roll out one package at a time.
 */
async function resolveSwiftPackageModuleAsync(packageName, revision, extraOutput) {
    // The `expo` package is the autolinking umbrella — its `Package.swift`
    // invokes this resolver. Dumping its manifest would re-enter the resolver
    // recursively (and fails under the SwiftPM manifest sandbox), so skip it.
    if (packageName === 'expo') {
        return null;
    }
    const swiftPackage = await resolveSwiftPackageInfoAsync(revision);
    if (!swiftPackage) {
        return null;
    }
    const coreFeatures = revision.config?.coreFeatures() ?? [];
    return {
        packageName,
        pods: [],
        swiftPackage,
        swiftModuleNames: swiftPackage.productNames,
        flags: extraOutput.flags,
        modules: revision.config
            ?.appleModules()
            .map((module) => (typeof module === 'string' ? { name: null, class: module } : module)) ??
            [],
        appDelegateSubscribers: revision.config?.appleAppDelegateSubscribers() ?? [],
        reactDelegateHandlers: revision.config?.appleReactDelegateHandlers() ?? [],
        debugOnly: revision.config?.appleDebugOnly() ?? false,
        ...(coreFeatures.length > 0 ? { coreFeatures } : {}),
    };
}
//# sourceMappingURL=swiftpm.js.map