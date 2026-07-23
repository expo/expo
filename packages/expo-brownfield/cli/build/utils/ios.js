"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.shipSwiftPackage = exports.shipFrameworks = exports.validateHostProvided = exports.validateSchemeCollision = exports.printIosConfig = exports.makeArtifactsDirectory = exports.binaryTarget = exports.libraryProduct = exports.getSupportedPlatforms = exports.generatePackageMetadataFile = exports.findWorkspace = exports.findScheme = exports.createXCframework = exports.createSwiftPackage = exports.copyXCFrameworks = exports.buildFramework = exports.cleanUpArtifacts = exports.enumerateSourceBuiltDeps = void 0;
const spawn_async_1 = __importDefault(require("@expo/spawn-async"));
const chalk_1 = __importDefault(require("chalk"));
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const constants_1 = require("./constants");
const error_1 = __importDefault(require("./error"));
const precompiled_1 = require("./precompiled");
const spinner_1 = require("./spinner");
/**
 * Inspect the built brownfield framework binary and return the names of `@rpath`-linked
 * dynamic frameworks that are NOT already covered by the fixed XCFramework set, the
 * brownfield target itself, or precompiled-module enumeration.
 *
 * Source-built pods (e.g. `ExpoModulesJSI` from a local podspec) are produced as dynamic
 * `.framework`s alongside the brownfield framework, and the brownfield binary holds an
 * `@rpath/<X>.framework/<X>` reference to each. Without shipping these as standalone
 * xcframeworks the host app crashes at runtime with `dyld: Library not loaded: @rpath/…`.
 *
 * Returns names without the `.framework` suffix, deduped, in `otool -L` order.
 */
