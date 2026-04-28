"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.enumerateAllPrebuildModules = exports.enumerateBundledSpmDepsXcframeworks = exports.collectDeclaredSpmDeps = exports.buildPodToNpmPackageMap = exports.enumerateSpmDepsXcframeworks = exports.findSpmDepsRoot = exports.resolvedFixedXCFrameworks = exports.ensureCorrectFlavor = exports.enumeratePrecompiledModules = void 0;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const commands_1 = require("./commands");
const constants_1 = require("./constants");
const error_1 = __importDefault(require("./error"));
const SPM_DEPS_RELATIVE = node_path_1.default.join('packages', 'precompile', '.build', '.spm-deps');
/**
 * Pod directories that host xcframeworks already covered by the fixed `XCFramework` constants
 * (hermesvm, React, ReactNativeDependencies). Excluded from enumerated Expo-module results
 * so they aren't double-copied into the Swift Package output.
 */
const RESERVED_POD_DIRS = new Set([
    'hermes-engine',
    'React-Core-prebuilt',
    'ReactNativeDependencies',
]);
/**
 * Scans `ios/Pods/` for prebuilt xcframeworks installed by autolinking when
 * `EXPO_USE_PRECOMPILED_MODULES=1` is set. A pod is "precompiled" when its directory contains
 * a `<Product>.xcframework/` dir and an `artifacts/<Product>-{debug,release}.tar.gz` tarball —
 * the exact signature written by `Expo::PrecompiledModules.ensure_artifacts` in
 * expo-modules-autolinking.
 *
 * For each precompiled pod we yield ALL xcframework subdirs, not just the main product, so
 * that SPM-dependency xcframeworks bundled alongside (e.g. SDWebImage / SDWebImageSVGCoder /
 * libavif laid down inside `Pods/ExpoImage/`) are surfaced too. Without these, the resulting
 * Swift Package would link against missing rpath entries at runtime
 * (`Library not loaded: @rpath/SDWebImage.framework/SDWebImage`).
 *
 * Results are deduplicated by xcframework basename — when the same SPM dep is claimed by
 * multiple pods, only the first one wins (subsequent pods reference it via FRAMEWORK_SEARCH_PATHS
 * in CocoaPods land, so we only need one copy in the SPM output).
 */
