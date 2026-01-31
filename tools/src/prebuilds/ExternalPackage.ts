import fs from 'fs-extra';
import { glob } from 'glob';
import path from 'path';

import { getExternalPackagesDir, getNodeModulesDir } from '../Directories';
import { Package } from '../Packages';
import { SPMConfig } from './SPMConfig.types';

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
   * The npm package name
   */
  packageName: string;

  /**
   * The package version
   */
  packageVersion: string;

  /**
   * Returns the SPM configuration for this package
   */
  getSwiftPMConfiguration(): SPMConfig;
}

/**
 * Represents an external (third-party) package that has an SPM configuration
 * in packages/external/ but whose source code lives in node_modules/.
 */
export class ExternalPackage implements SPMPackageSource {
  /**
   * Path to the config directory (packages/external/<package-name>/)
   */
  configPath: string;

  /**
   * Path to the actual package source in node_modules (implements SPMPackageSource.path)
   */
  path: string;

  /**
   * The npm package name (e.g., 'react-native-svg')
   */
  packageName: string;

  /**
   * The package version from node_modules package.json
   */
  packageVersion: string;

  /**
   * The parsed SPM configuration
   */
  private spmConfig: SPMConfig;

  constructor(configPath: string, packageName: string) {
    this.configPath = configPath;
    this.packageName = packageName;
    this.path = path.join(getNodeModulesDir(), packageName);

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
 * in the packages/external/ directory.
 */
export async function discoverExternalPackagesAsync(): Promise<ExternalPackage[]> {
  const externalDir = getExternalPackagesDir();

  // Check if external packages directory exists
  if (!(await fs.pathExists(externalDir))) {
    return [];
  }

  // Find all spm.config.json files in packages/external/
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
 * Gets an external package by name from packages/external/
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

  // Get all subdirectories in packages/external/
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
