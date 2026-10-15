import { spawnSync } from 'child_process';
import fs from 'fs-extra';
import path from 'path';

import type { XCFrameworkVerificationResult, XCFrameworkSlice } from './Verifier.types';

/**
 * Run a command synchronously and return stdout/stderr/exitCode.
 */
const execCommand = (
  command: string,
  args: string[]
): { stdout: string; stderr: string; exitCode: number } => {
  const result = spawnSync(command, args, {
    encoding: 'utf-8',
    maxBuffer: 10 * 1024 * 1024,
    timeout: 10000,
  });

  if (result.signal === 'SIGTERM') {
    return { stdout: '', stderr: 'Command timed out', exitCode: -1 };
  }

  return {
    stdout: result.stdout || '',
    stderr: result.stderr || '',
    exitCode: result.status ?? -1,
  };
};

/**
 * Finds the dSYM bundle for a given xcframework slice.
 *
 * dSYMs are embedded inside the xcframework via `xcodebuild -create-xcframework -debug-symbols`.
 * They live at: <Product>.xcframework/<sliceId>/dSYMs/<Product>.framework.dSYM
 *
 * @param xcframeworkPath Path to the .xcframework bundle
 * @param sliceId The xcframework slice identifier (e.g., "ios-arm64")
 * @param productName The product name (e.g., "ExpoModulesCore")
 * @returns Path to the .dSYM bundle, or null if not found
 */
export const findDsymForSlice = (
  xcframeworkPath: string,
  sliceId: string,
  productName: string
): string | null => {
  const dsymPath = path.join(xcframeworkPath, sliceId, 'dSYMs', `${productName}.framework.dSYM`);
  if (fs.existsSync(dsymPath)) {
    return dsymPath;
  }
  return null;
};

/**
 * Verifies that a dSYM bundle exists for a given xcframework slice.
 */
export const verifyDsymPresence = (
  xcframeworkPath: string,
  slice: XCFrameworkSlice
): XCFrameworkVerificationResult => {
  const dsymPath = findDsymForSlice(xcframeworkPath, slice.sliceId, slice.frameworkName);

  if (!dsymPath) {
    return {
      success: false,
      message: `No dSYM found for slice ${slice.sliceId} (looked in ${xcframeworkPath}/${slice.sliceId}/dSYMs/)`,
    };
  }

  // Verify the dSYM has the expected internal structure
  const dwarfDir = path.join(dsymPath, 'Contents', 'Resources', 'DWARF');
  if (!fs.existsSync(dwarfDir)) {
    return {
      success: false,
      message: `dSYM found but missing DWARF directory: ${dsymPath}`,
    };
  }

  return {
    success: true,
    message: `dSYM present: ${path.basename(path.dirname(dsymPath))}/${path.basename(dsymPath)}`,
  };
};

/**
 * Verifies that the dSYM UUIDs match the framework binary UUIDs.
 * This ensures the dSYM actually corresponds to the built binary and wasn't left
 * stale from a previous build.
 */
export const verifyDsymUuidMatch = (
  xcframeworkPath: string,
  slice: XCFrameworkSlice
): XCFrameworkVerificationResult => {
  const dsymPath = findDsymForSlice(xcframeworkPath, slice.sliceId, slice.frameworkName);
  if (!dsymPath) {
    return {
      success: false,
      message: 'Cannot verify UUID — dSYM not found',
    };
  }

  // Get UUIDs from the framework binary
  const binaryResult = execCommand('dwarfdump', ['--uuid', slice.binaryPath]);
  if (binaryResult.exitCode !== 0) {
    return {
      success: false,
      message: `Failed to get UUIDs from binary: ${binaryResult.stderr}`,
    };
  }

  // Get UUIDs from the dSYM
  const dsymResult = execCommand('dwarfdump', ['--uuid', dsymPath]);
  if (dsymResult.exitCode !== 0) {
    return {
      success: false,
      message: `Failed to get UUIDs from dSYM: ${dsymResult.stderr}`,
    };
  }

  // Extract UUID sets
  const binaryUuids = new Set(
    binaryResult.stdout
      .match(/UUID:\s+([0-9A-F-]{36})/gi)
      ?.map((m) => m.replace('UUID: ', '').toUpperCase()) ?? []
  );
  const dsymUuids = new Set(
    dsymResult.stdout
      .match(/UUID:\s+([0-9A-F-]{36})/gi)
      ?.map((m) => m.replace('UUID: ', '').toUpperCase()) ?? []
  );

  if (binaryUuids.size === 0) {
    return {
      success: false,
      message: 'No UUIDs found in framework binary',
    };
  }

  if (dsymUuids.size === 0) {
    return {
      success: false,
      message: 'No UUIDs found in dSYM',
    };
  }

  // Check that every binary UUID has a matching dSYM UUID
  const missingUuids = [...binaryUuids].filter((uuid) => !dsymUuids.has(uuid));
  if (missingUuids.length > 0) {
    return {
      success: false,
      message: `UUID mismatch — binary UUIDs not found in dSYM: ${missingUuids.join(', ')}`,
      details: `Binary UUIDs: ${[...binaryUuids].join(', ')}\ndSYM UUIDs: ${[...dsymUuids].join(', ')}`,
    };
  }

  return {
    success: true,
    message: `UUIDs match (${binaryUuids.size} architecture(s))`,
  };
};

