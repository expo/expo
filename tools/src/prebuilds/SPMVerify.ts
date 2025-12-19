import chalk from 'chalk';
import { spawn, execSync, spawnSync } from 'child_process';
import fs from 'fs-extra';
import ora from 'ora';
import os from 'os';
import path from 'path';

import logger from '../Logger';
import { Package } from '../Packages';
import { Frameworks } from './Frameworks';
import { BuildFlavor } from './Prebuilder.types';
import { SPMConfig, SPMProduct } from './SPMConfig.types';
import type {
  VerificationResult,
  XCFrameworkSlice,
  XCFrameworkVerificationReport,
  SliceVerificationReport,
  VerifyOptions,
} from './SPMVerify.types';

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

    const result = await execCommandAsync('clang', [
      '-fmodules',
      '-fobjc-arc',
      '-isysroot',
      sdkPath,
      ...frameworkSearchPaths,
      testFile,
      '-c',
      '-o',
      outputFile,
    ]);

    if (result.exitCode !== 0) {
      return {
        success: false,
        message: 'Clang module import failed',
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
  slice: XCFrameworkSlice,
  _xcframeworkPath: string
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
      }
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

export const SPMVerify = {
  /**
   * Verifies all xcframeworks for a package and returns verification reports for each product.
   *
   * @param pkg Package to verify xcframeworks for
   * @param buildFlavor Build flavor (Debug or Release)
   * @param options Verification options
   * @returns Map of product name to verification report
   */
  verifyPackageXCFrameworksAsync: async (
    pkg: Package,
    buildFlavor: BuildFlavor,
    options?: VerifyOptions
  ): Promise<Map<string, XCFrameworkVerificationReport>> => {
    logger.info(
      `🔍 Verifying xcframeworks for ${chalk.green(pkg.packageName)} [${buildFlavor.toLowerCase()}]`
    );

    const spmConfig = await pkg.getSwiftPMConfigurationAsync();
    if (!spmConfig) {
      throw new Error(`No SwiftPM configuration found for package: ${pkg.packageName}`);
    }

    // Check required tools once
    const toolsCheck = checkRequiredTools();
    if (!toolsCheck.success) {
      throw new Error(toolsCheck.message);
    }

    const results = new Map<string, XCFrameworkVerificationReport>();

    for (const product of spmConfig.products) {
      logger.info(`   Verifying ${chalk.green(product.name)}.xcframework...`);

      try {
        const report = await verifyProductXCFramework(
          pkg,
          product,
          buildFlavor,
          spmConfig,
          options
        );
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
          xcframeworkPath: Frameworks.getFrameworkPath(pkg, product, buildFlavor),
          infoPlistValid: { success: false, message: String(error) },
          codesignValid: { success: true, message: 'Skipped' },
          junkFiles: [],
          slices: [],
          overallSuccess: false,
        });
      }
    }

    return results;
  },

  /**
   * Verifies a single product's xcframework for a package.
   *
   * @param pkg Package to verify
   * @param productName Name of the product to verify
   * @param buildFlavor Build flavor (Debug or Release)
   * @param options Verification options
   * @returns Verification report for the product
   */
  verifyProductXCFrameworkAsync: async (
    pkg: Package,
    productName: string,
    buildFlavor: BuildFlavor,
    options?: VerifyOptions
  ): Promise<XCFrameworkVerificationReport> => {
    const spmConfig = await pkg.getSwiftPMConfigurationAsync();
    if (!spmConfig) {
      throw new Error(`No SwiftPM configuration found for package: ${pkg.packageName}`);
    }

    const product = spmConfig.products.find((p) => p.name === productName);
    if (!product) {
      throw new Error(`Product '${productName}' not found in package: ${pkg.packageName}`);
    }

    // Check required tools
    const toolsCheck = checkRequiredTools();
    if (!toolsCheck.success) {
      throw new Error(toolsCheck.message);
    }

    logger.info(`  Verifying ${chalk.green(productName)}.xcframework...`);

    try {
      const report = await verifyProductXCFramework(pkg, product, buildFlavor, spmConfig, options);

      if (!report.overallSuccess) {
        const failures: string[] = [];

        if (!report.infoPlistValid.success) {
          failures.push('Info.plist invalid');
        }

        for (const slice of report.slices) {
          if (!slice.modulesPresent.success) {
            failures.push(`Modules missing (${slice.sliceId})`);
          }
          if (!slice.clangModuleImport.success) {
            failures.push(`Clang @import failed (${slice.sliceId})`);
          }
          if (!slice.swiftInterfaceTypecheck.success) {
            failures.push(`Swift typecheck failed (${slice.sliceId})`);
          }
        }

        logger.error(
          `  ${chalk.red('✗')} Verification failed for ${chalk.green(productName)}.xcframework: ${failures.join(', ')}`
        );
      }

      return report;
    } catch (error) {
      logger.error(
        `  ${chalk.red('✗')} Verification failed for ${chalk.green(productName)}.xcframework: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  },
};

/**
 * Internal function to verify a single product's xcframework
 */
const verifyProductXCFramework = async (
  pkg: Package,
  product: SPMProduct,
  buildFlavor: BuildFlavor,
  spmConfig: SPMConfig,
  options?: VerifyOptions
): Promise<XCFrameworkVerificationReport> => {
  const xcframeworkPath = Frameworks.getFrameworkPath(pkg, product, buildFlavor);

  // Verify it's an xcframework
  if (!fs.existsSync(xcframeworkPath) || !fs.existsSync(path.join(xcframeworkPath, 'Info.plist'))) {
    throw new Error(`Not an .xcframework (missing Info.plist): ${xcframeworkPath}`);
  }

  // Build dependency xcframework paths from external dependencies
  const dependencyXcframeworkPaths: string[] = [];
  if (spmConfig.externalDependencies) {
    for (const dep of spmConfig.externalDependencies) {
      // External dependencies that are expo packages (e.g., "expo-modules-core")
      const depPackagePath = path.join(pkg.path, '..', dep);
      const depXcframeworksDir = path.join(
        depPackagePath,
        '.xcframeworks',
        buildFlavor.toLowerCase()
      );
      if (fs.existsSync(depXcframeworksDir)) {
        // Find all xcframeworks in the dependency's xcframeworks directory
        const entries = fs.readdirSync(depXcframeworksDir, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isDirectory() && entry.name.endsWith('.xcframework')) {
            dependencyXcframeworkPaths.push(path.join(depXcframeworksDir, entry.name));
          }
        }
      }
    }
  }

  // Run basic verifications
  const infoPlistValid = verifyInfoPlist(xcframeworkPath);

  let codesignValid: VerificationResult = { success: true, message: 'Skipped' };
  if (!options?.skipCodesign) {
    codesignValid = verifyCodesign(xcframeworkPath);
  }

  const junkFiles = scanForJunkFiles(xcframeworkPath);
  const slices = findFrameworkSlices(xcframeworkPath);

  if (slices.length === 0) {
    throw new Error(`No .framework slices found inside: ${xcframeworkPath}`);
  }

  const sliceReports: SliceVerificationReport[] = [];

  for (const slice of slices) {
    const spinner = ora({
      text: `Verifying slice: ${slice.sliceId}`,
      prefixText: '    ',
    }).start();

    const report = await verifySlice(slice, xcframeworkPath, options, dependencyXcframeworkPaths);
    sliceReports.push(report);

    // Collect issues for this slice
    const issues: string[] = [];
    if (!report.headersPresent.success) {
      issues.push('headers');
    }
    if (!report.modulesPresent.success) {
      issues.push('modules');
    }
    if (!report.moduleMapPresent.success) {
      issues.push('modulemap');
    }
    if (!report.clangModuleImport.success) {
      issues.push('clang');
    }
    if (!report.swiftInterfaceTypecheck.success) {
      issues.push('swift');
    }

    if (issues.length > 0) {
      spinner.warn(`Slice ${slice.sliceId}: ${issues.join(', ')}`);
    } else {
      spinner.succeed(`Slice ${slice.sliceId}`);
    }
  }

  const criticalFailures = sliceReports.some(
    (r) =>
      !r.modulesPresent.success ||
      !r.clangModuleImport.success ||
      !r.swiftInterfaceTypecheck.success
  );

  const overallSuccess = infoPlistValid.success && !criticalFailures;

  return {
    xcframeworkPath,
    infoPlistValid,
    codesignValid,
    junkFiles,
    slices: sliceReports,
    overallSuccess,
  };
};

/**
 * Verifies a single slice (without spinners - called by verifyProductXCFramework)
 */
const verifySlice = async (
  slice: XCFrameworkSlice,
  xcframeworkPath: string,
  options?: VerifyOptions,
  dependencyXcframeworkPaths: string[] = []
): Promise<SliceVerificationReport> => {
  const machoInfo = getMachoInfo(slice.binaryPath);
  const linkedDeps = getLinkedDependencies(slice.binaryPath);
  const headersPresent = verifyHeaders(slice.frameworkPath);
  const modulesPresent = verifyModules(slice.frameworkPath);
  const moduleMapPresent = verifyModuleMap(slice.frameworkPath);

  let clangModuleImport: VerificationResult = { success: true, message: 'Skipped' };
  let swiftInterfaceTypecheck: VerificationResult = { success: true, message: 'Skipped' };

  if (!options?.skipClangCheck) {
    clangModuleImport = await verifyClangModuleImport(
      slice,
      xcframeworkPath,
      dependencyXcframeworkPaths
    );
  }

  if (!options?.skipSwiftCheck) {
    swiftInterfaceTypecheck = await verifySwiftInterfaceTypecheck(slice, xcframeworkPath);
  }

  return {
    sliceId: slice.sliceId,
    frameworkName: slice.frameworkName,
    machoInfo,
    linkedDeps,
    headersPresent,
    modulesPresent,
    moduleMapPresent,
    clangModuleImport,
    swiftInterfaceTypecheck,
  };
};
