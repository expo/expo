import chalk from 'chalk';
import { spawn, execSync, spawnSync } from 'child_process';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';

import logger from '../Logger';
import { Package } from '../Packages';
import { Frameworks } from './Frameworks';
import { BuildFlavor } from './Prebuilder.types';
import { SPMProduct } from './SPMConfig.types';
import type {
  VerificationResult,
  XCFrameworkSlice,
  XCFrameworkVerificationReport,
  SliceVerificationReport,
  VerifyOptions,
} from './SPMVerify.types';
import { AsyncSpinner, createAsyncSpinner } from './Utils';

export const SPMVerify = {
  /**
   * Verifies a product xcframework and returns verification reports for the product.
   *
   * @param pkg Package to verify xcframeworks for
   * @param product Product to verify xcframeworks for
   * @param buildFlavor Build flavor (Debug or Release)
   * @param options Verification options
   * @returns Map of product name to verification report
   */
  verifyXCFrameworkAsync: async (
    pkg: Package,
    product: SPMProduct,
    buildFlavor: BuildFlavor,
    options?: VerifyOptions
  ): Promise<Map<string, XCFrameworkVerificationReport>> => {
    logger.info(
      `🔍 Verifying xcframework for ${chalk.green(pkg.packageName)}/${chalk.green(product.name)} [${buildFlavor.toLowerCase()}]`
    );

    // Check required tools once
    const toolsCheck = checkRequiredTools();
    if (!toolsCheck.success) {
      throw new Error(toolsCheck.message);
    }

    const results = new Map<string, XCFrameworkVerificationReport>();

    try {
      const report = await verifyAsync(pkg, product, buildFlavor, options);
      results.set(product.name, report);

      if (!report.overallSuccess) {
        const failures: string[] = [];

        if (!report.infoPlistValid.success) {
          failures.push('Info.plist invalid');
        }

        for (const slice of report.slices) {
          if (!slice.modulesPresent.success) {
            failures.push(`Modules missing (${slice.sliceId})`);
          }
          if (!slice.modularHeadersValid.success) {
            failures.push(`Non-modular headers (${slice.sliceId})`);
          }
          if (!slice.clangModuleImport.success) {
            failures.push(`Clang @import failed (${slice.sliceId})`);
          }
          if (!slice.swiftInterfaceTypecheck.success) {
            failures.push(`Swift typecheck failed (${slice.sliceId})`);
          }
        }

        logger.error(
          `  ${chalk.red('✗')} Verification failed for ${chalk.green(product.name)}.xcframework: ${failures.join(', ')}`
        );

        // Always show detailed errors for failures
        for (const slice of report.slices) {
          if (!slice.modularHeadersValid.success && slice.modularHeadersValid.details) {
            logger.log(chalk.gray(`      Modular header error (${slice.sliceId}):`));
            logger.log(
              chalk.gray(
                slice.modularHeadersValid.details
                  .split('\n')
                  .slice(0, 10)
                  .map((l) => `        ${l}`)
                  .join('\n')
              )
            );
          }
          if (!slice.clangModuleImport.success && slice.clangModuleImport.details) {
            logger.log(chalk.gray(`      Clang error (${slice.sliceId}):`));
            logger.log(
              chalk.gray(
                slice.clangModuleImport.details
                  .split('\n')
                  .slice(0, 10)
                  .map((l) => `        ${l}`)
                  .join('\n')
              )
            );
          }
          if (!slice.swiftInterfaceTypecheck.success && slice.swiftInterfaceTypecheck.details) {
            logger.log(chalk.gray(`      Swift typecheck error (${slice.sliceId}):`));
            logger.log(
              chalk.gray(
                slice.swiftInterfaceTypecheck.details
                  .split('\n')
                  .slice(0, 10)
                  .map((l) => `        ${l}`)
                  .join('\n')
              )
            );
          }
        }
      }
    } catch (error) {
      logger.error(
        `  ${chalk.red('✗')} Verification failed for ${chalk.green(product.name)}.xcframework: ${error instanceof Error ? error.message : String(error)}`
      );
      // Still add a failed report so caller knows about the failure
      results.set(product.name, {
        xcframeworkPath: Frameworks.getFrameworkPath(pkg.path, product.name, buildFlavor),
        infoPlistValid: { success: false, message: String(error) },
        codesignValid: { success: true, message: 'Skipped' },
        junkFiles: [],
        slices: [],
        overallSuccess: false,
      });
    }

    return results;
  },
};

/**
 * Maps slice identifier to SDK name
 */