const enumerateSourceBuiltDeps = async (config, alreadyCovered) => {
    const frameworkDir = findSourceBuiltFramework(config.simulator, config.scheme);
    if (!frameworkDir) {
        return [];
    }
    const frameworkBinary = node_path_1.default.join(frameworkDir, config.scheme);
    if (!node_fs_1.default.existsSync(frameworkBinary)) {
        return [];
    }
    let stdout;
    try {
        ({ stdout } = await (0, spawn_async_1.default)('otool', ['-L', frameworkBinary]));
    }
    catch {
        // otool failure is non-fatal — degrade gracefully and let the user catch the missing dep
        // at runtime rather than blocking the whole build.
        return [];
    }
    const hostProvided = new Set(config.hostProvidedFrameworks);
    const names = new Set();
    for (const line of stdout.split('\n')) {
        const match = line.trim().match(/^@rpath\/([^/]+)\.framework\//);
        if (match?.[1]) {
            names.add(match[1]);
        }
    }
    return Array.from(names).filter((name) => name !== config.scheme && !alreadyCovered.has(name) && !hostProvided.has(name));
};
exports.enumerateSourceBuiltDeps = enumerateSourceBuiltDeps;
/**
 * Build the `-framework <path>` (+ optional `-debug-symbols <dSYM-path>`) arg
 * sequence for one slice of a `xcodebuild -create-xcframework` invocation.
 *
 * `-debug-symbols` is strict — pointing it at a non-existent path fails the
 * whole create step — so we only attach the flag when the dSYM has actually
 * been produced for that slice. dSYMs land at `<framework>.dSYM` next to the
 * `.framework` in the products dir whenever
 * `DEBUG_INFORMATION_FORMAT=dwarf-with-dsym` is in effect (forced for
 * brownfield builds in `buildFramework`, but not guaranteed for transitive
 * source-built deps that build under their own pod build settings).
 */
const xcframeworkSliceArgs = (frameworkPath) => {
    const args = ['-framework', frameworkPath];
    const dsymPath = `${frameworkPath}.dSYM`;
    if (node_fs_1.default.existsSync(dsymPath)) {
        args.push('-debug-symbols', dsymPath);
    }
    return args;
};
/**
 * Locate a source-built `.framework` for `name` inside one of the brownfield build product
 * slices. Pods that set `FRAMEWORK_SEARCH_PATHS` to `${PODS_CONFIGURATION_BUILD_DIR}/XCFrameworkIntermediates/<name>`
 * (e.g. `ExpoModulesJSI`) land in `XCFrameworkIntermediates/<name>/<name>.framework` rather
 * than at the slice root, so we check both locations.
 */
const findSourceBuiltFramework = (slicePath, name) => {
    const candidates = [
        node_path_1.default.join(slicePath, `${name}.framework`),
        node_path_1.default.join(slicePath, 'XCFrameworkIntermediates', name, `${name}.framework`),
    ];
    return candidates.find((candidate) => node_fs_1.default.existsSync(candidate)) ?? null;
};
/**
 * Build an xcframework from the device + simulator slices of a source-built `.framework`
 * sitting in the brownfield build products dir, and copy it into `dest`. Returns whether
 * the xcframework was produced (false when one or both slices are missing — typically a
 * harmless skip for a system framework or a transitive dep that isn't actually built).
 */
const bundleSourceBuiltFramework = async (config, name, dest) => {
    const deviceFramework = findSourceBuiltFramework(config.device, name);
    const simulatorFramework = findSourceBuiltFramework(config.simulator, name);
    if (!deviceFramework || !simulatorFramework) {
        console.warn(`expo-brownfield: source-built dependency '${name}' is linked by ${config.scheme}.framework ` +
            `but its device/simulator slices were not found under the brownfield build products dir. ` +
            `Skipping. The host app may fail at runtime with 'Library not loaded: @rpath/${name}.framework/${name}'.`);
        return false;
    }
    const outputPath = node_path_1.default.join(dest, `${name}.xcframework`);
    if (node_fs_1.default.existsSync(outputPath)) {
        node_fs_1.default.rmSync(outputPath, { recursive: true, force: true });
    }
    const args = [
        '-create-xcframework',
        ...xcframeworkSliceArgs(deviceFramework),
        ...xcframeworkSliceArgs(simulatorFramework),
        '-output',
        outputPath,
    ];
    if (config.dryRun) {
        console.log(`xcodebuild ${args.join(' ')}`);
        return true;
    }
    await (0, spawn_async_1.default)('xcodebuild', args, { stdio: config.verbose ? 'inherit' : 'pipe' });
    return true;
};
const cleanUpArtifacts = async (config) => {
    if (config.dryRun) {
        console.log('Cleaning up previous artifacts');
        return;
    }
    return (0, spinner_1.withSpinner)({
        operation: async () => {
            if (!node_fs_1.default.existsSync(config.artifacts)) {
                return;
            }
            node_fs_1.default.readdirSync(config.artifacts).forEach((item) => {
                const itemPath = `${config.artifacts}/${item}`;
                node_fs_1.default.rmSync(itemPath, { recursive: true, force: true });
            });
        },
        loaderMessage: 'Cleaning up previous artifacts...',
        successMessage: 'Cleaning up previous artifacts succeeded',
        errorMessage: 'Cleaning up previous artifacts failed',
    });
};
exports.cleanUpArtifacts = cleanUpArtifacts;
const buildFramework = async (config) => {
    const args = [
        '-workspace',
        config.workspace,
        '-scheme',
        config.scheme,
        '-derivedDataPath',
        config.derivedDataPath,
        '-destination',
        'generic/platform=iphoneos',
        '-destination',
        'generic/platform=iphonesimulator',
        '-configuration',
        config.buildConfiguration,
        // Ensure dSYMs are produced for both Debug and Release so they can be
        // bundled into the resulting xcframework via `-create-xcframework
        // -debug-symbols`. Release defaults to `dwarf-with-dsym`; Debug defaults
        // to plain `dwarf` and would otherwise leave us with no dSYM to ship.
        'DEBUG_INFORMATION_FORMAT=dwarf-with-dsym',
    ];
    if (config.dryRun) {
        console.log(`xcodebuild ${args.join(' ')}`);
        return;
    }
    return (0, spinner_1.withSpinner)({
        operation: () => (0, spawn_async_1.default)('xcodebuild', args, { stdio: config.verbose ? 'inherit' : 'pipe' }),
        loaderMessage: 'Compiling framework...',
        successMessage: 'Compiling framework succeeded',
        errorMessage: 'Compiling framework failed',
        verbose: config.verbose,
    });
};
exports.buildFramework = buildFramework;
const copyXCFrameworks = async (config, dest) => {
    console.log('Copying XCFrameworks to:', dest);
    if (config.dryRun) {
        return;
    }
    const xcframeworks = Object.values(constants_1.XCFramework);
    for (const xcframework of xcframeworks) {
        if (node_fs_1.default.existsSync(xcframework.path)) {
            await (0, spinner_1.withSpinner)({
                operation: async () => node_fs_1.default.promises.cp(xcframework.path, node_path_1.default.join(dest, `${xcframework.name}.xcframework`), {
                    force: true,
                    recursive: true,
                }),
                loaderMessage: `Copying ${xcframework.name} to the artifacts directory...`,
                successMessage: `Copying ${xcframework.name} to the artifacts directory succeeded`,
                errorMessage: `Copying ${xcframework.name} to the artifacts directory failed`,
                verbose: config.verbose,
            });
        }
        else if (xcframework.name === constants_1.XCFramework.Hermes.name) {
            error_1.default.handle('ios-hermes-framework-not-found', xcframework.path);
        }
        else {
            console.warn(`${xcframework.name} not found in source path: ${xcframework.path}. Assuming it's built from sources`);
        }
    }
    if (config.usePrebuilds) {
        // Single source of truth: enumerates all three layers (pod → bundled-npm → shared
        // `.spm-deps/`) and runs the strict completeness check. Failing here surfaces missing
        // deps at packaging time (rather than as `Library not loaded: @rpath/...` at runtime).
        // Host-provided frameworks are filtered out here so they're neither copied to the artifact
        // dir nor counted as a missing SPM-dep.
        const modules = (0, precompiled_1.enumerateAllPrebuildModules)(process.cwd(), config.buildConfiguration, config.hostProvidedFrameworks);
        // Reconcile flavor once per pod — replace-xcframework.js extracts the whole tarball
        // (main + sibling SPM-dep xcframeworks) in one shot, so re-running per-xcframework would
        // unpack the same tarball repeatedly. SPM-dep entries (mainProduct === name, no artifacts/)
        // skip reconciliation entirely inside ensureCorrectFlavor.
        const reconciledPods = new Set();
        for (const module of modules) {
            if (!reconciledPods.has(module.podDir)) {
                reconciledPods.add(module.podDir);
                await (0, precompiled_1.ensureCorrectFlavor)(module, config.buildConfiguration, { verbose: config.verbose });
            }
            await (0, spinner_1.withSpinner)({
                operation: async () => node_fs_1.default.promises.cp(module.xcframeworkPath, node_path_1.default.join(dest, `${module.name}.xcframework`), {
                    force: true,
                    recursive: true,
                }),
                loaderMessage: `Copying ${module.name} to the artifacts directory...`,
                successMessage: `Copying ${module.name} to the artifacts directory succeeded`,
                errorMessage: `Copying ${module.name} to the artifacts directory failed`,
                verbose: config.verbose,
            });
        }
    }
    // Bundle any source-built dynamic frameworks the brownfield binary links against
    // (e.g. `ExpoModulesJSI` from a local podspec). Without this the host app crashes at
    // runtime with `dyld: Library not loaded: @rpath/<X>.framework/<X>`.
    const alreadyCovered = collectCoveredFrameworkNames(config);
    const sourceBuiltDeps = await (0, exports.enumerateSourceBuiltDeps)(config, alreadyCovered);
    for (const depName of sourceBuiltDeps) {
        await (0, spinner_1.withSpinner)({
            operation: () => bundleSourceBuiltFramework(config, depName, dest),
            loaderMessage: `Bundling source-built ${depName} as xcframework...`,
            successMessage: `Bundling source-built ${depName} as xcframework succeeded`,
            errorMessage: `Bundling source-built ${depName} as xcframework failed`,
            verbose: config.verbose,
        });
    }
};
exports.copyXCFrameworks = copyXCFrameworks;
/**
 * Set of xcframework names the brownfield CLI already plans to ship (fixed XCFrameworks +
 * prebuilt modules when enabled). Used to dedupe against `enumerateSourceBuiltDeps` so a
 * dep that's already covered by a prebuilt artifact isn't re-built from source.
 */
const collectCoveredFrameworkNames = (config) => {
    const covered = new Set([config.scheme, ...(0, precompiled_1.resolvedFixedXCFrameworks)()]);
    if (config.usePrebuilds) {
        for (const module of (0, precompiled_1.enumerateAllPrebuildModules)(process.cwd(), config.buildConfiguration, config.hostProvidedFrameworks)) {
            covered.add(module.name);
        }
    }
    return covered;
};
const createSwiftPackage = async (config) => {
    if (config.dryRun && config.output !== 'frameworks') {
        console.log(`Creating Swift package with name: ${config.output.packageName} at path: ${config.artifacts}`);
        return '';
    }
    return await (0, spinner_1.withSpinner)({
        operation: async () => {
            if (config.output === 'frameworks') {
                return '';
            }
            const packagePath = node_path_1.default.join(config.artifacts, config.output.packageName);
            await node_fs_1.default.promises.mkdir(packagePath, { recursive: true });
            // <package-name>/xcframeworks
            const xcframeworksDir = node_path_1.default.join(packagePath, 'xcframeworks');
            await node_fs_1.default.promises.mkdir(xcframeworksDir, { recursive: true });
            await (0, exports.generatePackageMetadataFile)(config, packagePath);
            return packagePath;
        },
        loaderMessage: 'Creating Swift package...',
        successMessage: 'Creating Swift package succeeded',
        errorMessage: 'Creating Swift package failed',
        verbose: config.verbose,
    });
};
exports.createSwiftPackage = createSwiftPackage;
const createXCframework = async (config, at) => {
    const frameworkName = `${config.scheme}.xcframework`;
    const outputPath = node_path_1.default.join(at, frameworkName);
    // Precompiled-module builds can place the scheme's framework under
    // `XCFrameworkIntermediates/<scheme>/` instead of the products-dir root. In dry-run mode
    // nothing has been built, so fall back to the root path to print the command.
    const resolveSlice = (slicePath) => {
        const framework = findSourceBuiltFramework(slicePath, config.scheme);
        if (framework) {
            return framework;
        }
        const fallback = node_path_1.default.join(slicePath, `${config.scheme}.framework`);
        if (!config.dryRun) {
            error_1.default.handle('ios-framework-not-found', fallback);
        }
        return fallback;
    };
    const args = [
        '-create-xcframework',
        ...xcframeworkSliceArgs(resolveSlice(config.device)),
        ...xcframeworkSliceArgs(resolveSlice(config.simulator)),
        '-output',
        outputPath,
    ];
    if (config.dryRun) {
        console.log(`xcodebuild ${args.join(' ')}`);
        return;
    }
    return (0, spinner_1.withSpinner)({
        operation: () => (0, spawn_async_1.default)('xcodebuild', args, { stdio: config.verbose ? 'inherit' : 'pipe' }),
        loaderMessage: 'Packaging framework into an XCFramework...',
        successMessage: 'Packaging framework into an XCFramework succeeded',
        errorMessage: 'Packaging framework into an XCFramework failed',
        verbose: config.verbose,
    });
};
exports.createXCframework = createXCframework;
const findScheme = () => {
    try {
        const iosPath = node_path_1.default.join(process.cwd(), 'ios');
        if (!node_fs_1.default.existsSync(iosPath)) {
            error_1.default.handle('ios-directory-not-found');
        }
        const subdirectories = node_fs_1.default
            .readdirSync(iosPath, { withFileTypes: true })
            .filter((item) => item.isDirectory());
        const scheme = subdirectories.find((directory) => {
            const directoryPath = node_path_1.default.resolve(iosPath, directory.name);
            const directories = [directoryPath];
            let target;
            while ((target = directories.shift()) != null) {
                const entries = node_fs_1.default.readdirSync(target, { withFileTypes: true });
                for (const entry of entries) {
                    const childPath = node_path_1.default.join(target, entry.name);
                    if (entry.isDirectory()) {
                        directories.push(childPath);
                    }
                    else if (entry.isFile()) {
                        if (entry.name === 'ReactNativeHostManager.swift')
                            return true;
                    }
                }
            }
            return false;
        });
        if (scheme) {
            return scheme.name;
        }
        error_1.default.handle('ios-scheme-not-found');
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : '';
        error_1.default.handle('ios-directory-unknown-error', errorMessage);
    }
    return;
};
exports.findScheme = findScheme;
const findWorkspace = (dryRun) => {
    // XCWorkspace cannot be inferred on Ubuntu runners
    // as pods cannot be installed
    if (dryRun) {
        return node_path_1.default.join(process.cwd(), 'ios/testappbuildiospb.xcworkspace');
    }
    try {
        const iosPath = node_path_1.default.join(process.cwd(), 'ios');
        if (!node_fs_1.default.existsSync(iosPath)) {
            error_1.default.handle('ios-directory-not-found');
        }
        const items = node_fs_1.default.readdirSync(iosPath, { withFileTypes: true });
        const workspace = items.find((item) => item.name.endsWith('.xcworkspace'));
        if (workspace) {
            return node_path_1.default.join(iosPath, workspace.name);
        }
        error_1.default.handle('ios-workspace-not-found');
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : '';
        error_1.default.handle('ios-workspace-unknown-error', errorMessage);
    }
    return;
};
exports.findWorkspace = findWorkspace;
const generatePackageMetadataFile = async (config, packagePath) => {
    if (config.output === 'frameworks') {
        return;
    }
    const prebuiltFrameworks = node_fs_1.default.existsSync(constants_1.XCFramework.React.path);
    const baseFrameworks = [
        { name: config.scheme, targets: [config.scheme] },
        { name: 'hermesvm', targets: ['hermesvm'] },
        ...(prebuiltFrameworks ? [constants_1.XCFramework.React, constants_1.XCFramework.ReactDependencies] : []),
    ];
    // Use the same enumeration + completeness check that `copyXCFrameworks` runs, so every
    // xcframework that lands on disk is also declared as a `.binaryTarget` here (and vice-versa).
    // The check fails fast — Package.swift never gets written if a declared SPM dep is missing.
    const precompiledModules = config.usePrebuilds
        ? (0, precompiled_1.enumerateAllPrebuildModules)(process.cwd(), config.buildConfiguration, config.hostProvidedFrameworks).map(({ name }) => ({
            name,
            targets: [name],
        }))
        : [];
    // Source-built dynamic deps the brownfield framework links against (e.g. ExpoModulesJSI).
    // `copyXCFrameworks` writes their xcframeworks to disk; we need to declare matching
    // `.binaryTarget`s here so SPM consumers actually link them.
    const sourceBuiltDepNames = await (0, exports.enumerateSourceBuiltDeps)(config, new Set([
        config.scheme,
        ...baseFrameworks.map(({ name }) => name),
        ...precompiledModules.map(({ name }) => name),
    ]));
    const sourceBuiltDeps = sourceBuiltDepNames.map((name) => ({ name, targets: [name] }));
    const seenNames = new Set();
    const xcframeworks = [...baseFrameworks, ...precompiledModules, ...sourceBuiltDeps].filter(({ name }) => {
        if (seenNames.has(name)) {
            return false;
        }
        seenNames.add(name);
        return true;
    });
    // With prebuilds the module graph is large; expose a single aggregate library so consumers
    // `import <PackageName>` once and Xcode links every underlying binary target automatically.
    // Without prebuilds keep one `.library` per framework for backwards compatibility.
    const products = config.usePrebuilds
        ? [
            (0, exports.libraryProduct)(config.output.packageName, xcframeworks.map(({ name }) => name)),
        ]
        : xcframeworks.map(({ name, targets }) => (0, exports.libraryProduct)(name, targets));
    const contents = `// swift-tools-version:5.9
import PackageDescription

let package = Package(
    name: "${config.output.packageName}",
    platforms: [${(await (0, exports.getSupportedPlatforms)(config)).join(',')}],
    products: [
${products.join('\n')}
    ],
    targets: [
${xcframeworks.map(({ name }) => (0, exports.binaryTarget)(name)).join('\n')}
    ],
);
`;
    await node_fs_1.default.promises.writeFile(node_path_1.default.join(packagePath, 'Package.swift'), contents);
};
exports.generatePackageMetadataFile = generatePackageMetadataFile;
const getSupportedPlatforms = async (config) => {
    // Try to infer `IPHONEOS_DEPLOYMENT_TARGET` from the project
    const args = ['-workspace', config.workspace, '-scheme', config.scheme, '-showBuildSettings'];
    try {
        const { stdout } = await (0, spawn_async_1.default)('xcodebuild', args);
        const regex = /^\s*IPHONEOS_DEPLOYMENT_TARGET = (.+)$/m;
        const value = regex.exec(stdout)?.[1]?.trim();
        if (value) {
            return [`.iOS("${value}")`];
        }
        else {
            throw new Error();
        }
    }
    catch (error) {
        console.warn('Failed to infer `IPHONEOS_DEPLOYMENT_TARGET` from the project, defaulting to iOS v15');
    }
    // If failed to infer default to iOS v15
    return ['.iOS(.v15)'];
};
exports.getSupportedPlatforms = getSupportedPlatforms;
const libraryProduct = (name, targets) => {
    return `      .library(
        name: "${name}",
        targets: ["${targets.join('", "')}"],
      ),`;
};
exports.libraryProduct = libraryProduct;
const binaryTarget = (name) => {
    return `      .binaryTarget(
        name: "${name}",
        path: "xcframeworks/${name}.xcframework",
      ),`;
};
exports.binaryTarget = binaryTarget;
const makeArtifactsDirectory = (config) => {
    try {
        if (!node_fs_1.default.existsSync(config.artifacts)) {
            node_fs_1.default.mkdirSync(config.artifacts, { recursive: true });
        }
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : '';
        error_1.default.handle('ios-artifacts-directory-unknown-error', errorMessage);
    }
};
exports.makeArtifactsDirectory = makeArtifactsDirectory;
const printIosConfig = (config) => {
    console.log(chalk_1.default.bold('Resolved build configuration'));
    console.log(` - Build configuration: ${chalk_1.default.blue(config.buildConfiguration)}`);
    console.log(` - Scheme: ${chalk_1.default.blue(config.scheme)}`);
    console.log(` - Workspace: ${chalk_1.default.blue(config.workspace)}`);
    console.log(` - Dry run: ${chalk_1.default.blue(config.dryRun)}`);
    console.log(` - Verbose: ${chalk_1.default.blue(config.verbose)}`);
    console.log(` - Artifacts path: ${chalk_1.default.blue(config.artifacts)}`);
    if (config.output !== 'frameworks') {
        console.log(` - Package name: ${chalk_1.default.blue(config.output.packageName)}`);
    }
    console.log(` - Bundle precompiled modules: ${chalk_1.default.blue(config.usePrebuilds)}`);
    if (config.hostProvidedFrameworks.length > 0) {
        console.log(` - Host-provided frameworks: ${chalk_1.default.blue(config.hostProvidedFrameworks.join(', '))}`);
    }
    console.log();
};
exports.printIosConfig = printIosConfig;
/**
 * Fails fast when the brownfield scheme shares its name with a bundled framework — the bundled
 * xcframework would silently overwrite the wrapper framework in the output, and Package.swift
 * would declare the same target twice.
 */
const validateSchemeCollision = (config) => {
    const bundled = new Set((0, precompiled_1.resolvedFixedXCFrameworks)());
    if (config.usePrebuilds) {
        for (const module of (0, precompiled_1.enumerateAllPrebuildModules)(process.cwd(), config.buildConfiguration, config.hostProvidedFrameworks)) {
            bundled.add(module.name);
        }
    }
    if (bundled.has(config.scheme)) {
        error_1.default.handle('ios-scheme-name-collision', config.scheme);
    }
};
exports.validateSchemeCollision = validateSchemeCollision;
const validateHostProvided = (config) => {
    if (config.hostProvidedFrameworks.length === 0) {
        return;
    }
    if (!config.usePrebuilds) {
        error_1.default.handle('ios-host-provided-without-prebuilds');
        return;
    }
    // Use the same three-layer enumeration the build path uses, so a host-provided framework
    // resolved out of `node_modules/<pkg>/prebuilds/output/` or `packages/precompile/.build/.spm-deps/`
    // (rather than `ios/Pods/`) is still detected and doesn't spuriously trigger the unused-entry
    // warning. `enumeratePrebuildModulesRaw` skips the host-provided filter and missing-dep check
    // that `enumerateAllPrebuildModules` would otherwise apply.
    const { modules } = (0, precompiled_1.enumeratePrebuildModulesRaw)(process.cwd(), config.buildConfiguration);
    const pathsByName = new Map();
    for (const module of modules) {
        if (!pathsByName.has(module.name)) {
            pathsByName.set(module.name, module.xcframeworkPath);
        }
    }
    for (const name of config.hostProvidedFrameworks) {
        const xcframeworkPath = pathsByName.get(name);
        if (xcframeworkPath === undefined) {
            console.warn(chalk_1.default.yellow(`expo-brownfield: '${name}' is listed in ios.hostProvidedFrameworks but no matching xcframework was found in ios/Pods/, node_modules/<pkg>/prebuilds/output/, or the shared .spm-deps/ cache. Remove it from the config, or re-run \`pod install\` if the source module isn't installed yet.`));
            continue;
        }
        const version = readXcframeworkShortVersion(xcframeworkPath);
        const versionLabel = version ?? 'unknown version';
        console.log(chalk_1.default.dim(`expo-brownfield: excluding ${name} (${versionLabel}) — the host iOS app must provide ${name} at a compatible version at link time.`));
    }
};
exports.validateHostProvided = validateHostProvided;
/**
 * Reads the first `Info.plist` we can find inside an xcframework and returns
 * the `CFBundleShortVersionString` value.
 */
const readXcframeworkShortVersion = (xcframeworkPath) => {
    let slices;
    try {
        slices = node_fs_1.default.readdirSync(xcframeworkPath, { withFileTypes: true });
    }
    catch {
        return null;
    }
    for (const slice of slices) {
        if (!slice.isDirectory()) {
            continue;
        }
        const sliceDir = node_path_1.default.join(xcframeworkPath, slice.name);
        let frameworks;
        try {
            frameworks = node_fs_1.default.readdirSync(sliceDir, { withFileTypes: true });
        }
        catch {
            continue;
        }
        for (const fw of frameworks) {
            if (!fw.isDirectory() || !fw.name.endsWith('.framework')) {
                continue;
            }
            const infoPlistCandidates = [
                node_path_1.default.join(sliceDir, fw.name, 'Info.plist'),
                node_path_1.default.join(sliceDir, fw.name, 'Resources', 'Info.plist'),
            ];
            for (const plist of infoPlistCandidates) {
                if (!node_fs_1.default.existsSync(plist)) {
                    continue;
                }
                try {
                    const xml = node_fs_1.default.readFileSync(plist, 'utf8');
                    const match = xml.match(/<key>CFBundleShortVersionString<\/key>\s*<string>([^<]+)<\/string>/);
                    if (match?.[1]) {
                        return match[1].trim();
                    }
                }
                catch {
                    // Ignore — this is best-effort.
                }
            }
        }
    }
    return null;
};
const shipFrameworks = async (config) => {
    // Create artifacts directory
    await (0, exports.cleanUpArtifacts)(config);
    (0, exports.makeArtifactsDirectory)(config);
    // Copy/create XCFrameworks into the package
    await (0, exports.createXCframework)(config, config.artifacts);
    await (0, exports.copyXCFrameworks)(config, config.artifacts);
};
exports.shipFrameworks = shipFrameworks;
const shipSwiftPackage = async (config) => {
    // Create artifacts directory and swift package
    await (0, exports.cleanUpArtifacts)(config);
    (0, exports.makeArtifactsDirectory)(config);
    const packagePath = await (0, exports.createSwiftPackage)(config);
    const xcframeworksPath = node_path_1.default.join(packagePath, 'xcframeworks');
    // Copy/create XCFrameworks into the package
    await (0, exports.createXCframework)(config, xcframeworksPath);
    await (0, exports.copyXCFrameworks)(config, xcframeworksPath);
};
exports.shipSwiftPackage = shipSwiftPackage;
//# sourceMappingURL=ios.js.map