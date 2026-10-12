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

interface ScannedModule {
  /** The Swift class name the module is declared as. */
  name: string;
  /**
   * The `@ExpoModule("Foo")` name, or the class name. Unused: it equals the runtime `_jsName`,
   * which must stay below the module's own `Name(...)` in `ModuleHolder.name`.
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
  modules: ScannedModule[];
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

/**
 * Groups the scanned modules by the package with the longest root containing their source file.
 * Leaves out classes that aren't `public` or `open` or don't compile for the platform, and lists
 * each class once per package.
 */
export function groupScannedModules(
  output: ScanModulesOutput,
  packageRoots: Record<string, string>,
  platform: SupportedPlatform
): Record<string, ModuleIosConfig[]> {
  const targetPlatformName = SCANNER_PLATFORM_NAMES[platform];
  const rootEntries = Object.entries(packageRoots).sort(
    ([, rootA], [, rootB]) => rootB.length - rootA.length
  );
  const grouped: Record<string, ModuleIosConfig[]> = {};
  const seenClassesByPackage: Record<string, Set<string>> = {};
  const warnedClasses = new Set<string>();

  for (const module of output.modules) {
    // Skip a malformed entry instead of failing the whole scan.
    if (typeof module.file !== 'string' || typeof module.name !== 'string') {
      continue;
    }
    // An empty list is a condition the scanner couldn't evaluate (it already warned), so skip it
    // for the umbrella platform too.
    if (
      !module.platforms?.length ||
      (targetPlatformName && !module.platforms.includes(targetPlatformName))
    ) {
      continue;
    }
    if (module.accessLevel !== 'public' && module.accessLevel !== 'open') {
      // Only `internal` warns: it's the default, so likely a mistake. A lower level is an opt-out.
      if (module.accessLevel === 'internal' && !warnedClasses.has(module.file + module.name)) {
        console.warn(
          `warning: The @ExpoModule class '${module.name}' (${module.file}) is internal, so the generated modules provider cannot reference it. Declare it public to link it automatically, or use a lower access level such as private to opt it out of linking.`
        );
        warnedClasses.add(module.file + module.name);
      }
      continue;
    }
    const owner = rootEntries.find(([, root]) => isPathInside(module.file, root));
    if (!owner) {
      continue;
    }
    const packageName = owner[0];
    seenClassesByPackage[packageName] ??= new Set<string>();
    const seenClasses = seenClassesByPackage[packageName];
    if (seenClasses.has(module.name)) {
      continue;
    }
    seenClasses.add(module.name);
    // A null name keeps the module's own name, as for config-declared string entries.
    (grouped[packageName] ??= []).push({ name: null, class: module.name });
  }
  return grouped;
}