const enumeratePrecompiledModules = (iosDir) => {
    const podsDir = node_path_1.default.join(iosDir, 'Pods');
    if (!node_fs_1.default.existsSync(podsDir)) {
        return [];
    }
    const results = [];
    const seenNames = new Set();
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
            .map((f) => f.name.replace(/\.xcframework$/, ''));
        // Identify the "main" product for this pod — the xcframework whose name matches a tarball.
        // Used as the `-m` argument when reconciling debug/release flavors via replace-xcframework.js.
        const mainProduct = xcframeworks.find((name) => tarballs.some((f) => f === `${name}-debug.tar.gz` || f === `${name}-release.tar.gz`));
        if (!mainProduct) {
            // No xcframework lines up with the tarball — defensive skip (treat as unrelated vendored fw).
            continue;
        }
        for (const name of xcframeworks) {
            if (seenNames.has(name)) {
                continue;
            }
            seenNames.add(name);
            results.push({
                name,
                podDir,
                xcframeworkPath: node_path_1.default.join(podDir, `${name}.xcframework`),
                mainProduct,
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
    const artifactsDir = node_path_1.default.join(module.podDir, 'artifacts');
    // SPM-dep xcframeworks under `.spm-deps/<name>/<flavor>/` don't have an `artifacts/` dir
    // — they're already segregated by flavor on disk, so there's nothing to reconcile.
    if (!node_fs_1.default.existsSync(artifactsDir)) {
        return;
    }
    const lastConfigFile = node_path_1.default.join(artifactsDir, '.last_build_configuration');
    if (node_fs_1.default.existsSync(lastConfigFile)) {
        const last = node_fs_1.default.readFileSync(lastConfigFile, 'utf8').trim();
        if (last === flavor) {
            return;
        }
    }
    let scriptPath;
    try {
        scriptPath = require.resolve('expo-modules-autolinking/scripts/ios/replace-xcframework.js', {
            paths: [process.cwd()],
        });
    }
    catch {
        throw new Error(`Could not locate expo-modules-autolinking's replace-xcframework.js. ` +
            `Install expo-modules-autolinking in your project (it is usually a transitive dep of expo) ` +
            `and re-run with --use-prebuilds.`);
    }
    // `replace-xcframework.js -m` expects the pod's main product (the one whose tarball is at
    // `<podDir>/artifacts/<product>-<config>.tar.gz`), not necessarily the xcframework `name`
    // — sibling SPM-dep xcframeworks share the pod's main tarball.
    await (0, commands_1.runCommand)('node', [scriptPath, '-c', flavor, '-m', module.mainProduct, '-x', module.podDir], { verbose: options.verbose });
};
exports.ensureCorrectFlavor = ensureCorrectFlavor;
const resolvedFixedXCFrameworks = () => {
    return Object.values(constants_1.XCFramework).map((f) => f.name);
};
exports.resolvedFixedXCFrameworks = resolvedFixedXCFrameworks;
/**
 * Locates the shared SPM-deps cache root. Resolution order:
 *
 *  1. `$EXPO_PRECOMPILED_MODULES_PATH/.spm-deps/` — explicit override matching the Ruby
 *     autolinking convention (precompiled_modules.rb's MODULES_PATH_ENV_VAR).
 *  2. Walk up from `startDir` looking for `packages/precompile/.build/.spm-deps/` — the Expo
 *     monorepo's centralized cache.
 *
 * Returns the absolute path to the `.spm-deps/` dir, or null when neither is reachable.
 */
const findSpmDepsRoot = (startDir) => {
    const envOverride = process.env.EXPO_PRECOMPILED_MODULES_PATH;
    if (envOverride) {
        const candidate = node_path_1.default.join(envOverride, '.spm-deps');
        if (node_fs_1.default.existsSync(candidate)) {
            return candidate;
        }
    }
    let dir = node_path_1.default.resolve(startDir);
    while (true) {
        const candidate = node_path_1.default.join(dir, SPM_DEPS_RELATIVE);
        if (node_fs_1.default.existsSync(candidate)) {
            return candidate;
        }
        const parent = node_path_1.default.dirname(dir);
        if (parent === dir) {
            return null;
        }
        dir = parent;
    }
};
exports.findSpmDepsRoot = findSpmDepsRoot;
/**
 * Scans the monorepo `.spm-deps/` cache for prebuilt SPM-dependency xcframeworks matching the
 * requested build configuration. Each matching `<name>/<flavor>/<name>.xcframework` becomes a
 * `ModuleXCFramework` entry (with `mainProduct === name` since they have no parent pod).
 *
 * `existingNames` is the set of xcframework names already produced by the regular pod-scan
 * enumeration; matching entries here are skipped to avoid duplicate binary targets.
 *
 * Returns an empty array when the `.spm-deps/` cache can't be located (e.g. external users
 * outside the monorepo). Callers should treat that as a soft failure and warn that runtime
 * @rpath references for SPM deps may go unresolved.
 */
const enumerateSpmDepsXcframeworks = (cwd, buildConfiguration, existingNames) => {
    const spmDepsRoot = (0, exports.findSpmDepsRoot)(cwd);
    if (!spmDepsRoot) {
        return [];
    }
    const flavor = buildConfiguration.toLowerCase();
    const results = [];
    for (const entry of node_fs_1.default.readdirSync(spmDepsRoot, { withFileTypes: true })) {
        if (!entry.isDirectory() || entry.name.startsWith('_') || entry.name.startsWith('.')) {
            continue;
        }
        if (existingNames.has(entry.name)) {
            continue;
        }
        const xcframeworkPath = node_path_1.default.join(spmDepsRoot, entry.name, flavor, `${entry.name}.xcframework`);
        if (!node_fs_1.default.existsSync(xcframeworkPath)) {
            continue;
        }
        results.push({
            name: entry.name,
            podDir: node_path_1.default.join(spmDepsRoot, entry.name),
            xcframeworkPath,
            // SPM-dep xcframeworks aren't governed by `replace-xcframework.js` (no artifacts/ dir),
            // so flavor reconcile is a no-op for them. mainProduct mirrors `name` defensively.
            mainProduct: entry.name,
        });
    }
    return results;
};
exports.enumerateSpmDepsXcframeworks = enumerateSpmDepsXcframeworks;
const SPM_CONFIG_FILENAME = 'spm.config.json';
/** Reads + parses an `spm.config.json` file. Returns null on any read/parse failure. */
const readSpmConfig = (filePath) => {
    try {
        return JSON.parse(node_fs_1.default.readFileSync(filePath, 'utf8'));
    }
    catch {
        return null;
    }
};
/**
 * Builds a `Map<podName, NpmPackageInfo>` for every npm package reachable from `cwd` that has
 * an `spm.config.json` declaring a `podName`. Used to walk an enumerated pod (e.g. `ExpoImage`)
 * back to its npm package so we can read its declared `spmPackages`.
 *
 * Two scan passes:
 *  1. `<cwd>/node_modules/{*,@scope/*}/spm.config.json` — packages that ship their own config.
 *  2. `<expo-modules-autolinking>/external-configs/ios/{*,@scope/*}/spm.config.json` — third-party
 *     packages (RNReanimated, RNScreens, RNSkia, …) whose configs live in the autolinking
 *     package rather than alongside their own source.
 *
 * The node_modules pass runs first so a workspace-installed `spm.config.json` always wins over
 * the bundled external default. Each candidate is `realpath`'d for pnpm's `.pnpm/` store layout.
 */
const buildPodToNpmPackageMap = (cwd) => {
    const map = new Map();
    const nodeModules = node_path_1.default.join(cwd, 'node_modules');
    const recordProducts = (spmConfig, npmPackage, packageRoot) => {
        for (const product of spmConfig.products ?? []) {
            if (!product.podName) {
                continue;
            }
            if (!map.has(product.podName)) {
                map.set(product.podName, { npmPackage, packageRoot, spmConfig });
            }
        }
    };
    const indexNodeModulesCandidate = (candidate) => {
        const configPath = node_path_1.default.join(candidate, SPM_CONFIG_FILENAME);
        if (!node_fs_1.default.existsSync(configPath)) {
            return;
        }
        let packageRoot;
        try {
            packageRoot = node_fs_1.default.realpathSync(candidate);
        }
        catch {
            packageRoot = candidate;
        }
        const spmConfig = readSpmConfig(node_path_1.default.join(packageRoot, SPM_CONFIG_FILENAME));
        if (!spmConfig?.products?.length) {
            return;
        }
        let npmPackage;
        try {
            const pkgJson = JSON.parse(node_fs_1.default.readFileSync(node_path_1.default.join(packageRoot, 'package.json'), 'utf8'));
            npmPackage = pkgJson.name;
        }
        catch {
            // Best-effort — fall back to dir basename.
        }
        if (!npmPackage) {
            npmPackage = node_path_1.default.basename(packageRoot);
        }
        recordProducts(spmConfig, npmPackage, packageRoot);
    };
    if (node_fs_1.default.existsSync(nodeModules)) {
        for (const entry of node_fs_1.default.readdirSync(nodeModules, { withFileTypes: true })) {
            if (!entry.isDirectory() && !entry.isSymbolicLink()) {
                continue;
            }
            if (entry.name.startsWith('.')) {
                continue;
            }
            if (entry.name.startsWith('@')) {
                const scopeDir = node_path_1.default.join(nodeModules, entry.name);
                let scopedEntries;
                try {
                    scopedEntries = node_fs_1.default.readdirSync(scopeDir, { withFileTypes: true });
                }
                catch {
                    continue;
                }
                for (const scoped of scopedEntries) {
                    if (!scoped.isDirectory() && !scoped.isSymbolicLink()) {
                        continue;
                    }
                    indexNodeModulesCandidate(node_path_1.default.join(scopeDir, scoped.name));
                }
            }
            else {
                indexNodeModulesCandidate(node_path_1.default.join(nodeModules, entry.name));
            }
        }
    }
    // Pass 2: expo-modules-autolinking/external-configs/ios — configs for 3rd-party packages that
    // don't ship their own spm.config.json (e.g. react-native-reanimated, @shopify/react-native-skia).
    // Resolve directly inside `<cwd>/node_modules/` (following symlinks for pnpm) instead of using
    // `require.resolve`, which would walk up parent dirs and pick up an unrelated install.
    let externalConfigsRoot = null;
    const autolinkingPath = node_path_1.default.join(nodeModules, 'expo-modules-autolinking');
    if (node_fs_1.default.existsSync(node_path_1.default.join(autolinkingPath, 'package.json'))) {
        let autolinkingRoot = autolinkingPath;
        try {
            autolinkingRoot = node_fs_1.default.realpathSync(autolinkingPath);
        }
        catch {
            // realpath failed — keep the unresolved path; existsSync below handles the rest.
        }
        externalConfigsRoot = node_path_1.default.join(autolinkingRoot, 'external-configs', 'ios');
    }
    const indexExternalConfig = (configDir, npmPackage) => {
        const configPath = node_path_1.default.join(configDir, SPM_CONFIG_FILENAME);
        if (!node_fs_1.default.existsSync(configPath)) {
            return;
        }
        const spmConfig = readSpmConfig(configPath);
        if (!spmConfig?.products?.length) {
            return;
        }
        // The actual package install root (where `prebuilds/output/` would live, if anything) is
        // resolved via `require.resolve`. Fall back to the external-config dir so the entry still
        // exists in the map for declared-deps aggregation even when the package isn't installed.
        let packageRoot = configDir;
        try {
            const pkgJsonPath = require.resolve(`${npmPackage}/package.json`, { paths: [cwd] });
            packageRoot = node_path_1.default.dirname(pkgJsonPath);
        }
        catch {
            // Package not installed; the external-config dir is fine for spmConfig-only consumers.
        }
        recordProducts(spmConfig, npmPackage, packageRoot);
    };
    if (externalConfigsRoot && node_fs_1.default.existsSync(externalConfigsRoot)) {
        for (const entry of node_fs_1.default.readdirSync(externalConfigsRoot, { withFileTypes: true })) {
            if (!entry.isDirectory() && !entry.isSymbolicLink()) {
                continue;
            }
            if (entry.name.startsWith('@')) {
                const scopeDir = node_path_1.default.join(externalConfigsRoot, entry.name);
                let scopedEntries;
                try {
                    scopedEntries = node_fs_1.default.readdirSync(scopeDir, { withFileTypes: true });
                }
                catch {
                    continue;
                }
                for (const scoped of scopedEntries) {
                    if (!scoped.isDirectory() && !scoped.isSymbolicLink()) {
                        continue;
                    }
                    indexExternalConfig(node_path_1.default.join(scopeDir, scoped.name), `${entry.name}/${scoped.name}`);
                }
            }
            else {
                indexExternalConfig(node_path_1.default.join(externalConfigsRoot, entry.name), entry.name);
            }
        }
    }
    return map;
};
exports.buildPodToNpmPackageMap = buildPodToNpmPackageMap;
/**
 * Recursively searches `<packageRoot>/prebuilds/output/` for an xcframework matching the
 * requested name + flavor. The npm-publish pipeline writes deps under either:
 *   `prebuilds/output/<pkgVer>/<rnVer>/<hermesVer>/<flavor>/xcframeworks/<name>.xcframework` (versioned)
 *   `prebuilds/output/<flavor>/xcframeworks/<name>.xcframework` (flat)
 * We treat the layout as opaque and return the first match — RN/Hermes versions in the
 * consumer's project may not align with what was published, so an exact path match would be
 * brittle.
 *
 * Bounded depth to avoid pathological scans.
 */
const findBundledXcframework = (packageRoot, name, flavor, maxDepth = 10) => {
    const root = node_path_1.default.join(packageRoot, 'prebuilds', 'output');
    if (!node_fs_1.default.existsSync(root)) {
        return null;
    }
    const target = node_path_1.default.join(flavor, 'xcframeworks', `${name}.xcframework`);
    const walk = (dir, depth) => {
        if (depth > maxDepth) {
            return null;
        }
        const candidate = node_path_1.default.join(dir, target);
        if (node_fs_1.default.existsSync(candidate)) {
            return candidate;
        }
        let entries;
        try {
            entries = node_fs_1.default.readdirSync(dir, { withFileTypes: true });
        }
        catch {
            return null;
        }
        for (const entry of entries) {
            let isDir = entry.isDirectory();
            // pnpm and similar package managers symlink workspace packages — readdir's Dirent
            // reports `isDirectory() === false` for them, so resolve the link with `statSync`
            // (which follows symlinks) to avoid skipping legitimate prebuild output trees.
            if (!isDir && entry.isSymbolicLink()) {
                try {
                    isDir = node_fs_1.default.statSync(node_path_1.default.join(dir, entry.name)).isDirectory();
                }
                catch {
                    // Broken symlink, skip it.
                    continue;
                }
            }
            if (!isDir) {
                continue;
            }
            const found = walk(node_path_1.default.join(dir, entry.name), depth + 1);
            if (found) {
                return found;
            }
        }
        return null;
    };
    return walk(root, 0);
};
/**
 * Returns the unique set of declared SPM-dep product names across the given pods, looked up
 * via each pod's npm package's `spm.config.json`. Used both as the source-of-truth completeness
 * check and as the input to bundled-dep enumeration.
 */
const collectDeclaredSpmDeps = (modules, podToNpm) => {
    const seen = new Map();
    for (const module of modules) {
        // Look up by pod name. The map is keyed on `spm.config.json`'s `podName`, but our enumerator
        // uses the pod directory name; for first-party Expo modules these match exactly.
        // Fall back to the xcframework basename for the rare case where they don't.
        const podName = node_path_1.default.basename(module.podDir);
        const info = podToNpm.get(podName) ?? podToNpm.get(module.mainProduct);
        if (!info) {
            continue;
        }
        for (const product of info.spmConfig.products ?? []) {
            for (const pkg of product.spmPackages ?? []) {
                if (pkg.productName && !seen.has(pkg.productName)) {
                    seen.set(pkg.productName, info.npmPackage);
                }
            }
        }
    }
    return Array.from(seen.entries()).map(([name, declaringPod]) => ({ name, declaringPod }));
};
exports.collectDeclaredSpmDeps = collectDeclaredSpmDeps;
/**
 * For each enumerated pod, walk back to its npm package, read declared `spmPackages`, and look
 * for a matching `<name>.xcframework` under that package's `prebuilds/output/.../<flavor>/`
 * tree. This is the npm-published consumer path — the precompile pipeline's `bundleSharedDeps`
 * mode drops the SPM-dep xcframeworks alongside the main product when publishing, so external
 * (non-monorepo) users have everything they need locally without any shared cache.
 *
 * Skips entries already in `existingNames` (pod-scan layer wins over bundled). Silently omits
 * deps whose xcframework can't be found here — the strict completeness check downstream
 * (in copyXCFrameworks) is the source of truth for surfacing unresolvable deps.
 */
const enumerateBundledSpmDepsXcframeworks = (modules, podToNpm, buildConfiguration, existingNames) => {
    const flavor = buildConfiguration.toLowerCase();
    const results = [];
    const seen = new Set(existingNames);
    for (const module of modules) {
        const podName = node_path_1.default.basename(module.podDir);
        const info = podToNpm.get(podName) ?? podToNpm.get(module.mainProduct);
        if (!info) {
            continue;
        }
        for (const product of info.spmConfig.products ?? []) {
            for (const pkg of product.spmPackages ?? []) {
                const depName = pkg.productName;
                if (!depName || seen.has(depName)) {
                    continue;
                }
                const xcframeworkPath = findBundledXcframework(info.packageRoot, depName, flavor);
                if (!xcframeworkPath) {
                    continue;
                }
                seen.add(depName);
                results.push({
                    name: depName,
                    podDir: node_path_1.default.dirname(xcframeworkPath),
                    xcframeworkPath,
                    // No `artifacts/` dir → ensureCorrectFlavor is a no-op. mainProduct mirrors name.
                    mainProduct: depName,
                });
            }
        }
    }
    return results;
};
exports.enumerateBundledSpmDepsXcframeworks = enumerateBundledSpmDepsXcframeworks;
/**
 * Single source of truth for the full prebuild module set. Walks all three layers in priority
 * order (pod → bundled-npm → shared `.spm-deps/`), deduping by xcframework name across layers,
 * and runs the strict completeness check before returning.
 *
 * Both `copyXCFrameworks` (bundles xcframeworks into the package) and `generatePackageMetadataFile`
 * (declares them in `Package.swift`) need to see the exact same module set, otherwise an
 * xcframework can land on disk without a matching `.binaryTarget` (or vice-versa). Calling this
 * helper from both sites guarantees they agree, and gates both behind the completeness check
 * so we never produce a half-baked package on missing deps.
 */
const enumerateAllPrebuildModules = (cwd, buildConfiguration) => {
    const podModules = (0, exports.enumeratePrecompiledModules)(node_path_1.default.join(cwd, 'ios'));
    const podToNpm = (0, exports.buildPodToNpmPackageMap)(cwd);
    const seenNames = new Set(podModules.map((m) => m.name));
    const bundledModules = (0, exports.enumerateBundledSpmDepsXcframeworks)(podModules, podToNpm, buildConfiguration, seenNames);
    bundledModules.forEach((m) => seenNames.add(m.name));
    const spmDepModules = (0, exports.enumerateSpmDepsXcframeworks)(cwd, buildConfiguration, seenNames);
    const modules = [...podModules, ...bundledModules, ...spmDepModules];
    const declaredDeps = (0, exports.collectDeclaredSpmDeps)(podModules, podToNpm);
    const coveredNames = new Set(modules.map((m) => m.name));
    const missing = declaredDeps.filter(({ name }) => !coveredNames.has(name));
    if (missing.length > 0) {
        const detail = missing
            .map(({ name, declaringPod }) => `${name} (required by ${declaringPod})`)
            .join(', ');
        error_1.default.handle('ios-prebuilds-spm-dep-missing', detail);
    }
    return modules;
};
exports.enumerateAllPrebuildModules = enumerateAllPrebuildModules;
//# sourceMappingURL=precompiled.js.map