const getSdkForIdentifier = (id: string): string => {
  if (id.includes('simulator') || id.endsWith('-simulator')) {
    if (id.startsWith('ios')) return 'iphonesimulator';
    if (id.startsWith('tvos')) return 'appletvsimulator';
    if (id.startsWith('watchos')) return 'watchsimulator';
    if (id.startsWith('visionos')) return 'xrsimulator';
  }
  if (id.startsWith('ios')) return 'iphoneos';
  if (id.startsWith('tvos')) return 'appletvos';
  if (id.startsWith('watchos')) return 'watchos';
  if (id.startsWith('macos')) return 'macosx';
  if (id.startsWith('visionos')) return 'xros';
  return '';
};

/**
 * Executes a command asynchronously and returns the output.
 * Uses spawn for non-blocking execution with timeout support.
 */
const execCommandAsync = (
  command: string,
  args: string[],
  timeoutMs: number = 30000
): Promise<{ stdout: string; stderr: string; exitCode: number }> => {
  return new Promise((resolve) => {
    const proc = spawn(command, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    let timedOut = false;

    const timeout = setTimeout(() => {
      timedOut = true;
      proc.kill('SIGTERM');
    }, timeoutMs);

    proc.stdout.on('data', (data: Buffer) => {
      stdout += data.toString();
    });

    proc.stderr.on('data', (data: Buffer) => {
      stderr += data.toString();
    });

    proc.on('close', (code: number | null) => {
      clearTimeout(timeout);

      if (timedOut) {
        resolve({
          stdout,
          stderr: `Command timed out after ${timeoutMs / 1000} seconds\n${stderr}`,
          exitCode: -1,
        });
      } else {
        resolve({
          stdout,
          stderr,
          exitCode: code ?? -1,
        });
      }
    });

    proc.on('error', (err) => {
      clearTimeout(timeout);
      resolve({
        stdout,
        stderr: err.message,
        exitCode: -1,
      });
    });
  });
};

/**
 * Executes a command synchronously and returns the output (for quick commands)
 */
const execCommand = (
  command: string,
  args: string[]
): { stdout: string; stderr: string; exitCode: number } => {
  const result = spawnSync(command, args, {
    encoding: 'utf-8',
    maxBuffer: 10 * 1024 * 1024,
    timeout: 10000, // 10 second timeout for quick commands
  });

  if (result.signal === 'SIGTERM') {
    return {
      stdout: '',
      stderr: 'Command timed out',
      exitCode: -1,
    };
  }

  return {
    stdout: result.stdout || '',
    stderr: result.stderr || '',
    exitCode: result.status ?? -1,
  };
};

/**
 * Checks if a command exists
 */
const commandExists = (command: string): boolean => {
  try {
    execSync(`command -v ${command}`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
};

/**
 * Gets the path to swift-frontend
 */
const getSwiftFrontendPath = (): string | null => {
  try {
    const result = execSync('xcrun --find swift-frontend', { encoding: 'utf-8' });
    return result.trim();
  } catch {
    return null;
  }
};

/**
 * Gets the SDK path for a given SDK name
 */
const getSdkPath = (sdkName: string): string | null => {
  try {
    const result = execSync(`xcrun --sdk ${sdkName} --show-sdk-path`, { encoding: 'utf-8' });
    return result.trim();
  } catch {
    return null;
  }
};

/**
 * Verifies required tools are available
 */
const checkRequiredTools = (): VerificationResult => {
  const requiredTools = ['plutil', 'codesign', 'lipo', 'file', 'otool', 'xcrun', 'clang'];
  const missingTools: string[] = [];

  for (const tool of requiredTools) {
    if (!commandExists(tool)) {
      missingTools.push(tool);
    }
  }

  const swiftFrontend = getSwiftFrontendPath();
  if (!swiftFrontend) {
    missingTools.push('swift-frontend');
  }

  if (missingTools.length > 0) {
    return {
      success: false,
      message: `Missing required tools: ${missingTools.join(', ')}`,
    };
  }

  return {
    success: true,
    message: 'All required tools are available',
  };
};

/**
 * Verifies Info.plist is valid
 */
const verifyInfoPlist = (xcframeworkPath: string): VerificationResult => {
  const infoPlistPath = path.join(xcframeworkPath, 'Info.plist');

  if (!fs.existsSync(infoPlistPath)) {
    return {
      success: false,
      message: 'Info.plist not found',
    };
  }

  const result = execCommand('plutil', ['-p', infoPlistPath]);

  if (result.exitCode !== 0) {
    return {
      success: false,
      message: 'Info.plist is invalid',
      details: result.stderr,
    };
  }

  return {
    success: true,
    message: 'Info.plist is valid',
  };
};

/**
 * Verifies codesign of xcframework
 */
const verifyCodesign = (xcframeworkPath: string): VerificationResult => {
  const result = execCommand('codesign', [
    '--verify',
    '--deep',
    '--strict',
    '--verbose=2',
    xcframeworkPath,
  ]);

  if (result.exitCode !== 0) {
    return {
      success: false,
      message: 'Codesign verification failed (common for debug/local builds)',
      details: result.stderr,
    };
  }

  return {
    success: true,
    message: 'Codesign verification passed',
  };
};

/**
 * Scans for junk files in xcframework
 */
const scanForJunkFiles = (xcframeworkPath: string): string[] => {
  const junkPatterns = ['*.m', '*.mm', '*.cpp', '*.cc', '*.hmap', '*.pch', '*.xcconfig'];

  const junkFiles: string[] = [];

  const scanDir = (dir: string) => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        scanDir(fullPath);
      } else if (entry.isFile()) {
        for (const pattern of junkPatterns) {
          const ext = pattern.replace('*', '');
          if (entry.name.endsWith(ext)) {
            junkFiles.push(path.relative(xcframeworkPath, fullPath));
            break;
          }
        }
      }
    }
  };

  scanDir(xcframeworkPath);
  return junkFiles;
};