/** Known system/SDK path prefixes that are expected and acceptable */
const systemPrefixes = [
  '/Applications/Xcode',
  '/Library/Developer',
  '/usr/',
  '/System/',
  '/AppleInternal/',
  '/var/db/xcode_select_link/',
];

/**
 * A source path is resolvable only if the consumer's dSYM source map can rewrite it, and that
 * map has exactly two entries: /expo-src/packages/<pkg> and /expo-src/node_modules/<pkg>.
 *
 * A relative name is not resolvable either: the debugger resolves it against DW_AT_comp_dir,
 * which is always SwiftPM's staging directory. Only dwarfdump's synthetic bracketed names, such
 * as `<swift-imported-modules>`, are tolerated — they are not source files. So are sources
 * generated during the build under /expo-src/generated/: no checkout holds them, so they are
 * expected to stay unresolvable, and the canonical prefix tells them apart from a staging path
 * that leaked.
 */
const isResolvableSourcePath = (sourcePath: string): boolean => {
  if (sourcePath.startsWith('<') && sourcePath.endsWith('>')) {
    return true;
  }
  if (systemPrefixes.some((prefix) => sourcePath.startsWith(prefix))) {
    return true;
  }
  if (sourcePath.startsWith('/expo-src/generated/')) {
    return true;
  }
  if (
    !sourcePath.startsWith('/expo-src/packages/') &&
    !sourcePath.startsWith('/expo-src/node_modules/')
  ) {
    return false;
  }
  // SwiftPM's build directory holds staged copies of the sources, never the sources themselves.
  return !sourcePath.includes('/.build/');
};

/**
 * Classifies the compile unit paths in `dwarfdump --debug-info --recurse-depth=0` output.
 *
 * Checks two attributes of every compile unit:
 * - DW_AT_comp_dir, which must be /expo-src/... (our canonical prefix) or a system/SDK path.
 * - DW_AT_name, the source file, which must additionally sit where the consumer's source map
 *   can find it — see isResolvableSourcePath.
 */
