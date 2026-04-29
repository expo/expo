"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.__testing = exports.isManglingUpToDate = exports.runMangle = void 0;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const commands_1 = require("./commands");
const MANGLING_DEFINES_KEY = 'MANGLING_DEFINES';
const MANGLED_SPECS_CHECKSUM_KEY = 'MANGLED_SPECS_CHECKSUM';
const BUILD_DIR_NAME = 'build';
const BUILT_PRODUCTS_SUBDIR = node_path_1.default.join('build', 'Release-iphonesimulator');
/**
 * Symbol regexes lifted verbatim from the cocoapods-mangle gem
 * (lib/cocoapods_mangle/defines.rb) — they're the result of significant
 * empirical discovery of Swift symbol shapes that must NOT be mangled.
 * Keep behavior byte-equivalent so an existing project's xcconfig diff is
 * limited to whitespace/checksum.
 */
const SWIFT_SYMBOL_PATTERNS = [
    /\$s/,
    / __(_)?swift/,
    /\d+Swift(\d+)?/,
    /Swift\d+/,
    /\d+SwiftUI(\d+)?/,
    /symbolic /,
    /associated conformance/,
    / globalinit/,
    /globalinit/,
    /_OBJC_CLASS_\$__/,
    /____ /,
    /_PROTOCOL/,
    /_\w+_swiftoverride_/,
    /_Z\w+swift/,
    /get_witness_table /,
];
const isSwiftSymbol = (line) => SWIFT_SYMBOL_PATTERNS.some((re) => re.test(line));
const LOG_FILE_NAME = 'expo-brownfield-mangle.log';
/**
 * Build the `iphonesimulator` Release configuration for each pod target so the
 * resulting `.framework`/`.a` binaries can be `nm`-scanned for symbols. Mirrors
 * `CocoapodsMangle::Builder#build!` from the gem.
 *
 * Two build-setting overrides are passed on the command line:
 *  - `SWIFT_VERIFY_EMITTED_MODULE_INTERFACE=NO`
 *  - `OTHER_SWIFT_FLAGS='$(inherited) -no-verify-emitted-module-interface'`
 *
 * These are normally written into the Pods project by `addPrebuiltSettings`
 * inside the Podfile's `post_install` block, but CocoaPods doesn't persist
 * post_install mutations to disk until *after* all hooks finish — which means
 * our mangle hook reads the un-mutated on-disk project. Without these
 * overrides, Swift module emission fails for modules that import prebuilt RN
 * frameworks (e.g. `ExpoModulesCore`).
 *
 * On failure the full xcodebuild output is written to
 * `<podsDir>/build/expo-brownfield-mangle.log` and the path surfaced in the
 * thrown error so the user has somewhere to look.
 */
const buildPodTargets = async (podsProjectPath, podTargetLabels, options) => {
    const podsDir = node_path_1.default.dirname(podsProjectPath);
    const buildDir = node_path_1.default.join(podsDir, BUILD_DIR_NAME);
    node_fs_1.default.rmSync(buildDir, { recursive: true, force: true });
    node_fs_1.default.mkdirSync(buildDir, { recursive: true });
    const logPath = node_path_1.default.join(buildDir, LOG_FILE_NAME);
    node_fs_1.default.writeFileSync(logPath, '');
    const sharedArgs = [
        '-project',
        podsProjectPath,
        '-configuration',
        'Release',
        '-sdk',
        'iphonesimulator',
        'build',
        'SWIFT_VERIFY_EMITTED_MODULE_INTERFACE=NO',
        'OTHER_SWIFT_FLAGS=$(inherited) -no-verify-emitted-module-interface',
    ];
    for (const target of podTargetLabels) {
        const args = ['-target', target, ...sharedArgs];
        try {
            const { stdout } = await (0, commands_1.runCommand)('xcodebuild', args, {
                cwd: podsDir,
                verbose: options.verbose,
            });
            node_fs_1.default.appendFileSync(logPath, `\n=== xcodebuild ${args.join(' ')} ===\n${stdout}`);
        }
        catch (error) {
            node_fs_1.default.appendFileSync(logPath, `\n=== xcodebuild ${args.join(' ')} (FAILED) ===\n${error instanceof Error ? error.message : String(error)}`);
            throw new Error(`expo-brownfield: failed to build pod target '${target}' for symbol mangling. ` +
                `This usually means a Swift module couldn't compile against the current Pod xcconfigs. ` +
                `Inspect the full xcodebuild output at: ${logPath}`);
        }
    }
    return node_path_1.default.join(podsDir, BUILT_PRODUCTS_SUBDIR);
};
/**
 * After the simulator build, find the binaries to scan with `nm`. Skip the
 * umbrella `Pods_*` and `libPods-*` outputs since they're aggregator targets,
 * not the per-pod libraries we want to mangle.
 */