/**
 * Finds all framework slices in xcframework
 */
const findFrameworkSlices = (xcframeworkPath: string): XCFrameworkSlice[] => {
  const slices: XCFrameworkSlice[] = [];

  const entries = fs.readdirSync(xcframeworkPath, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name === 'Info.plist') {
      continue;
    }

    const sliceDir = path.join(xcframeworkPath, entry.name);
    const sliceEntries = fs.readdirSync(sliceDir, { withFileTypes: true });

    for (const sliceEntry of sliceEntries) {
      if (sliceEntry.isDirectory() && sliceEntry.name.endsWith('.framework')) {
        const frameworkName = sliceEntry.name.replace('.framework', '');
        const frameworkPath = path.join(sliceDir, sliceEntry.name);
        const binaryPath = path.join(frameworkPath, frameworkName);

        slices.push({
          sliceId: entry.name,
          frameworkName,
          frameworkPath,
          binaryPath,
          sdkName: getSdkForIdentifier(entry.name),
        });
      }
    }
  }

  return slices;
};

/**
 * Gets Mach-O information for a binary
 */
const getMachoInfo = (binaryPath: string): VerificationResult => {
  if (!fs.existsSync(binaryPath)) {
    return {
      success: false,
      message: `Binary not found: ${binaryPath}`,
    };
  }

  const lipoResult = execCommand('lipo', ['-info', binaryPath]);
  const fileResult = execCommand('file', [binaryPath]);
  const otoolResult = execCommand('otool', ['-hv', binaryPath]);

  const details = [
    `lipo -info: ${lipoResult.stdout.trim()}`,
    `file: ${fileResult.stdout.trim()}`,
    `otool -hv:\n${otoolResult.stdout.split('\n').slice(0, 25).join('\n')}`,
  ].join('\n\n');

  return {
    success: true,
    message: 'Mach-O information retrieved',
    details,
  };
};

/**
 * Gets linked dependencies for a binary
 */
const getLinkedDependencies = (binaryPath: string): string[] => {
  const result = execCommand('otool', ['-L', binaryPath]);

  if (result.exitCode !== 0) {
    return [];
  }

  return result.stdout
    .split('\n')
    .slice(1) // Skip first line (binary path)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
};

/**
 * Verifies Headers directory presence
 */
const verifyHeaders = (frameworkPath: string): VerificationResult => {
  const headersPath = path.join(frameworkPath, 'Headers');

  if (fs.existsSync(headersPath) && fs.statSync(headersPath).isDirectory()) {
    return {
      success: true,
      message: 'Headers/ present',
    };
  }

  return {
    success: false,
    message: 'Headers/ missing (might be ok for Swift-only, but usually suspicious for mixed/ObjC)',
  };
};

/**
 * Verifies Modules directory presence
 */
const verifyModules = (frameworkPath: string): VerificationResult => {
  const modulesPath = path.join(frameworkPath, 'Modules');

  if (fs.existsSync(modulesPath) && fs.statSync(modulesPath).isDirectory()) {
    return {
      success: true,
      message: 'Modules/ present',
    };
  }

  return {
    success: false,
    message: 'Modules/ missing (usually bad for Swift dynamic frameworks)',
  };
};

/**
 * Verifies module.modulemap presence
 */
