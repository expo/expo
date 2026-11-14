import fs from 'fs';
import path from 'path';

import type { ModuleIosConfig, SearchResults, SupportedPlatform } from '../../types';
import { isPathInside } from '../../utils';

/**
 * Scanner platform names by autolinking platform. The umbrella `apple` platform isn't listed, so it
 * links every scanned module.
 */
const SCANNER_PLATFORM_NAMES: Record<string, string> = {
  ios: 'iOS',
  macos: 'macOS',
  tvos: 'tvOS',
};

/** An `@ExpoModule`, `@SharedObject` or `@ExpoView` class that the scanner found. */
interface ScannedClass {
  /** The Swift class name. */
  name: string;
  /**
   * The `@ExpoModule("Foo")` or `@SharedObject("Foo")` name, or the class name. Unused: core reads
   * the runtime `_jsName`, which must stay below a module's own `Name(...)` in `ModuleHolder.name`.
   */
  jsName: string;
  /** The spelled access modifier, or `internal` when none is written. */
  accessLevel: 'open' | 'public' | 'package' | 'internal' | 'fileprivate' | 'private';
  /** Absolute path of the source file the module was found in. */
  file: string;
  /**
   * The Apple platforms the class compiles on. Empty when the condition can't be evaluated
   * statically (`#if DEBUG`, `canImport(...)`).
   */
  platforms: string[];
}

interface ScanWarning {
  message: string;
  file: string;
  line: number;
}

export interface ScanModulesOutput {
  schemaVersion: number;
  modules: ScannedClass[];
  sharedObjects?: ScannedClass[];
  views?: ScannedClass[];
  warnings: ScanWarning[];
  stats: { filesScanned: number; filesParsed: number; durationMs: number };
}

/** The part of the `expo-modules-macros` API used here. */
export interface ModulesScanner {
  scanModules(paths: string[], options?: { timeout?: number }): Promise<ScanModulesOutput>;
}

/**
 * Loads `expo-modules-macros`, a dependency of the installed `expo-modules-core` at the given
 * path. Returns null when it's missing.
 */
export function loadModulesScanner(resolutionBasePath: string): ModulesScanner | null {
  try {
    const scanner = require(
      require.resolve('expo-modules-macros', { paths: [resolutionBasePath] })
    );
    return typeof scanner?.scanModules === 'function' ? scanner : null;
  } catch {
    return null;
  }
}

/** Mirrors `prunedDirectoryNames` in the scanner's `SourceScan.swift`. */
const PRUNED_DIRECTORY_NAMES = new Set([
  '.build',
  'Pods',
  '.git',
  'node_modules',
  'Tests',
  'UITests',
  '__tests__',
  '__mocks__',
  'example',
  'examples',
  'e2e',
]);

/** An `@ExpoModule` attribute, possibly after other attributes, at the start of a line. */
const MODULE_ANNOTATION_PATTERN = /^[ \t]*(?:@\w+(?:\([^)\n]*\))?[ \t]+)*@ExpoModule\b/m;

/**
 * Whether any Swift source in the package has an `@ExpoModule` attribute. A plain text search, used
 * when the scan didn't complete.
 */
export function hasModuleAnnotations(packageRoot: string): boolean {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(packageRoot, { withFileTypes: true });
  } catch {
    return false;
  }
  for (const entry of entries) {
    const entryPath = path.join(packageRoot, entry.name);
    if (entry.isDirectory()) {
      if (!PRUNED_DIRECTORY_NAMES.has(entry.name) && hasModuleAnnotations(entryPath)) {
        return true;
      }
    } else if (entry.isFile() && entry.name.endsWith('.swift')) {
      try {
        if (MODULE_ANNOTATION_PATTERN.test(fs.readFileSync(entryPath, 'utf8'))) {
          return true;
        }
      } catch {}
    }
  }
  return false;
}

/**
 * The directory to scan for each package. Paths are realpath-resolved to match the scanner's
 * output, and a directory shared by two package names (an npm alias) is kept for the first one.
 */
export function collectPackageRoots(searchResults: SearchResults): Record<string, string> {
  const packageRoots: Record<string, string> = {};
  const seenRoots = new Set<string>();
  for (const [packageName, revision] of Object.entries(searchResults)) {
    let root: string;
    try {
      root = fs.realpathSync(revision.path);
    } catch {
      continue;
    }
    if (seenRoots.has(root)) {
      continue;
    }
    seenRoots.add(root);
    packageRoots[packageName] = root;
  }
  return packageRoots;
}

/**
 * Scans all package roots in one run and prints the scanner's warnings. Returns null, with a
 * warning, when the scan fails.
 */
