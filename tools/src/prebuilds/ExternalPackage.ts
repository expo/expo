import fs from 'fs-extra';
import { glob } from 'glob';
import path from 'path';

import { getExternalPackagesDir, getPrecompileDir } from '../Directories';
import { Package } from '../Packages';
import { SPMConfig } from './SPMConfig.types';
import { resolvePackagePath } from './resolvePackage';

const SPMConfigFileName = 'spm.config.json';

/**
 * Common interface for packages that can be prebuilt with SPM.
 * This allows both Expo packages (Package) and external/third-party
 * packages (ExternalPackage) to be used interchangeably.
 */
export interface SPMPackageSource {
  /**
   * Path to the package source files (for file operations like glob, copy, etc.)
   */
  path: string;

  /**
   * Path where build artifacts (.build/) are stored.
   * Centralized under packages/precompile/<package-name>/ so that build artifacts
   * survive yarn reinstalls and are separated from source code.
   */
  buildPath: string;

  /**
   * The npm package name
   */
  packageName: string;

  /**
   * The package version
   */
  packageVersion: string;

  /**
   * Optional version prefix inserted into output paths for 3rd-party packages.
   * When set, output paths become:
   *   <buildPath>/output/<versionPrefix>/<flavor>/xcframeworks/
   * instead of:
   *   <buildPath>/output/<flavor>/xcframeworks/
   *
   * Format: "<packageVersion>/<reactNativeVersion>/<hermesVersion>"
   * Set during pipeline prepare:inputs step after RN/Hermes versions are resolved.
   */
  outputVersionPrefix?: string;

  /**
   * Returns the SPM configuration for this package
   */
  getSwiftPMConfiguration(): SPMConfig;
}

/**
 * Represents an external (third-party) package that has an SPM configuration
 * in external-configs/ios/ but whose source code lives in node_modules/.
 */
export class ExternalPackage implements SPMPackageSource {
  /**
   * Path to the config directory (external-configs/ios/<package-name>/)
   */
  configPath: string;

  /**
   * Path to the actual package source in node_modules (implements SPMPackageSource.path)
   */
  path: string;

  /**
   * Path where build artifacts (.build/) are stored, under packages/precompile/<package-name>/.
   * Separate from node_modules so builds survive yarn reinstalls.
   */
  buildPath: string;

  /**
   * The npm package name (e.g., 'react-native-svg')
   */
  packageName: string;

  /**
   * The package version from node_modules package.json
   */
  packageVersion: string;

  /**
   * Optional version prefix for versioned output paths.
   * Set during pipeline prepare:inputs step.
   */
  outputVersionPrefix?: string;

  /**
   * The parsed SPM configuration
   */
  private spmConfig: SPMConfig;

  constructor(configPath: string, packageName: string) {
    this.configPath = configPath;
    this.packageName = packageName;
    this.path = resolvePackagePath(packageName);
    this.buildPath = path.join(getPrecompileDir(), '.build', packageName);

    const spmConfigPath = path.join(configPath, SPMConfigFileName);
    if (!fs.existsSync(spmConfigPath)) {
      throw new Error(`No spm.config.json found at: ${spmConfigPath}`);
    }

    this.spmConfig = require(spmConfigPath);

    // Verify the package exists in node_modules
    if (!fs.existsSync(this.path)) {
      throw new Error(
        `External package "${packageName}" not found in node_modules. ` +
          `Expected at: ${this.path}. Please run yarn install.`
      );
    }

    // Read version from package.json in node_modules
    const packageJsonPath = path.join(this.path, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = require(packageJsonPath);
      this.packageVersion = packageJson.version || '0.0.0';
    } else {
      this.packageVersion = '0.0.0';
    }
  }

  /**
   * Returns the SPM configuration for this external package.
   */
  getSwiftPMConfiguration(): SPMConfig {
    return this.spmConfig;
  }

  /**
   * Resolves a relative path from the spm.config.json to an absolute path
   * in the node_modules source directory.
   */
  resolveSourcePath(relativePath: string): string {
    return path.join(this.path, relativePath);
  }

  /**
   * Returns the path to the spm.config.json file
   */
  get spmConfigPath(): string {
    return path.join(this.configPath, SPMConfigFileName);
  }
}