const verifyModuleMap = (frameworkPath: string): VerificationResult => {
  const moduleMapPath = path.join(frameworkPath, 'Modules', 'module.modulemap');

  if (fs.existsSync(moduleMapPath)) {
    return {
      success: true,
      message: 'module.modulemap present',
    };
  }

  return {
    success: false,
    message:
      'module.modulemap missing (may still work via Swift module, but ObjC @import may fail)',
  };
};

/**
 * Verifies all public headers are modular (no non-modular includes)
 */
const verifyModularHeaders = async (
  slice: XCFrameworkSlice,
  xcframeworkPath: string,
  dependencyXcframeworkPaths: string[] = []
): Promise<VerificationResult> => {
  if (!slice.sdkName) {
    return {
      success: false,
      message: `Unknown slice identifier -> skipping modular header check: ${slice.sliceId}`,
    };
  }

  const sdkPath = getSdkPath(slice.sdkName);
  if (!sdkPath) {
    return {
      success: false,
      message: `Could not find SDK path for: ${slice.sdkName}`,
    };
  }

  const headersPath = path.join(slice.frameworkPath, 'Headers');
  if (!fs.existsSync(headersPath)) {
    // No headers directory - likely Swift-only framework
    return {
      success: true,
      message: 'No Headers directory (Swift-only framework)',
    };
  }

  // Find all .h files in Headers/
  const headerFiles: string[] = [];
  const entries = fs.readdirSync(headersPath, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isFile() && entry.name.endsWith('.h')) {
      headerFiles.push(path.join(headersPath, entry.name));
    }
  }

  if (headerFiles.length === 0) {
    return {
      success: true,
      message: 'No header files to check',
    };
  }

  const sliceDir = path.dirname(slice.frameworkPath);

  // Build framework search paths
  const frameworkSearchPaths: string[] = ['-F', sliceDir];

  // Add sibling xcframeworks
  const xcframeworksDir = path.dirname(xcframeworkPath);
  const siblingXcframeworks = fs.readdirSync(xcframeworksDir, { withFileTypes: true });
  for (const entry of siblingXcframeworks) {
    if (
      entry.isDirectory() &&
      entry.name.endsWith('.xcframework') &&
      entry.name !== path.basename(xcframeworkPath)
    ) {
      const siblingSlicePath = path.join(xcframeworksDir, entry.name, slice.sliceId);
      if (fs.existsSync(siblingSlicePath)) {
        frameworkSearchPaths.push('-F', siblingSlicePath);
      }
    }
  }

  // Add dependency xcframework paths
  for (const depXcframeworkPath of dependencyXcframeworkPaths) {
    const depSlicePath = path.join(depXcframeworkPath, slice.sliceId);
    if (fs.existsSync(depSlicePath)) {
      frameworkSearchPaths.push('-F', depSlicePath);
    }
  }

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'verify-modular-'));
  const errors: string[] = [];

  try {
    // Check each header file
    for (const headerFile of headerFiles) {
      const headerName = path.basename(headerFile);

      const result = await execCommandAsync('clang', [
        '-fmodules',
        '-Werror=non-modular-include-in-framework-module',
        '-fsyntax-only',
        '-isysroot',
        sdkPath,
        ...frameworkSearchPaths,
        '-x',
        'objective-c',
        headerFile,
      ]);

      if (result.exitCode !== 0) {
        // Check if error is about non-modular includes, excluding SDK false positives
        const hasNonModularError =
          (result.stderr.includes('non-modular header') ||
            result.stderr.includes('Include of non-modular header')) &&
          !result.stderr.includes('module Foundation does not directly depend') &&
          !result.stderr.includes('module CoreFoundation does not directly depend');

        if (hasNonModularError) {
          errors.push(
            `${headerName}: ${result.stderr
              .split('\n')
              .filter((l) => l.includes('non-modular') || l.includes('error:'))
              .join(' | ')}`
          );
        }
      }
    }

    if (errors.length > 0) {
      return {
        success: false,
        message: `Found ${errors.length} header(s) with non-modular includes`,
        details:
          errors.slice(0, 5).join('\n') +
          (errors.length > 5 ? `\n... and ${errors.length - 5} more` : ''),
      };
    }

    return {
      success: true,
      message: `All ${headerFiles.length} header(s) are modular`,
    };
  } finally {
    fs.removeSync(tmpDir);
  }
};

/**
 * Verifies clang module import works
 */
