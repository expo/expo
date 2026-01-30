/**
 * Codegen - Handles React Native codegen generation for external packages.
 *
 * This module runs React Native's codegen script to generate Fabric component
 * and TurboModule specs for third-party libraries.
 */

import { execSync } from 'child_process';
import fs from 'fs-extra';
import path from 'path';

import { getNodeModulesDir } from '../Directories';
import type { SPMPackageSource } from './ExternalPackage';

/**
 * Codegen configuration from package.json
 */
export interface CodegenConfig {
  name: string;
  type: 'all' | 'modules' | 'components';
  jsSrcsDir: string;
  ios?: {
    componentProvider?: Record<string, string>;
  };
}

/**
 * Gets the codegen configuration from a package's package.json
 * @returns The codegenConfig or null if not present
 */
export function getCodegenConfig(pkg: SPMPackageSource): CodegenConfig | null {
  const packageJsonPath = path.join(pkg.path, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    return null;
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  return packageJson.codegenConfig || null;
}

/**
 * Checks if a package has codegen configuration
 */
export function hasCodegen(pkg: SPMPackageSource): boolean {
  return getCodegenConfig(pkg) !== null;
}

/**
 * Gets the expected output path for codegen files
 */
export function getCodegenOutputPath(pkg: SPMPackageSource): string {
  return path.join(pkg.path, '.build', 'codegen');
}

/**
 * Gets the path to the Fabric components codegen output
 */
export function getCodegenComponentsPath(pkg: SPMPackageSource): string {
  const config = getCodegenConfig(pkg);
  if (!config) {
    throw new Error(`Package ${pkg.packageName} does not have codegenConfig`);
  }
  return path.join(
    getCodegenOutputPath(pkg),
    'build',
    'generated',
    'ios',
    'ReactCodegen',
    'react',
    'renderer',
    'components',
    config.name
  );
}

/**
 * Gets the path to the native modules codegen output
 */
export function getCodegenModulesPath(pkg: SPMPackageSource): string {
  const config = getCodegenConfig(pkg);
  if (!config) {
    throw new Error(`Package ${pkg.packageName} does not have codegenConfig`);
  }
  return path.join(
    getCodegenOutputPath(pkg),
    'build',
    'generated',
    'ios',
    'ReactCodegen',
    config.name
  );
}

/**
 * Checks if codegen has already been generated for a package
 */
export function isCodegenGenerated(pkg: SPMPackageSource): boolean {
  const config = getCodegenConfig(pkg);
  if (!config) {
    return true; // No codegen needed, so consider it "done"
  }

  const outputPath = getCodegenOutputPath(pkg);
  if (!fs.existsSync(outputPath)) {
    return false;
  }

  // Check for expected files based on codegen type
  const componentsPath = getCodegenComponentsPath(pkg);
  const modulesPath = getCodegenModulesPath(pkg);

  if (config.type === 'all' || config.type === 'components') {
    // Check for Props.h which is always generated for components
    if (!fs.existsSync(path.join(componentsPath, 'Props.h'))) {
      return false;
    }
  }

  if (config.type === 'all' || config.type === 'modules') {
    // Check for the module header
    const moduleHeaderPath = path.join(modulesPath, `${config.name}.h`);
    if (!fs.existsSync(moduleHeaderPath)) {
      return false;
    }
  }

  return true;
}

/**
 * Runs React Native codegen for a package.
 *
 * This uses the generate-codegen-artifacts.js script from react-native
 * to generate iOS codegen files.
 *
 * @param pkg The package to generate codegen for
 * @param force If true, regenerates even if codegen exists
 * @returns True if codegen was run, false if skipped (already exists)
 */
export async function runCodegenAsync(
  pkg: SPMPackageSource,
  force: boolean = false
): Promise<boolean> {
  const config = getCodegenConfig(pkg);
  if (!config) {
    // No codegen needed for this package
    return false;
  }

  // Skip if already generated (unless forced)
  if (!force && isCodegenGenerated(pkg)) {
    return false;
  }

  const outputPath = getCodegenOutputPath(pkg);
  const reactNativePath = path.join(getNodeModulesDir(), 'react-native');
  const codegenScript = path.join(reactNativePath, 'scripts', 'generate-codegen-artifacts.js');

  if (!fs.existsSync(codegenScript)) {
    throw new Error(
      `React Native codegen script not found at: ${codegenScript}\n` +
        `Make sure react-native is installed in node_modules.`
    );
  }

  // Ensure output directory exists
  await fs.ensureDir(outputPath);

  // Build the codegen command
  // The script expects:
  // -p: path to the library (where package.json with codegenConfig is)
  // -t: target platform (ios)
  // -o: output path
  // -s: source type (library for third-party packages)
  const command = [
    'node',
    `"${codegenScript}"`,
    `-p "${pkg.path}"`,
    '-t ios',
    `-o "${outputPath}"`,
    '-s library',
  ].join(' ');

  try {
    execSync(command, {
      stdio: 'pipe',
      encoding: 'utf-8',
      cwd: reactNativePath,
    });
    return true;
  } catch (error: any) {
    // Extract useful error message
    const stderr = error.stderr || error.message;
    throw new Error(`Codegen failed for ${pkg.packageName}:\n${stderr}`);
  }
}

/**
 * Ensures codegen is available for a package before building.
 * This should be called before SPM build if the package has Fabric components.
 *
 * @param pkg The package to ensure codegen for
 * @param onStatus Optional callback for status updates
 * @returns True if codegen was generated, false if skipped or not needed
 */
export async function ensureCodegenAsync(
  pkg: SPMPackageSource,
  onStatus?: (status: string) => void
): Promise<boolean> {
  if (!hasCodegen(pkg)) {
    return false;
  }

  if (isCodegenGenerated(pkg)) {
    onStatus?.(`Codegen already generated for ${pkg.packageName}`);
    return false;
  }

  onStatus?.(`Generating codegen for ${pkg.packageName}...`);
  await runCodegenAsync(pkg, false);
  onStatus?.(`Codegen generated for ${pkg.packageName}`);
  return true;
}

export const Codegen = {
  getCodegenConfig,
  hasCodegen,
  getCodegenOutputPath,
  getCodegenComponentsPath,
  getCodegenModulesPath,
  isCodegenGenerated,
  runCodegenAsync,
  ensureCodegenAsync,
};