export const analyzeDwarfPrefixMapping = (stdout: string): XCFrameworkVerificationResult => {
  // Find all DW_AT_comp_dir entries (compilation directories)
  const compDirPattern = /DW_AT_comp_dir\s*\("([^"]+)"\)/g;
  const compDirs = new Set<string>();
  let match: RegExpExecArray | null;
  while ((match = compDirPattern.exec(stdout)) !== null) {
    compDirs.add(match[1]);
  }

  // Find all DW_AT_name entries — at recurse depth 0 these are the compile units' source files.
  // Checked before the comp_dir early return below: a dump without comp_dir entries must not
  // report success while carrying unresolvable source paths.
  const sourcePathPattern = /DW_AT_name\s*\("([^"]+)"\)/g;
  const sourcePaths = new Set<string>();
  while ((match = sourcePathPattern.exec(stdout)) !== null) {
    sourcePaths.add(match[1]);
  }

  const unresolvablePaths = [...sourcePaths].filter((p) => !isResolvableSourcePath(p));
  if (unresolvablePaths.length > 0) {
    return {
      success: false,
      message: `Found ${unresolvablePaths.length} unresolvable source path(s) in DWARF debug info`,
      details:
        `Debuggers resolve source only under /expo-src/packages/ and /expo-src/node_modules/, so these paths break source stepping and symbolication with no error at build time:\n` +
        unresolvablePaths.slice(0, 10).join('\n') +
        (unresolvablePaths.length > 10 ? `\n... and ${unresolvablePaths.length - 10} more` : '') +
        `\nEmit the per-target -debug-prefix-map flags first in the Swift flag list: swiftc honours the first matching map, clang the last.`,
    };
  }

  if (compDirs.size > 0 && sourcePaths.size === 0) {
    return {
      success: false,
      message: 'Found compile units with no source file name in DWARF debug info',
      details:
        'Every compile unit carries a DW_AT_name, so none being parsed means this check read the dump wrongly and would pass any mapping, broken or not. dwarfdump may be printing indexed string forms; re-check the DW_AT_name pattern against its current output.',
    };
  }

  if (compDirs.size === 0) {
    // No compilation directories found — might be a stripped binary or unusual format
    return {
      success: true,
      message: 'No DW_AT_comp_dir entries found (may be stripped)',
    };
  }

  // Categorize paths
  const canonicalPaths: string[] = [];
  const systemPaths: string[] = [];
  const absolutePaths: string[] = []; // Bad — these should have been remapped

  for (const dir of compDirs) {
    if (dir.startsWith('/expo-src/')) {
      canonicalPaths.push(dir);
    } else if (systemPrefixes.some((prefix) => dir.startsWith(prefix))) {
      systemPaths.push(dir);
    } else if (dir.startsWith('/')) {
      // Absolute path that isn't canonical or system — this is a problem
      absolutePaths.push(dir);
    }
    // Relative paths are fine
  }

  if (absolutePaths.length > 0) {
    return {
      success: false,
      message: `Found ${absolutePaths.length} unmapped absolute path(s) in DWARF debug info`,
      details:
        `These paths should have been remapped by the debug prefix map flags:\n` +
        absolutePaths.slice(0, 10).join('\n') +
        (absolutePaths.length > 10 ? `\n... and ${absolutePaths.length - 10} more` : ''),
    };
  }

  return {
    success: true,
    message: `Debug prefix mapping ok (${canonicalPaths.length} /expo-src/ path(s), ${systemPaths.length} system path(s), ${sourcePaths.size} source path(s))`,
  };
};

/**
 * Verifies that DWARF debug info uses the canonical /expo-src/ prefix instead of
 * absolute CI/build-machine paths. This ensures the -debug-prefix-map flags worked
 * correctly during compilation.
 */
export const verifyDsymDebugPrefixMapping = (
  xcframeworkPath: string,
  slice: XCFrameworkSlice
): XCFrameworkVerificationResult => {
  const dsymPath = findDsymForSlice(xcframeworkPath, slice.sliceId, slice.frameworkName);
  if (!dsymPath) {
    return {
      success: false,
      message: 'Cannot verify debug prefix mapping — dSYM not found',
    };
  }

  // Use --recurse-depth=0 to only dump compile unit headers (where DW_AT_comp_dir and the
  // compile unit's DW_AT_name live) instead of the entire DWARF tree, which can be hundreds
  // of MB for large frameworks.
  const result = spawnSync('dwarfdump', ['--debug-info', '--recurse-depth=0', dsymPath], {
    encoding: 'utf-8',
    maxBuffer: 50 * 1024 * 1024,
    timeout: 30000,
  });

  // A killed child — the timeout or a maxBuffer overflow — reports status null with stdout
  // empty or truncated, which would let a partial dump pass the checks below.
  if (result.error) {
    return {
      success: false,
      message: `Failed to read DWARF debug info: dwarfdump did not finish (${result.error.message})`,
    };
  }

  if (result.status !== 0 && result.status !== null) {
    return {
      success: false,
      message: `Failed to read DWARF debug info: ${result.stderr || 'unknown error'}`,
    };
  }

  return analyzeDwarfPrefixMapping(result.stdout || '');
};