export async function scanExpoModulesAsync(
  scanner: ModulesScanner,
  packageRoots: Record<string, string>
): Promise<ScanModulesOutput | null> {
  const roots = Object.values(packageRoots);
  if (!roots.length) {
    return null;
  }

  let output: ScanModulesOutput;
  try {
    output = await scanner.scanModules(roots, { timeout: 5000 });
  } catch (error: any) {
    console.warn(
      `warning: Scanning for Expo modules failed, only modules declared in expo-module.config.json will be linked: ${error.message ?? error}`
    );
    return null;
  }

  for (const warning of output.warnings) {
    console.warn(
      `${warning.file}:${warning.line}: warning: ${warning.message}. If a module class is declared inside this conditional compilation block, declare it in expo-module.config.json to link it.`
    );
  }
  return output;
}

/** The scanned classes of each kind, by package name. */
export interface ScannedPackageClasses {
  /** The `@ExpoModule` classes. */
  modules: Record<string, ModuleIosConfig[]>;
  /** The names of the `@SharedObject` classes. */
  sharedObjects: Record<string, string[]>;
  /** The names of the `@ExpoView` classes. */
  views: Record<string, string[]>;
}

/**
 * Groups the scanned modules, shared objects and views by package, as `groupScannedClasses` does.
 */
export function groupScannedPackageClasses(
  output: ScanModulesOutput,
  packageRoots: Record<string, string>,
  platform: SupportedPlatform
): ScannedPackageClasses {
  return {
    modules: groupScannedModules(output, packageRoots, platform),
    // An internal shared object or view can still be in `@ExpoModule(classes:)` or `@ExpoModule(views:)`,
    // so the internal ones don't warn.
    sharedObjects: groupScannedClasses(output.sharedObjects ?? [], null, packageRoots, platform),
    views: groupScannedClasses(output.views ?? [], null, packageRoots, platform),
  };
}

/**
 * Groups the scanned modules by package, as `groupScannedClasses` does.
 */
export function groupScannedModules(
  output: ScanModulesOutput,
  packageRoots: Record<string, string>,
  platform: SupportedPlatform
): Record<string, ModuleIosConfig[]> {
  const grouped = groupScannedClasses(output.modules, '@ExpoModule', packageRoots, platform);
  // A null name keeps the module's own name, as for config-declared string entries.
  return Object.fromEntries(
    Object.entries(grouped).map(([packageName, classNames]) => [
      packageName,
      classNames.map((className) => ({ name: null, class: className })),
    ])
  );
}

/**
 * Groups the scanned class names by the package with the longest root containing their source file.
 * Leaves out classes that aren't `public` or `open` or don't compile for the platform, and lists
 * each class once per package. Warns about an internal class when `macroName` (the macro of the
 * classes) is given.
 */
function groupScannedClasses(
  classes: ScannedClass[],
  macroName: string | null,
  packageRoots: Record<string, string>,
  platform: SupportedPlatform
): Record<string, string[]> {
  const targetPlatformName = SCANNER_PLATFORM_NAMES[platform];
  const rootEntries = Object.entries(packageRoots).sort(
    ([, rootA], [, rootB]) => rootB.length - rootA.length
  );
  const grouped: Record<string, string[]> = {};
  const seenClassesByPackage: Record<string, Set<string>> = {};
  const warnedClasses = new Set<string>();

  for (const scannedClass of classes) {
    // Skip a malformed entry instead of failing the whole scan.
    if (typeof scannedClass.file !== 'string' || typeof scannedClass.name !== 'string') {
      continue;
    }
    // An empty list is a condition the scanner couldn't evaluate (it already warned), so skip it
    // for the umbrella platform too.
    if (
      !scannedClass.platforms?.length ||
      (targetPlatformName && !scannedClass.platforms.includes(targetPlatformName))
    ) {
      continue;
    }
    if (scannedClass.accessLevel !== 'public' && scannedClass.accessLevel !== 'open') {
      // Only `internal` warns: it's the default, so likely a mistake. A lower level is an opt-out.
      if (
        macroName &&
        scannedClass.accessLevel === 'internal' &&
        !warnedClasses.has(scannedClass.file + scannedClass.name)
      ) {
        console.warn(
          `warning: The ${macroName} class '${scannedClass.name}' (${scannedClass.file}) is internal, so the generated modules provider cannot reference it. Declare it public to link it automatically, or use a lower access level such as private to opt it out of linking.`
        );
        warnedClasses.add(scannedClass.file + scannedClass.name);
      }
      continue;
    }
    const owner = rootEntries.find(([, root]) => isPathInside(scannedClass.file, root));
    if (!owner) {
      continue;
    }
    const packageName = owner[0];
    seenClassesByPackage[packageName] ??= new Set<string>();
    const seenClasses = seenClassesByPackage[packageName];
    if (seenClasses.has(scannedClass.name)) {
      continue;
    }
    seenClasses.add(scannedClass.name);
    (grouped[packageName] ??= []).push(scannedClass.name);
  }
  return grouped;
}