const verifyClangModuleImport = async (
  slice: XCFrameworkSlice,
  xcframeworkPath: string,
  dependencyXcframeworkPaths: string[] = []
): Promise<VerificationResult> => {
  if (!slice.sdkName) {
    return {
      success: false,
      message: `Unknown slice identifier -> skipping clang check: ${slice.sliceId}`,
    };
  }

  const sdkPath = getSdkPath(slice.sdkName);
  if (!sdkPath) {
    return {
      success: false,
      message: `Could not find SDK path for: ${slice.sdkName}`,
    };
  }

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'verify-'));
  const testFile = path.join(tmpDir, `verify_${slice.frameworkName}_${slice.sliceId}.m`);
  const outputFile = path.join(tmpDir, `verify_${slice.frameworkName}_${slice.sliceId}.o`);

  try {
    const testCode = `@import Foundation;\n@import ${slice.frameworkName};\nint main() { return 0; }\n`;
    fs.writeFileSync(testFile, testCode);

    const sliceDir = path.dirname(slice.frameworkPath);

    // Build framework search paths - include sibling xcframeworks for dependencies
    const frameworkSearchPaths: string[] = ['-F', sliceDir];

    // Also add the parent xcframeworks directory to find sibling frameworks
    const xcframeworksDir = path.dirname(xcframeworkPath);
    const siblingXcframeworks = fs.readdirSync(xcframeworksDir, { withFileTypes: true });
    for (const entry of siblingXcframeworks) {
      if (
        entry.isDirectory() &&
        entry.name.endsWith('.xcframework') &&
        entry.name !== path.basename(xcframeworkPath)
      ) {
        // Find the matching slice in the sibling xcframework
        const siblingSlicePath = path.join(xcframeworksDir, entry.name, slice.sliceId);
        if (fs.existsSync(siblingSlicePath)) {
          frameworkSearchPaths.push('-F', siblingSlicePath);
        }
      }
    }

    // Add dependency xcframework paths (from other packages)
    for (const depXcframeworkPath of dependencyXcframeworkPaths) {
      const depSlicePath = path.join(depXcframeworkPath, slice.sliceId);
      if (fs.existsSync(depSlicePath)) {
        frameworkSearchPaths.push('-F', depSlicePath);
      }
    }

    // Add the framework's Headers directory to include search path
    // This allows headers to include other headers using <SubModule/Header.h> syntax
    const headersPath = path.join(slice.frameworkPath, 'Headers');
    const includeSearchPaths: string[] = [];
    if (fs.existsSync(headersPath)) {
      includeSearchPaths.push('-I', headersPath);
    }

    const result = await execCommandAsync('clang', [
      '-fmodules',
      '-Werror=non-modular-include-in-framework-module',
      '-fobjc-arc',
      '-isysroot',
      sdkPath,
      ...frameworkSearchPaths,
      ...includeSearchPaths,
      testFile,
      '-c',
      '-o',
      outputFile,
    ]);

    if (result.exitCode !== 0) {
      // Check specifically for non-modular header errors in framework modules
      // Filter out SDK false positives (Foundation/CoreFoundation issues)
      const hasNonModularError =
        (result.stderr.includes('non-modular header') ||
          result.stderr.includes('Include of non-modular header')) &&
        !result.stderr.includes('module Foundation does not directly depend') &&
        !result.stderr.includes('module CoreFoundation does not directly depend');

      return {
        success: false,
        message: hasNonModularError
          ? 'Module contains non-modular header includes'
          : 'Clang module import failed',
        details: result.stderr,
      };
    }

    return {
      success: true,
      message: 'Clang module import ok',
    };
  } finally {
    fs.removeSync(tmpDir);
  }
};

/**
 * Finds all .swiftinterface files in a framework
 */
const findSwiftInterfaces = (frameworkPath: string): string[] => {
  const modulesPath = path.join(frameworkPath, 'Modules');

  if (!fs.existsSync(modulesPath)) {
    return [];
  }

  const interfaces: string[] = [];

  const scanDir = (dir: string) => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        scanDir(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.swiftinterface')) {
        interfaces.push(fullPath);
      }
    }
  };

  scanDir(modulesPath);
  return interfaces.sort();
};

/**
 * Checks if a framework contains Swift code by looking for .swiftmodule directory
 */
const hasSwiftCode = (frameworkPath: string): boolean => {
  const modulesPath = path.join(frameworkPath, 'Modules');
  if (!fs.existsSync(modulesPath)) {
    return false;
  }

  const entries = fs.readdirSync(modulesPath, { withFileTypes: true });
  return entries.some((entry) => entry.isDirectory() && entry.name.endsWith('.swiftmodule'));
};

