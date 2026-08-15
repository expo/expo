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

/**
 * Verifies that DWARF debug info uses the canonical /expo-src/ prefix instead of
 * absolute CI/build-machine paths. This ensures the -fdebug-prefix-map flag worked
 * correctly during compilation.
 *
 * Checks DW_AT_comp_dir (compilation directory) entries in the dSYM's DWARF data.
 * Valid paths should be either:
 * - /expo-src/... (our canonical prefix)
 * - System/SDK paths (Xcode toolchain, SDKs, etc.)
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

  // Extract compilation directories from DWARF debug info.
  // Use --recurse-depth=0 to only dump compile unit headers (where DW_AT_comp_dir lives)
  // instead of the entire DWARF tree, which can be hundreds of MB for large frameworks.
  const result = spawnSync('dwarfdump', ['--debug-info', '--recurse-depth=0', dsymPath], {
    encoding: 'utf-8',
    maxBuffer: 50 * 1024 * 1024,
    timeout: 30000,
  });

  if (result.status !== 0 && result.status !== null) {
    return {
      success: false,
      message: `Failed to read DWARF debug info: ${result.stderr || 'unknown error'}`,
    };
  }

  const stdout = result.stdout || '';

  // Find all DW_AT_comp_dir entries (compilation directories)
  const compDirPattern = /DW_AT_comp_dir\s*\("([^"]+)"\)/g;
  const compDirs = new Set<string>();
  let match;
  while ((match = compDirPattern.exec(stdout)) !== null) {
    compDirs.add(match[1]);
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

  // Known system/SDK path prefixes that are expected and acceptable
  const systemPrefixes = [
    '/Applications/Xcode',
    '/Library/Developer',
    '/usr/',
    '/System/',
    '/AppleInternal/',
    '/var/db/xcode_select_link/',
  ];

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
        `These paths should have been remapped by -fdebug-prefix-map:\n` +
        absolutePaths.slice(0, 10).join('\n') +
        (absolutePaths.length > 10 ? `\n... and ${absolutePaths.length - 10} more` : ''),
    };
  }

  return {
    success: true,
    message: `Debug prefix mapping ok (${canonicalPaths.length} /expo-src/ path(s), ${systemPaths.length} system path(s))`,
  };
};