const findBinariesToMangle = (builtProductsDir) => {
    const binaries = [];
    if (!node_fs_1.default.existsSync(builtProductsDir)) {
        return binaries;
    }
    const walk = (dir) => {
        for (const entry of node_fs_1.default.readdirSync(dir, { withFileTypes: true })) {
            const full = node_path_1.default.join(dir, entry.name);
            if (entry.isDirectory()) {
                if (entry.name.endsWith('.framework')) {
                    if (!entry.name.startsWith('Pods_')) {
                        const fwName = entry.name.slice(0, -'.framework'.length);
                        binaries.push(node_path_1.default.join(full, fwName));
                    }
                    continue;
                }
                walk(full);
                continue;
            }
            if (entry.isFile() && entry.name.endsWith('.a') && !entry.name.startsWith('libPods-')) {
                binaries.push(full);
            }
        }
    };
    walk(builtProductsDir);
    return binaries;
};
const runNm = async (binaries, flags) => {
    if (binaries.length === 0) {
        return [];
    }
    const { stdout } = await (0, commands_1.runCommand)('nm', [flags, ...binaries], { verbose: false });
    return stdout.split('\n').filter((line) => line.length > 0);
};
const extractClasses = (lines) => {
    const filtered = lines.filter((line) => !isSwiftSymbol(line));
    const classSymbols = filtered
        .filter((line) => /OBJC_CLASS_\$_/.test(line))
        .map((line) => line.replace(/^.*\$_/, ''));
    return Array.from(new Set(classSymbols));
};
const extractConstants = (lines) => {
    const filtered = lines.filter((line) => !isSwiftSymbol(line));
    const sConsts = filtered
        .filter((line) => / S /.test(line))
        .filter((line) => !/_OBJC_/.test(line))
        .filter((line) => !/__block_descriptor.*/.test(line))
        .map((line) => line.replace(/^.* _/, ''));
    const tConsts = filtered
        .filter((line) => / T /.test(line))
        .filter((line) => !/__copy_helper_block.*/.test(line))
        .filter((line) => !/__destroy_helper_block.*/.test(line))
        .map((line) => line.replace(/^.* _/, ''));
    return Array.from(new Set([...sConsts, ...tConsts]));
};
/**
 * Category selectors are emitted as ` t -[Class(Category) selector]` lines
 * by `nm`. We skip selectors on classes that are themselves being mangled
 * (their selectors get carried implicitly by the class rename) and otherwise
 * extract just the selector head.
 */