/**
 * Verifies Swift interface presence and basic validity.
 *
 * Note: Full typecheck with swift-frontend requires all dependencies to be
 * available, which isn't practical for prebuilt xcframeworks that may reference
 * types from Objective-C or from sibling frameworks with embedded build paths.
 * We only verify that the swiftinterface files exist and have valid structure.
 */
const verifySwiftInterfaceTypecheck = async (
  slice: XCFrameworkSlice
): Promise<VerificationResult> => {
  // First check if this framework contains Swift code at all
  if (!hasSwiftCode(slice.frameworkPath)) {
    return {
      success: true,
      message: 'No Swift code (ObjC/C++ only framework)',
    };
  }

  const swiftInterfaces = findSwiftInterfaces(slice.frameworkPath);

  if (swiftInterfaces.length === 0) {
    return {
      success: false,
      message:
        'No *.swiftinterface found (for BUILD_LIBRARY_FOR_DISTRIBUTION frameworks this is usually bad)',
    };
  }

  // Check that each swiftinterface file exists and is non-empty
  const issues: string[] = [];
  for (const iface of swiftInterfaces) {
    try {
      const stat = fs.statSync(iface);
      if (stat.size === 0) {
        issues.push(`${path.basename(iface)}: file is empty`);
        continue;
      }

      // Check for potentially invalid imports
      const importIssues = await verifySwiftInterfaceImports(iface, slice.frameworkPath);
      issues.push(...importIssues);
    } catch (err) {
      issues.push(`${path.basename(iface)}: ${err}`);
    }
  }

  if (issues.length > 0) {
    return {
      success: false,
      message: 'Swift interface validation failed',
      details: issues.join('\n'),
    };
  }

  return {
    success: true,
    message: `Swift interface present (${swiftInterfaces.length} file(s))`,
  };
};

/**
 * Verifies that imports in a swiftinterface file are valid.
 * Checks that:
 * 1. Imported modules are either well-known system/SDK modules or defined in the framework's modulemap
 * 2. @_exported imports for submodules reference valid Clang modules (not Swift-only modules)
 *
 * @param swiftInterfacePath Path to the .swiftinterface file
 * @param frameworkPath Path to the framework containing the swiftinterface
 * @returns Array of issue descriptions (empty if all imports are valid)
 */
