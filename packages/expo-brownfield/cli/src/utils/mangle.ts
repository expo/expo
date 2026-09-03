import spawnAsync from '@expo/spawn-async';
import fs from 'node:fs';
import path from 'node:path';

export interface MangleContext {
  podsProjectPath: string;
  podTargetLabels: string[];
  podXcconfigPaths: string[];
  manglePrefix: string;
  xcconfigPath: string;
  specsChecksum: string;
}

const MANGLING_HEADER_KEY = 'MANGLING_HEADER';
const MANGLED_SPECS_CHECKSUM_KEY = 'MANGLED_SPECS_CHECKSUM';
const MANGLING_HEADER_FILE_NAME = 'expo-brownfield-mangle.h';

const BUILD_DIR_NAME = 'build';
const BUILT_PRODUCTS_SUBDIR = path.join('build', 'Release-iphonesimulator');

/**
 * Symbol regexes lifted verbatim from the cocoapods-mangle gem
 * (lib/cocoapods_mangle/defines.rb) — they're the result of significant
 * empirical discovery of Swift symbol shapes that must NOT be mangled.
 * Keep behavior byte-equivalent so an existing project's xcconfig diff is
 * limited to whitespace/checksum.
 */
const SWIFT_SYMBOL_PATTERNS: RegExp[] = [
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
  /get_type_metadata /,
];

const isSwiftSymbol = (line: string): boolean => SWIFT_SYMBOL_PATTERNS.some((re) => re.test(line));

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
const buildPodTargets = async (
  podsProjectPath: string,
  podTargetLabels: string[],
  options: { verbose: boolean }
): Promise<string> => {
  const podsDir = path.dirname(podsProjectPath);
  const buildDir = path.join(podsDir, BUILD_DIR_NAME);
  fs.rmSync(buildDir, { recursive: true, force: true });
  fs.mkdirSync(buildDir, { recursive: true });
  const logPath = path.join(buildDir, LOG_FILE_NAME);
  fs.writeFileSync(logPath, '');

  const sharedArgs = [
    '-project',
    podsProjectPath,
    '-configuration',
    'Release',
    '-sdk',
    'iphonesimulator',
    'build',
    'SYMROOT=build',
    'SWIFT_VERIFY_EMITTED_MODULE_INTERFACE=NO',
    'OTHER_SWIFT_FLAGS=$(inherited) -no-verify-emitted-module-interface',
  ];

  for (const target of podTargetLabels) {
    const args = ['-target', target, ...sharedArgs];
    try {
      const { stdout } = await spawnAsync('xcodebuild', args, {
        cwd: podsDir,
        stdio: options.verbose ? 'inherit' : 'pipe',
      });
      fs.appendFileSync(logPath, `\n=== xcodebuild ${args.join(' ')} ===\n${stdout}`);
    } catch (error) {
      const detail = (error as Error & { stderr?: string }).stderr ?? String(error);
      fs.appendFileSync(logPath, `\n=== xcodebuild ${args.join(' ')} (FAILED) ===\n${detail}`);
      throw new Error(
        `expo-brownfield: failed to build pod target '${target}' for symbol mangling. ` +
          `This usually means a Swift module couldn't compile against the current Pod xcconfigs. ` +
          `Inspect the full xcodebuild output at: ${logPath}`
      );
    }
  }

  return path.join(podsDir, BUILT_PRODUCTS_SUBDIR);
};

/**
 * After the simulator build, find the binaries to scan with `nm`. Skip the
 * umbrella `Pods_*` and `libPods-*` outputs since they're aggregator targets,
 * not the per-pod libraries we want to mangle.
 */
