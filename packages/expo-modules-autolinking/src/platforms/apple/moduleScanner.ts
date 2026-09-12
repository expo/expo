import spawnAsync from '@expo/spawn-async';
import fs from 'fs';
import path from 'path';

import type { ModuleIosConfig, SearchResults } from '../../types';
import { isPathInside } from '../../utils';

/**
 * The oldest scan output schema this consumer understands. When the scanner reports an older
 * version, its output is not trusted and autolinking falls back to config-declared modules.
 * Newer versions are accepted: `expo-modules-core` pins the plugin version exactly, so a scanner
 * ahead of autolinking doesn't occur in a consistent install, and schema bumps are consumed here
 * by branching on the reported version.
 */
const MINIMUM_SUPPORTED_SCHEMA_VERSION = 1;

/**
 * The prebuilt binary inside `@expo/expo-modules-macros-plugin` that runs the scanner CLI.
 * The same executable serves as the Swift compiler's macro plugin; with arguments it dispatches
 * to the scanner instead of the plugin server.
 */
const SCANNER_BINARY_RELATIVE_PATH = 'apple/ExpoModulesMacros-tool';

export interface ScannerPluginInfo {
  binaryPath: string;
  version: string;
}

interface ScannedModule {
  /** The Swift class name the module is declared as. */
  name: string;
  /** The resolved JS module name: the `@ExpoModule("Foo")` override, or the class name. */
  jsName: string;
  /** The spelled access modifier, or `internal` when none is written. */
  accessLevel: string;
  /** Absolute path of the source file the module was found in. */
  file: string;
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

/**
 * Resolves the macros plugin package (from the given resolution base, usually the installed
 * `expo-modules-core` directory, which depends on it) and returns the scanner binary path and the
 * plugin version. Returns null when the package is not installed, or is too old to ship a binary
 * that understands scanner subcommands.
 */
export function resolveScannerPlugin(resolutionBasePath: string): ScannerPluginInfo | null {
  let packageJsonPath: string;
  try {
    packageJsonPath = require.resolve('@expo/expo-modules-macros-plugin/package.json', {
      paths: [resolutionBasePath],
    });
  } catch {
    return null;
  }
  const binaryPath = path.join(path.dirname(packageJsonPath), SCANNER_BINARY_RELATIVE_PATH);
  if (!fs.existsSync(binaryPath)) {
    return null;
  }
  let version: unknown;
  try {
    version = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')).version;
  } catch {
    return null;
  }
  // Versions below 0.9.0 ship the binary without the scanner CLI.
  if (typeof version !== 'string' || !satisfiesMinimumVersion(version, [0, 9, 0])) {
    return null;
  }
  return { binaryPath, version };
}

export function satisfiesMinimumVersion(version: string, minimum: number[]): boolean {
  const components = version.split('-')[0]!.split('.').map(Number);
  for (let i = 0; i < minimum.length; i++) {
    const component = components[i] ?? 0;
    const minimumComponent = minimum[i]!;
    if (Number.isNaN(component)) {
      return false;
    }
    if (component !== minimumComponent) {
      return component > minimumComponent;
    }
  }
  return true;
}

/**
 * The directories to scan, one per package. Each path is realpath-resolved: the scanner reports
 * fully resolved absolute file paths, so the roots used for the path-prefix grouping must be
 * resolved the same way, or a symlinked package (pnpm stores, local development links) would match
 * nothing. Two package names sharing one directory (an npm alias) are deduplicated to the first,
 * so a module can't be attributed to one of them nondeterministically. A package whose path can't
 * be resolved is skipped; it still resolves through its config as usual.
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
 * Runs the scanner once over all package roots and returns the parsed output. The scan runs without
 * a platform, so it reports the unconditional `@ExpoModule` classes; a module inside a conditional
 * compilation block it cannot resolve is skipped and lands in `warnings`, which are printed with
 * their source locations. Returns null, after printing a warning, when the scanner fails or reports
 * an unsupported schema version, so the caller falls back to config-declared modules.
 */
export async function scanExpoModulesAsync(
  pluginInfo: ScannerPluginInfo,
  packageRoots: Record<string, string>
): Promise<ScanModulesOutput | null> {
  const roots = Object.values(packageRoots);
  if (!roots.length) {
    return null;
  }

  let output: ScanModulesOutput;
  let runStderr = '';
  try {
    const result = await spawnAsync(pluginInfo.binaryPath, ['scan-modules', ...roots], {
      // stdin must be closed: given scanner arguments, a pre-CLI binary (or a prerelease that
      // passes the version gate) starts the compiler plugin server and reads stdin forever, which
      // would hang pod install. With no stdin it exits right away and the empty output lands in
      // the JSON parsing failure below. The timeout is a second line of defense.
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 30000,
    });
    runStderr = result.stderr ?? '';
    output = JSON.parse(result.stdout);
    if (!Array.isArray(output?.modules) || !Array.isArray(output?.warnings)) {
      throw new Error('the report is missing the modules or warnings list');
    }
  } catch (error: any) {
    // A crashing scanner reports the cause on stderr; carry it into the warning so the failure is
    // diagnosable straight from the pod install log.
    const stderr =
      typeof error.stderr === 'string' && error.stderr.trim() ? `\n${error.stderr.trim()}` : '';
    console.warn(
      `⚠️  Scanning for Expo modules failed, only modules declared in expo-module.config.json will be linked: ${error.message ?? error}${stderr}`
    );
    return null;
  }

  if (!(output.schemaVersion >= MINIMUM_SUPPORTED_SCHEMA_VERSION)) {
    console.warn(
      `⚠️  The Expo modules scanner reported schema version ${output.schemaVersion}, but this version of expo-modules-autolinking requires at least ${MINIMUM_SUPPORTED_SCHEMA_VERSION}. Update @expo/expo-modules-macros-plugin; only modules declared in expo-module.config.json will be linked.`
    );
    return null;
  }

  // A successful run can still report diagnostics on stderr (e.g. an unreadable source file that
  // may hide a module); don't let them disappear.
  if (runStderr.trim()) {
    console.warn(`⚠️  The Expo modules scanner reported:\n${runStderr.trim()}`);
  }
  for (const warning of output.warnings) {
    console.warn(
      `⚠️  ${warning.file}:${warning.line}: ${warning.message}. If a module class is declared inside this conditional compilation block, declare it in expo-module.config.json to link it.`
    );
  }
  return output;
}

/**
 * Groups the scanned modules by the package owning their source file (the package with the longest
 * root path containing it) and maps them to the module config shape used by the modules provider.
 * Classes that aren't `public` or `open` can't be referenced by the generated provider, so they're
 * excluded: with a warning for the (likely unintentional) default `internal`, silently for an
 * explicitly spelled lower access level, which reads as a deliberate opt-out (e.g. a test fixture).
 */
export function groupScannedModules(
  output: ScanModulesOutput,
  packageRoots: Record<string, string>
): Record<string, ModuleIosConfig[]> {
  const rootEntries = Object.entries(packageRoots).sort(
    ([, rootA], [, rootB]) => rootB.length - rootA.length
  );
  const grouped: Record<string, ModuleIosConfig[]> = {};

  for (const module of output.modules) {
    if (module.accessLevel !== 'public' && module.accessLevel !== 'open') {
      // `internal` is the default and usually unintentional; an explicitly spelled lower access
      // level reads as a deliberate opt-out (e.g. a test fixture) and stays quiet. The scanner
      // can't distinguish written `internal` from no modifier, so the warning covers both.
      if (module.accessLevel === 'internal') {
        console.warn(
          `⚠️  The @ExpoModule class '${module.name}' (${module.file}) is internal, so the generated modules provider cannot reference it. Declare it public to link it automatically, or use a lower access level such as private to opt it out of linking.`
        );
      }
      continue;
    }
    const owner = rootEntries.find(([, root]) => isPathInside(module.file, root));
    if (!owner) {
      continue;
    }
    // The registration name stays null so the module's own `Name(...)` DSL entry and the macro's
    // `_jsName` keep precedence (see `ModuleHolder.name`), exactly as for config-declared string
    // entries. The scanner's `jsName` is `_jsName`, which must stay the last resort.
    (grouped[owner[0]] ??= []).push({ name: null, class: module.name });
  }
  return grouped;
}