const verifySwiftInterfaceImports = async (
  swiftInterfacePath: string,
  frameworkPath: string
): Promise<string[]> => {
  const issues: string[] = [];
  const content = fs.readFileSync(swiftInterfacePath, 'utf8');
  const interfaceFileName = path.basename(swiftInterfacePath);

  // Extract the framework name from the path
  const frameworkName = path.basename(frameworkPath, '.framework');

  // Parse the modulemap to find defined modules
  const moduleMapPath = path.join(frameworkPath, 'Modules', 'module.modulemap');
  const definedModules = new Set<string>();

  if (fs.existsSync(moduleMapPath)) {
    const moduleMapContent = fs.readFileSync(moduleMapPath, 'utf8');
    // Match "framework module ModuleName" or "module ModuleName"
    const modulePattern = /(?:framework\s+)?module\s+(\w+)\s*\{/g;
    let match;
    while ((match = modulePattern.exec(moduleMapContent)) !== null) {
      definedModules.add(match[1]);
    }
  }

  // Well-known SDK/system modules that are always available
  const systemModules = new Set([
    'Swift',
    'Foundation',
    'UIKit',
    'AppKit',
    'CoreFoundation',
    'CoreGraphics',
    'QuartzCore',
    'ObjectiveC',
    'Dispatch',
    'os',
    'Darwin',
    'simd',
    'Accelerate',
    'Combine',
    'SwiftUI',
    'AVFoundation',
    'CoreMedia',
    'CoreData',
    'Photos',
    'PhotosUI',
    'CoreLocation',
    'MapKit',
    'WebKit',
    'Metal',
    'MetalKit',
    'MetalPerformanceShaders',
    'Vision',
    'CoreML',
    'NaturalLanguage',
    'Security',
    'LocalAuthentication',
    'AuthenticationServices',
    'UserNotifications',
    'PushKit',
    'StoreKit',
    'GameKit',
    'SpriteKit',
    'SceneKit',
    'ARKit',
    'RealityKit',
    'CoreBluetooth',
    'CoreNFC',
    'HealthKit',
    'HealthKitUI',
    'HomeKit',
    'EventKit',
    'EventKitUI',
    'Contacts',
    'ContactsUI',
    'AddressBook',
    'AddressBookUI',
    'MessageUI',
    'Messages',
    'MultipeerConnectivity',
    'NetworkExtension',
    'Network',
    'SystemConfiguration',
    'CFNetwork',
    'IOKit',
    'CoreServices',
    'MobileCoreServices',
    'CoreTelephony',
    'CoreMotion',
    'CoreAudio',
    'AudioToolbox',
    'MediaPlayer',
    'MediaAccessibility',
    'CoreMIDI',
    'CoreText',
    'CoreImage',
    'ImageIO',
    'GLKit',
    'OpenGLES',
    'CoreVideo',
    'VideoToolbox',
    'Intents',
    'IntentsUI',
    'Speech',
    'SpeechRecognition',
    'CallKit',
    'CarPlay',
    'SafariServices',
    'WebCore',
    'JavaScriptCore',
    'WatchKit',
    'ClockKit',
    'WatchConnectivity',
    'WidgetKit',
    'ActivityKit',
    'BackgroundTasks',
    'CoreSpotlight',
    'FileProvider',
    'FileProviderUI',
    'QuickLook',
    'QuickLookThumbnailing',
    'PDFKit',
    'PencilKit',
    'PassKit',
    'NotificationCenter',
    'LinkPresentation',
    'ExternalAccessory',
    'Accessibility',
    'UniformTypeIdentifiers',
    'OSLog',
    '_Concurrency',
    '_StringProcessing',
    // React Native related
    'React',
    'ReactCommon',
    'react_native_core',
    'react_native_debug',
    'ReactCodegen',
    'RCTTypeSafety',
    'FBReactNativeSpec',
  ]);

  // Find all import statements
  const importPattern = /^(?:@_exported\s+)?import\s+(\w+)\s*$/gm;
  let match;

  while ((match = importPattern.exec(content)) !== null) {
    const importedModule = match[1];
    const importStatement = match[0].trim();

    // Check if the import is valid
    const isSystemModule = systemModules.has(importedModule);
    const isDefinedInModuleMap = definedModules.has(importedModule);
    const isSameFramework = importedModule === frameworkName;

    if (!isSystemModule && !isDefinedInModuleMap && !isSameFramework) {
      // This is potentially an invalid import - it's not a known system module
      // and not defined in this framework's modulemap
      //
      // Special case: If it's an @_exported import, it's more likely to cause
      // issues because Swift will try to re-export symbols from that module
      const isExported = importStatement.startsWith('@_exported');

      if (isExported) {
        issues.push(
          `${interfaceFileName}: @_exported import of unknown module '${importedModule}' - ` +
            `this module is not defined in the framework's modulemap and may cause build failures`
        );
      } else {
        // Regular imports of unknown modules could be external dependencies
        // Just warn, don't treat as error
        // (External dependencies should be handled at a higher level)
      }
    }
  }

  return issues;
};

/**
 * Internal function to verify a single product's xcframework
 */
const verifyAsync = async (
  pkg: Package,
  product: SPMProduct,
  buildFlavor: BuildFlavor,
  options?: VerifyOptions
): Promise<XCFrameworkVerificationReport> => {
  const xcframeworkPath = Frameworks.getFrameworkPath(pkg.path, product.name, buildFlavor);

  // Verify it's a valid xcframework
  validateXCFramework(xcframeworkPath);

  // Collect dependency xcframework paths for verification
  const dependencyXcframeworkPaths = collectDependencyXcframeworkPaths(pkg, product, buildFlavor);

  // Run basic verifications
  const infoPlistValid = verifyInfoPlist(xcframeworkPath);
  const codesignValid = options?.skipCodesign
    ? { success: true, message: 'Skipped' }
    : verifyCodesign(xcframeworkPath);
  const junkFiles = scanForJunkFiles(xcframeworkPath);

  // Find and verify all slices
  const slices = findFrameworkSlices(xcframeworkPath);
  if (slices.length === 0) {
    throw new Error(`No .framework slices found inside: ${xcframeworkPath}`);
  }

  const sliceReports = await verifyAllSlices(
    pkg,
    slices,
    xcframeworkPath,
    options,
    dependencyXcframeworkPaths
  );

  // Determine overall success
  const criticalFailures = sliceReports.some(
    (r) =>
      !r.modulesPresent.success ||
      !r.modularHeadersValid.success ||
      !r.clangModuleImport.success ||
      !r.swiftInterfaceTypecheck.success
  );

  return {
    xcframeworkPath,
    infoPlistValid,
    codesignValid,
    junkFiles,
    slices: sliceReports,
    overallSuccess: infoPlistValid.success && !criticalFailures,
  };
};

/**
 * Validates that the path points to a valid xcframework with Info.plist.
 */
const validateXCFramework = (xcframeworkPath: string): void => {
  if (!fs.existsSync(xcframeworkPath) || !fs.existsSync(path.join(xcframeworkPath, 'Info.plist'))) {
    throw new Error(`Not an .xcframework (missing Info.plist): ${xcframeworkPath}`);
  }
};

/**
 * Collects xcframework paths from external dependencies for verification.
 */
const collectDependencyXcframeworkPaths = (
  pkg: Package,
  product: SPMProduct,
  buildFlavor: BuildFlavor
): string[] => {
  const paths: string[] = [];

  if (!product.externalDependencies) {
    return paths;
  }

  for (const dep of product.externalDependencies) {
    const depXcframeworksDir = path.join(
      pkg.path,
      '..',
      dep,
      '.xcframeworks',
      buildFlavor.toLowerCase()
    );

    if (!fs.existsSync(depXcframeworksDir)) {
      continue;
    }

    // Find all xcframeworks in the dependency's directory
    const entries = fs.readdirSync(depXcframeworksDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory() && entry.name.endsWith('.xcframework')) {
        paths.push(path.join(depXcframeworksDir, entry.name));
      }
    }
  }

  return paths;
};