const findBinariesToMangle = (builtProductsDir: string): string[] => {
  const binaries: string[] = [];
  if (!fs.existsSync(builtProductsDir)) {
    return binaries;
  }

  const walk = (dir: string): void => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name.endsWith('.framework')) {
          if (!entry.name.startsWith('Pods_')) {
            const fwName = entry.name.slice(0, -'.framework'.length);
            binaries.push(path.join(full, fwName));
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

const runNm = async (binaries: string[], flags: string): Promise<string[]> => {
  if (binaries.length === 0) {
    return [];
  }
  const { stdout } = await spawnAsync('nm', [flags, ...binaries]);
  return stdout.split('\n').filter((line) => line.length > 0);
};

const extractClasses = (lines: string[]): string[] => {
  const filtered = lines.filter((line) => !isSwiftSymbol(line));
  const classSymbols = filtered
    .filter((line) => /OBJC_CLASS_\$_/.test(line))
    .map((line) => line.replace(/^.*\$_/, ''));
  return Array.from(new Set(classSymbols));
};

const extractConstants = (lines: string[]): string[] => {
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

  // Drop Itanium C++ mangled names (`_Z...`) and any symbol with whitespace:
  // a `#define` can't rewrite them (mangled names never appear as source
  // tokens; a name with spaces is invalid and collapses symbols onto one
  // macro).
  return Array.from(new Set([...sConsts, ...tConsts])).filter(
    (sym) => !sym.startsWith('_Z') && !/\s/.test(sym)
  );
};

/**
 * A `#define` for a bare word like `props` or `load` would also rewrite
 * unrelated C++ identifiers (`std::atomic::load`) in the force-included header,
 * breaking compilation. Requiring an uppercase letter or underscore keeps
 * camelCase/prefixed selectors (`reactTag`, `sd_extendedObject`) and drops the
 * generic single words.
 */
const isDistinctiveSelector = (selector: string): boolean => /[A-Z_]/.test(selector);

const capitalize = (value: string): string =>
  value ? value[0]!.toUpperCase() + value.slice(1) : value;

/**
 * Category selectors are emitted as ` t -[Class(Category) selector]` lines
 * by `nm`. We skip selectors on classes that are themselves being mangled
 * (their selectors get carried implicitly by the class rename) and otherwise
 * extract just the selector head.
 */
const extractCategorySelectors = (lines: string[], classes: string[]): string[] => {
  const classSet = new Set(classes);
  const selectorLineRe = / t [-|+]\[[^ ]*\([^ ]*\) [^ ]*\]/;
  const classNameRe = /[-|+]\[(.*?)\(/;

  const selectors: string[] = [];
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

const prefixSymbols = (prefix: string, symbols: string[]): string[] =>
  symbols.map((sym) => `${sym}=${prefix}${sym}`);

/**
 * Turn Objective-C category selectors into `#define`s. Beyond the naive
 * `name=prefixname` rename, a property `foo` also needs:
 *
 * - its setter mapped to `set` + capitalize(`<prefix>foo`) to match how the
 *   compiler derives `setFoo:` (not `set<prefix>foo`);
 * - its synthesized ivar renamed (`_foo=_<prefix>foo`) for code that touches it
 *   directly (`_reactSubviews`);
 * - to be dropped as a whole (getter + setter) when not distinctive, so it's
 *   either fully renamed or not at all.
 */
const prefixSelectors = (prefix: string, selectors: string[]): string[] => {
  const remaining = new Set(selectors);
  const defines: string[] = [];
  const ivarNames: string[] = [];

  const setters = selectors.filter((sel) => /^set[A-Z]/.test(sel));
  for (const setter of setters) {
    const upperGetter = setter.slice(3);
    if (!upperGetter) {
      continue;
    }
    const lowerGetter = upperGetter[0]!.toLowerCase() + upperGetter.slice(1);
    const getter = selectors.find((sel) => sel === upperGetter || sel === lowerGetter);
    if (!getter) {
      continue;
    }
    remaining.delete(setter);
    remaining.delete(getter);
    // Drop the whole property when its name isn't distinctive, so the getter
    // and setter never disagree about whether they were renamed.
    if (!isDistinctiveSelector(getter)) {
      continue;
    }
    const mangledGetter = `${prefix}${getter}`;
    defines.push(`${getter}=${mangledGetter}`);
    defines.push(`${setter}=set${capitalize(mangledGetter)}`);
    ivarNames.push(getter);
  }

  const plain = Array.from(remaining).filter(isDistinctiveSelector);
  defines.push(...prefixSymbols(prefix, plain));
  // A plain getter-shaped selector may also back an ivar; setters never do.
  ivarNames.push(...plain.filter((sel) => !/^set[A-Z]/.test(sel)));
  defines.push(...ivarNames.map((name) => `_${name}=_${prefix}${name}`));

  return defines;
};

interface ManglingDefines {
  /** Plain C/C++ symbols — renamed in every language for link safety. */
  constantDefines: string[];
  /** Objective-C classes, selectors, and backing ivars — guarded by __OBJC__. */
  objcDefines: string[];
}

const buildManglingDefines = async (
  prefix: string,
  binaries: string[]
): Promise<ManglingDefines> => {
  const allSymbolsGU = await runNm(binaries, '-gU');
  const allSymbolsU = await runNm(binaries, '-U');

  const classes = extractClasses(allSymbolsGU);
  const categorySelectors = extractCategorySelectors(allSymbolsU, classes);

  // Only selectors are mangled. Two other symbol kinds can't work via a
  // `#define` in a Swift + clang-modules graph, because `-include` doesn't
  // reach Swift source or a module's build context:
  //
  // - C/C++ symbols (Yoga's `YGConfigNew`): declared through a module, so the
  //   call site is renamed but the declaration isn't -> undeclared function.
  // - ObjC class link-symbols (`_OBJC_CLASS_$_RCTView`): defined textually but
  //   referenced from Swift / across modules -> undefined symbol at link.
  //
  // Selectors are message-send names, and every source that uses them gets the
  // same `-include`, so renaming them consistently is always safe. `classes` is
  // still extracted so extractCategorySelectors can skip categories on them.
  return {
    constantDefines: [],
    objcDefines: prefixSelectors(prefix, categorySelectors),
  };
};

/** Read the existing xcconfig (if any) and return its `MANGLED_SPECS_CHECKSUM` value. */
const readExistingChecksum = (xcconfigPath: string): string | null => {
  if (!fs.existsSync(xcconfigPath)) {
    return null;
  }
  const contents = fs.readFileSync(xcconfigPath, 'utf8');
  const match = new RegExp(`^${MANGLED_SPECS_CHECKSUM_KEY}\\s*=\\s*(\\S+)`, 'm').exec(contents);
  return match?.[1] ?? null;
};

/**
 * Render the renames as `#define OLD NEW` lines in a header (force-included via
 * `-include`) rather than `-D` flags on `GCC_PREPROCESSOR_DEFINITIONS`. Xcode
 * exports every build setting into each script phase's environment, so a
 * megabyte-scale defines list overflows `kern.argmax` (1 MB) and any mangled
 * target with a script phase fails with "Argument list too long". The header
 * keeps the command line to one short `-include` flag.
 *
 * ObjC renames are wrapped in `__OBJC__` so they never touch pure C/C++
 * translation units (`std::atomic::load`, folly/hermes internals).
 */
const buildManglingHeader = (constantDefines: string[], objcDefines: string[]): string => {
  const toLines = (defines: string[]): string =>
    defines
      .map((define) => {
        const separator = define.indexOf('=');
        return `#define ${define.slice(0, separator)} ${define.slice(separator + 1)}`;
      })
      .join('\n');

  return `// This file is automatically generated by expo-brownfield any time the
// pod dependency graph changes. Commit it alongside Podfile.lock.
#ifndef EXPO_BROWNFIELD_MANGLE_H
#define EXPO_BROWNFIELD_MANGLE_H

// C / C++ / Objective-C symbols — renamed in every language for link safety.
${toLines(constantDefines)}

// Objective-C classes, selectors, and backing ivars. Guarded so pure C/C++
// translation units are never rewritten.
#ifdef __OBJC__
${toLines(objcDefines)}
#endif

#endif
`;
};

const writeManglingXcconfig = (
  xcconfigPath: string,
  constantDefines: string[],
  objcDefines: string[],
  specsChecksum: string
): void => {
  // Write the header to the sandbox root (the `Pods` dir), whose path has no
  // spaces, so the `-include` flag needs no fragile shell quoting — unlike the
  // xcconfig's own "Target Support Files" directory.
  const headerPath = path.join(path.dirname(path.dirname(xcconfigPath)), MANGLING_HEADER_FILE_NAME);

  const contents = `// This config file is automatically generated by expo-brownfield any time the
// pod dependency graph changes. Commit it alongside Podfile.lock.
${MANGLING_HEADER_KEY} = ${headerPath}
// Used to skip rebuilding the mangling defines when the dependency graph hasn't changed.
${MANGLED_SPECS_CHECKSUM_KEY} = ${specsChecksum}
`;

  fs.mkdirSync(path.dirname(xcconfigPath), { recursive: true });
  fs.writeFileSync(xcconfigPath, contents);
  fs.writeFileSync(headerPath, buildManglingHeader(constantDefines, objcDefines));
};

/**
 * Patch a per-pod xcconfig so it (1) `#include`s our mangling xcconfig (which
 * defines `MANGLING_HEADER`) and (2) force-includes that header via
 * `OTHER_CFLAGS`. Only C-family flags are touched — matching the original
 * `GCC_PREPROCESSOR_DEFINITIONS` scope and deliberately leaving Swift's clang
 * importer alone. Idempotent: re-running on an already-patched file is a no-op.
 */
const patchPodXcconfig = (podXcconfigPath: string, manglingXcconfigPath: string): void => {
  if (!fs.existsSync(podXcconfigPath)) {
    return;
  }
  const includeLine = `#include "${manglingXcconfigPath}"`;
  let contents = fs.readFileSync(podXcconfigPath, 'utf8');

  if (!contents.includes(includeLine)) {
    contents = `${includeLine}\n${contents}`;
  }

  contents = appendToSetting(contents, 'OTHER_CFLAGS', `-include "$(${MANGLING_HEADER_KEY})"`);

  fs.writeFileSync(podXcconfigPath, contents);
};

/**
 * Append `tokens` to an existing `KEY = …` line, or add a fresh
 * `KEY = $(inherited) tokens` line when the setting isn't present. No-op if the
 * tokens are already there, so re-running `pod install` stays idempotent.
 */
const appendToSetting = (contents: string, key: string, tokens: string): string => {
  if (contents.includes(tokens)) {
    return contents;
  }
  const settingRe = new RegExp(`^(${key}\\s*=\\s*[^\n]*)$`, 'm');
  if (settingRe.test(contents)) {
    return contents.replace(settingRe, `$1 ${tokens}`);
  }
  return `${contents}\n${key} = $(inherited) ${tokens}\n`;
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
export const runMangle = async (
  context: MangleContext,
  options: { verbose: boolean }
): Promise<void> => {
  const builtProductsDir = await buildPodTargets(
    context.podsProjectPath,
    context.podTargetLabels,
    options
  );

  const binaries = findBinariesToMangle(builtProductsDir);
  const { constantDefines, objcDefines } = await buildManglingDefines(
    context.manglePrefix,
    binaries
  );

  writeManglingXcconfig(context.xcconfigPath, constantDefines, objcDefines, context.specsChecksum);

  for (const podXcconfig of context.podXcconfigPaths) {
    patchPodXcconfig(podXcconfig, context.xcconfigPath);
  }
};

export const isManglingUpToDate = (xcconfigPath: string, expectedChecksum: string): boolean =>
  readExistingChecksum(xcconfigPath) === expectedChecksum;

export const __testing = {
  isSwiftSymbol,
  extractClasses,
  extractConstants,
  extractCategorySelectors,
  prefixSelectors,
  isDistinctiveSelector,
  buildManglingHeader,
};