const extractCategorySelectors = (lines, classes) => {
    const classSet = new Set(classes);
    const selectorLineRe = / t [-|+]\[[^ ]*\([^ ]*\) [^ ]*\]/;
    const classNameRe = /[-|+]\[(.*?)\(/;
    const selectors = [];
    for (const line of lines) {
        if (!selectorLineRe.test(line)) {
            continue;
        }
        const className = classNameRe.exec(line)?.[1];
        if (className && classSet.has(className)) {
            continue;
        }
        const beforeRBracket = line.split(']')[0] + ']';
        const lastToken = beforeRBracket.match(/[^ ]*\]$/)?.[0];
        if (!lastToken) {
            continue;
        }
        const selector = lastToken.slice(0, -1).split(':')[0];
        if (selector) {
            selectors.push(selector);
        }
    }
    return Array.from(new Set(selectors));
};
const prefixSymbols = (prefix, symbols) => symbols.map((sym) => `${sym}=${prefix}${sym}`);
/**
 * Property setter/getter pairs need symmetric handling so that `setFoo:` →
 * `set<Prefix>Foo:` and `foo` → `<Prefix>foo` both round-trip. Lifted from
 * `CocoapodsMangle::Defines.prefix_selectors` in the gem.
 */
const prefixSelectors = (prefix, selectors) => {
    const remaining = new Set(selectors);
    const defines = [];
    const setters = selectors.filter((sel) => /^set[A-Z]/.test(sel));
    for (const setter of setters) {
        const upperGetter = setter.slice(3);
        if (!upperGetter) {
            continue;
        }
        const lowerGetter = upperGetter[0].toLowerCase() + upperGetter.slice(1);
        const getter = selectors.find((sel) => sel === upperGetter || sel === lowerGetter);
        if (!getter) {
            continue;
        }
        remaining.delete(setter);
        remaining.delete(getter);
        defines.push(`${setter}=set${prefix}${getter}`);
        defines.push(`${getter}=${prefix}${getter}`);
    }
    defines.push(...prefixSymbols(prefix, Array.from(remaining)));
    return defines;
};
const buildManglingDefines = async (prefix, binaries) => {
    const allSymbolsGU = await runNm(binaries, '-gU');
    const allSymbolsU = await runNm(binaries, '-U');
    const classes = extractClasses(allSymbolsGU);
    const constants = extractConstants(allSymbolsGU);
    const categorySelectors = extractCategorySelectors(allSymbolsU, classes);
    return [
        ...prefixSymbols(prefix, classes),
        ...prefixSymbols(prefix, constants),
        ...prefixSelectors(prefix, categorySelectors),
    ];
};
/** Read the existing xcconfig (if any) and return its `MANGLED_SPECS_CHECKSUM` value. */
const readExistingChecksum = (xcconfigPath) => {
    if (!node_fs_1.default.existsSync(xcconfigPath)) {
        return null;
    }
    const contents = node_fs_1.default.readFileSync(xcconfigPath, 'utf8');
    const match = new RegExp(`^${MANGLED_SPECS_CHECKSUM_KEY}\\s*=\\s*(\\S+)`, 'm').exec(contents);
    return match?.[1] ?? null;
};
const writeManglingXcconfig = (xcconfigPath, defines, specsChecksum) => {
    const contents = `// This config file is automatically generated by expo-brownfield any time the
// pod dependency graph changes. Commit it alongside Podfile.lock.

${MANGLING_DEFINES_KEY} = ${defines.join(' ')}

// Used to skip rebuilding the mangling defines when the dependency graph hasn't changed.
${MANGLED_SPECS_CHECKSUM_KEY} = ${specsChecksum}
`;
    node_fs_1.default.mkdirSync(node_path_1.default.dirname(xcconfigPath), { recursive: true });
    node_fs_1.default.writeFileSync(xcconfigPath, contents);
};
/**
 * Patch a per-pod xcconfig so it (1) `#include`s our mangling xcconfig and
 * (2) appends `$(MANGLING_DEFINES)` to its `GCC_PREPROCESSOR_DEFINITIONS`.
 * The transform is idempotent: re-running on an already-patched file leaves
 * it unchanged.
 */
const patchPodXcconfig = (podXcconfigPath, manglingXcconfigPath) => {
    if (!node_fs_1.default.existsSync(podXcconfigPath)) {
        return;
    }
    const includeLine = `#include "${manglingXcconfigPath}"`;
    let contents = node_fs_1.default.readFileSync(podXcconfigPath, 'utf8');
    if (!contents.includes(includeLine)) {
        contents = `${includeLine}\n${contents}`;
    }
    const definesRefRe = new RegExp(`\\$\\(${MANGLING_DEFINES_KEY}\\)`);
    if (!definesRefRe.test(contents)) {
        contents = contents.replace(/^(GCC_PREPROCESSOR_DEFINITIONS\s*=\s*[^\n]*)$/m, `$1 $(${MANGLING_DEFINES_KEY})`);
    }
    node_fs_1.default.writeFileSync(podXcconfigPath, contents);
};
/**
 * Entry point invoked by the Ruby shim during `pod install`. Responsibilities:
 *  1. Build the pod targets to iphonesimulator so we have binaries to scan.
 *  2. nm those binaries, filter Swift symbols, and assemble `MANGLING_DEFINES`.
 *  3. Write the mangling xcconfig + patch each pod's xcconfig to consume it.
 *
 * The Ruby shim already short-circuited on a checksum match before reaching
 * here, so this function unconditionally regenerates.
 */
const runMangle = async (context, options) => {
    const builtProductsDir = await buildPodTargets(context.podsProjectPath, context.podTargetLabels, options);
    const binaries = findBinariesToMangle(builtProductsDir);
    const defines = await buildManglingDefines(context.manglePrefix, binaries);
    writeManglingXcconfig(context.xcconfigPath, defines, context.specsChecksum);
    for (const podXcconfig of context.podXcconfigPaths) {
        patchPodXcconfig(podXcconfig, context.xcconfigPath);
    }
};
exports.runMangle = runMangle;
const isManglingUpToDate = (xcconfigPath, expectedChecksum) => readExistingChecksum(xcconfigPath) === expectedChecksum;
exports.isManglingUpToDate = isManglingUpToDate;
exports.__testing = {
    isSwiftSymbol,
    extractClasses,
    extractConstants,
    extractCategorySelectors,
    prefixSelectors,
};
//# sourceMappingURL=mangle.js.map