/**
 * Verifies all slices and reports results with spinners.
 */
const verifyAllSlices = async (
  pkg: Package,
  slices: XCFrameworkSlice[],
  xcframeworkPath: string,
  options?: VerifyOptions,
  dependencyXcframeworkPaths: string[] = []
): Promise<SliceVerificationReport[]> => {
  const reports: SliceVerificationReport[] = [];

  for (const slice of slices) {
    const spinner = createAsyncSpinner(`Verifying slice: ${slice.sliceId}`, pkg);

    const report = await verifySlice(
      slice,
      xcframeworkPath,
      spinner,
      options,
      dependencyXcframeworkPaths
    );
    reports.push(report);

    // Report slice status
    const issues = collectSliceIssues(report);
    if (issues.length > 0) {
      spinner.warn(`Slice ${slice.sliceId}: ${issues.join(', ')} verified with issues.`);
    } else {
      spinner.succeed(`Slice ${slice.sliceId} verified successfully.`);
    }
  }

  return reports;
};

/**
 * Collects issue descriptions from a slice verification report.
 */
const collectSliceIssues = (report: SliceVerificationReport): string[] => {
  const issues: string[] = [];

  if (!report.headersPresent.success) issues.push('headers');
  if (!report.modulesPresent.success) issues.push('modules');
  if (!report.moduleMapPresent.success) issues.push('modulemap');
  if (!report.modularHeadersValid.success) issues.push('non-modular-headers');
  if (!report.clangModuleImport.success) issues.push('clang');
  if (!report.swiftInterfaceTypecheck.success) issues.push('swift');

  return issues;
};

/**
 * Verifies a single slice (without spinners - called by verifyProductXCFramework)
 */
const verifySlice = async (
  slice: XCFrameworkSlice,
  xcframeworkPath: string,
  spinner: AsyncSpinner,
  options?: VerifyOptions,
  dependencyXcframeworkPaths: string[] = []
): Promise<SliceVerificationReport> => {
  const machoInfo = getMachoInfo(slice.binaryPath);
  const linkedDeps = getLinkedDependencies(slice.binaryPath);
  const headersPresent = verifyHeaders(slice.frameworkPath);
  const modulesPresent = verifyModules(slice.frameworkPath);
  const moduleMapPresent = verifyModuleMap(slice.frameworkPath);

  let modularHeadersValid: VerificationResult = { success: true, message: 'Skipped' };
  let clangModuleImport: VerificationResult = { success: true, message: 'Skipped' };
  let swiftInterfaceTypecheck: VerificationResult = { success: true, message: 'Skipped' };

  if (!options?.skipClangCheck) {
    spinner.info('Verifying modular headers...');
    modularHeadersValid = await verifyModularHeaders(
      slice,
      xcframeworkPath,
      dependencyXcframeworkPaths
    );

    spinner.info('Verifying clang module import...');
    clangModuleImport = await verifyClangModuleImport(
      slice,
      xcframeworkPath,
      dependencyXcframeworkPaths
    );
  }

  if (!options?.skipSwiftCheck) {
    spinner.info('Verifying Swift interface typecheck...');
    swiftInterfaceTypecheck = await verifySwiftInterfaceTypecheck(slice);
  }

  return {
    sliceId: slice.sliceId,
    frameworkName: slice.frameworkName,
    machoInfo,
    linkedDeps,
    headersPresent,
    modulesPresent,
    moduleMapPresent,
    modularHeadersValid,
    clangModuleImport,
    swiftInterfaceTypecheck,
  };
};