/**
 * Discovers all external packages that have spm.config.json files
 * in the external-configs/ios/ directory.
 */
export async function discoverExternalPackagesAsync(): Promise<ExternalPackage[]> {
  const externalDir = getExternalPackagesDir();

  // Check if external packages directory exists
  if (!(await fs.pathExists(externalDir))) {
    return [];
  }

  // Find all spm.config.json files in external-configs/ios/
  // Pattern matches both regular packages and scoped packages:
  // - react-native-svg/spm.config.json
  // - @shopify/react-native-skia/spm.config.json
  const configPaths = await glob(`{*,@*/*}/${SPMConfigFileName}`, {
    cwd: externalDir,
  });

  return configPaths.map((configPath) => {
    // configPath is like "react-native-svg/spm.config.json"
    const packageName = path.dirname(configPath);
    const fullConfigDir = path.join(externalDir, packageName);
    return new ExternalPackage(fullConfigDir, packageName);
  });
}

/**
 * Gets an external package by name from external-configs/ios/
 * @param packageName The npm package name (e.g., 'react-native-svg')
 */
export function getExternalPackageByName(packageName: string): ExternalPackage | null {
  const externalDir = getExternalPackagesDir();
  const configPath = path.join(externalDir, packageName);
  const spmConfigPath = path.join(configPath, SPMConfigFileName);

  if (!fs.existsSync(spmConfigPath)) {
    return null;
  }

  return new ExternalPackage(configPath, packageName);
}

/**
 * Helper function to check if a package provides a specific product
 */
function checkPackageForProduct(
  externalDir: string,
  packageName: string,
  productName: string
): ExternalPackage | null {
  const configPath = path.join(externalDir, packageName);
  const spmConfigPath = path.join(configPath, SPMConfigFileName);

  if (!fs.existsSync(spmConfigPath)) {
    return null;
  }

  try {
    // Clear require cache to ensure fresh read
    delete require.cache[require.resolve(spmConfigPath)];
    const spmConfig: SPMConfig = require(spmConfigPath);

    // Check if any product in this config matches the requested product name
    for (const product of spmConfig.products || []) {
      if (product.name === productName) {
        return new ExternalPackage(configPath, packageName);
      }
    }
  } catch {
    // Skip packages with invalid config
  }

  return null;
}

/**
 * Finds an external package that provides a specific product (xcframework).
 * Searches through all external packages' spm.config.json to find one that provides the product.
 * Supports both regular packages and scoped packages (e.g., @shopify/react-native-skia).
 *
 * @param productName The product name to search for (e.g., 'RNWorklets')
 * @returns The ExternalPackage that provides this product, or null if not found
 */
export function getExternalPackageByProductName(productName: string): ExternalPackage | null {
  const externalDir = getExternalPackagesDir();

  // Check if external packages directory exists
  if (!fs.existsSync(externalDir)) {
    return null;
  }

  // Get all subdirectories in external-configs/ios/
  const entries = fs.readdirSync(externalDir, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    // Handle scoped packages (@scope directories)
    if (entry.name.startsWith('@')) {
      const scopeDir = path.join(externalDir, entry.name);
      const scopedEntries = fs.readdirSync(scopeDir, { withFileTypes: true });

      for (const scopedEntry of scopedEntries) {
        if (!scopedEntry.isDirectory()) {
          continue;
        }

        const packageName = `${entry.name}/${scopedEntry.name}`;
        const result = checkPackageForProduct(externalDir, packageName, productName);
        if (result) {
          return result;
        }
      }
    } else {
      // Regular (non-scoped) package
      const result = checkPackageForProduct(externalDir, entry.name, productName);
      if (result) {
        return result;
      }
    }
  }

  return null;
}

/**
 * Type guard to check if an SPMPackageSource is an ExternalPackage
 */
export function isExternalPackage(pkg: SPMPackageSource): pkg is ExternalPackage {
  return pkg instanceof ExternalPackage;
}

/**
 * Type guard to check if an SPMPackageSource is an Expo Package
 */
export function isExpoPackage(pkg: SPMPackageSource): pkg is Package {
  return pkg instanceof Package;
}
