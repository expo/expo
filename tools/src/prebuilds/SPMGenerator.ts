import chalk from 'chalk';
import { spawnSync } from 'child_process';
import fs from 'fs-extra';
import { glob } from 'glob';
import path from 'path';

import type { DownloadedDependencies } from './Artifacts.types';
import type { SPMPackageSource } from './ExternalPackage';
import { BuildFlavor } from './Prebuilder.types';
import { SPMProduct, SPMTarget } from './SPMConfig.types';
import { SPMPackage } from './SPMPackage';
import { createAsyncSpinner } from './Utils';
import logger from '../Logger';

/**
 * Checks if file content has changed between source and destination.
 * Uses size comparison first (fast), then native cmp command for byte comparison.
 * Returns true if destination doesn't exist or content differs.
 */
function hasFileContentChanged(sourcePath: string, destPath: string): boolean {
  if (!fs.existsSync(destPath)) {
    return true;
  }

  const sourceStat = fs.statSync(sourcePath);
  const destStat = fs.statSync(destPath);

  // Different size = different content
  if (sourceStat.size !== destStat.size) {
    return true;
  }

  // Same size - use cmp for efficient byte comparison
  // cmp -s returns 0 if identical, 1 if different, 2 if error
  const result = spawnSync('cmp', ['-s', sourcePath, destPath]);
  return result.status !== 0;
}

/**
 * Writes content to file only if it differs from existing content.
 * Preserves mtime for Xcode incremental builds.
 * Returns true if file was written, false if unchanged.
 */
function writeFileIfChanged(filePath: string, content: string): boolean {
  if (fs.existsSync(filePath)) {
    const existing = fs.readFileSync(filePath, 'utf-8');
    if (existing === content) {
      return false;
    }
  }
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf-8');
  return true;
}

export const SPMGenerator = {
  /**
   * Generates a Package.swift file for the given node package.
   * @param pkg Package
   * @param product Product
   * @param buildType Build type (e.g., Debug, Release)
   * @param artifacts Optional downloaded artifacts from centralized cache
   */
  genereateSwiftPackageAsync: async (
    pkg: SPMPackageSource,
    product: SPMProduct,
    buildType: BuildFlavor,
    artifacts?: DownloadedDependencies
  ): Promise<void> => {
    logger.info(
      `📦 Generating Package.swift for ${chalk.green(pkg.packageName)}/${chalk.green(product.name)}...`
    );
    // Use SPMPackage to generate Package.swift
    const packageSwiftPath = SPMGenerator.getSwiftPackagePath(pkg, product);
    const targetSourceCodePath = SPMGenerator.getGeneratedProductFilesPath(pkg, product);

    // Extract artifact paths if provided
    const artifactPaths = artifacts
      ? {
          hermes: artifacts.hermes,
          reactNativeDependencies: artifacts.reactNativeDependencies,
          react: artifacts.react,
        }
      : undefined;

    await SPMPackage.writePackageSwiftAsync(
      pkg,
      product,
      buildType,
      packageSwiftPath,
      targetSourceCodePath,
      artifactPaths
    );
  },

  /**
   * Copies source files to the appropriate location for the given product in the package.
   * This is done so that we can keep the legacy source file structure intact while taking
   * advantage of building using Swift Package Manager that needs to be isolated per target.
   * @param pkg Package
   * @param product Product
   */
  generateIsolatedSourcesForTargetsAsync: async (pkg: SPMPackageSource, product: SPMProduct) => {
    const loggerTitle = `${chalk.green(pkg.packageName)}/${chalk.green(product.name)}`;
    logger.info(`📂 Generating files for ${loggerTitle}`);

    // Walk through all targets for the product and collect source files to copy into spm code structure
    for (const target of product.targets) {
      // Ensure target is a source target!
      if (target.type === 'framework') {
        continue;
      }

      const spinner = createAsyncSpinner(
        `Generating source folder structure for target ${chalk.green(target.name)}...`,
        pkg,
        product
      );

      const targetDestination = SPMGenerator.getTargetPath(pkg, product, target);
      const targetSourcePath = path.resolve(pkg.path, target.path);

      const targetExcludes = target.exclude || [];
      const pattern =
        target.pattern ??
        (target.type === 'cpp'
          ? '**/*.{cpp,c,cc,cxx}'
          : target.type === 'objc'
            ? '**/*.{m,mm,c,cpp}'
            : '**/*.swift');

      // Track files handled by fileMapping to exclude from regular copying
      const mappedFiles = new Set<string>();

      // Process file mappings first (if defined)
      if (target.fileMapping && target.fileMapping.length > 0) {
        for (const mapping of target.fileMapping) {
          // Handle symlink type - creates a directory symlink
          if (mapping.type === 'symlink') {
            const headerBasePath = SPMGenerator.getHeaderFilesPath(pkg, product, target);
            const headerRootPath = path.dirname(headerBasePath);
            const symlinkPath = path.join(headerRootPath, mapping.to);
            const targetPath = path.join(headerRootPath, mapping.from);

            spinner.info(
              `Creating symlink ${chalk.cyan(mapping.to)} → ${chalk.cyan(mapping.from)}...`
            );

            await fs.ensureDir(path.dirname(symlinkPath));
            if (!fs.existsSync(symlinkPath)) {
              // Create relative symlink
              const relativePath = path.relative(path.dirname(symlinkPath), targetPath);
              await fs.symlink(relativePath, symlinkPath);
            }
            continue;
          }

          const mappedSourceFiles = await glob(mapping.from, {
            cwd: targetSourcePath,
            ignore: targetExcludes,
          });

          for (const file of mappedSourceFiles) {
            mappedFiles.add(file);
            const sourceFilePath = path.join(targetSourcePath, file);
            const filename = path.basename(file);

            // Determine destination based on mapping type
            let destinationFilePath: string;
            if (mapping.type === 'header') {
              // Headers go to include/<moduleName>/<to path>
              const headerBasePath = SPMGenerator.getHeaderFilesPath(pkg, product, target);
              // Remove the moduleName suffix since getHeaderFilesPath already adds it
              const headerRootPath = path.dirname(headerBasePath);
              const destPath = mapping.to.replace('{filename}', filename);
              destinationFilePath = path.join(headerRootPath, destPath);
            } else {
              // Source files go to target root/<to path>
              const destPath = mapping.to.replace('{filename}', filename);
              destinationFilePath = path.join(targetDestination, destPath);
            }

            spinner.info(
              `Mapping ${mapping.type} file ${chalk.cyan(file)} → ${chalk.cyan(path.relative(targetDestination, destinationFilePath))}...`
            );

            await fs.ensureDir(path.dirname(destinationFilePath));

            if (mapping.type === 'header') {
              // Copy headers (need actual files for XCFramework composition)
              if (hasFileContentChanged(sourceFilePath, destinationFilePath)) {
                await fs.copy(sourceFilePath, destinationFilePath, { overwrite: true });
              }
            } else {
              // Symlink source files
              if (!fs.existsSync(destinationFilePath)) {
                await fs.symlink(sourceFilePath, destinationFilePath);
              }
            }
          }
        }
      }

      // Use glob to get the source files
      const files = await glob(pattern, { cwd: targetSourcePath, ignore: targetExcludes });

      for (const file of files) {
        // Skip files already handled by fileMapping
        if (mappedFiles.has(file)) {
          continue;
        }

        // Create symlink to source file in the target source folder
        spinner.info(
          `Generating source for target ${chalk.green(target.name)} ${path.basename(file)}...`
        );
        const sourceFilePath = path.join(targetSourcePath, file);
        const destinationFilePath = path.join(targetDestination, file);

        if (!fs.existsSync(destinationFilePath)) {
          await fs.ensureDir(path.dirname(destinationFilePath));
          await fs.symlink(sourceFilePath, destinationFilePath);
        }
      }

      // Header files - only copy if headerPattern is explicitly defined in the config
      // to avoid accidentally pulling in headers from other targets/products
      if (target.headerPattern) {
        const headerFiles = await glob(target.headerPattern, {
          cwd: targetSourcePath,
          ignore: targetExcludes,
        });

        if (headerFiles.length > 0) {
          for (const file of headerFiles) {
            // Skip files already handled by fileMapping
            if (mappedFiles.has(file)) {
              continue;
            }

            const sourceFilePath = path.join(targetSourcePath, file);
            // Flatten destination and copy the file - we don't want a symlink here, since these files will be used
            // when composing the XCFrameworks later - and then we need the actual files present
            const destinationFilePath = path.join(
              SPMGenerator.getHeaderFilesPath(pkg, product, target),
              path.basename(file)
            );

            // Only copy if content changed (preserves mtime for Xcode incremental builds)
            await fs.ensureDir(path.dirname(destinationFilePath));
            if (hasFileContentChanged(sourceFilePath, destinationFilePath)) {
              spinner.info(
                `Copying header file for target ${chalk.green(target.name)} ${path.basename(file)}...`
              );
              await fs.copy(sourceFilePath, destinationFilePath, { overwrite: true });
            }
          }
        }
      }

      // Write custom module.modulemap if specified in the config
      // This is useful for C++ headers that have conflicting type definitions
      if (target.moduleMapContent) {
        const includeDir = path.join(targetDestination, 'include');
        const moduleMapPath = path.join(includeDir, 'module.modulemap');
        await fs.ensureDir(includeDir);
        if (writeFileIfChanged(moduleMapPath, target.moduleMapContent)) {
          spinner.info(
            `Generated custom module.modulemap for target ${chalk.green(target.name)}...`
          );
        }
      }

      // Generate exports file for Swift targets to re-export dependencies
      if (target.type === 'swift') {
        const exportsFilePath = path.join(targetDestination, `${product.name}.swift`);

        // Re-export commonly used Apple frameworks so other files can just `import ProductName`
        const frameworkImports = (target.linkedFrameworks ?? []).map(
          (framework) => `@_exported import ${framework}`
        );

        // Import ObjC module dependencies with @_exported.
        // These are needed for build-time access to types like JavaScriptObject, JavaScriptRuntime, etc.
        // Only include _objc targets (not _cpp) since C++ targets can't be imported by Swift directly.
        const objcDependencyImports = (target.dependencies ?? [])
          .filter((dep) => /_objc$/.test(dep))
          .map((dep) => `@_exported import ${dep}`);

        const allImports = [...frameworkImports, ...objcDependencyImports];
        if (allImports.length > 0) {
          const fileContent = `// Copyright 2022-present 650 Industries. All rights reserved.
// This file is auto-generated by SPMGenerator.ts

${allImports.join('\n')}

// Note: @_exported makes these modules available to any module that imports ${product.name}
// This allows other Swift files in the module to access Foundation, UIKit, and all ObjC types
// without needing to explicitly import them in every file.
`;
          // Only write if content changed (preserves mtime for Xcode incremental builds)
          if (writeFileIfChanged(exportsFilePath, fileContent)) {
            spinner.info(
              `Generated ${product.name}.swift for target ${loggerTitle + '/' + chalk.green(product.name) + '/' + chalk.green(target.name)}...`
            );
          }
        }
      }
      spinner.succeed(`Generated source folder structure for target ${chalk.green(target.name)}.`);
    }
  },

  /**
   * Cleans the generated source code folder for the given package.
   * @param pkg Package
   * @param product Product
   */
  cleanGeneratedSourceCodeFolderAsync: async (
    pkg: SPMPackageSource,
    product: SPMProduct
  ): Promise<void> => {
    logger.info(
      `🧹 Cleaning generated source code for ${chalk.green(pkg.packageName)}/${chalk.green(product.name)}...`
    );

    const sourceCodePath = SPMGenerator.getGeneratedProductFilesPath(pkg, product);
    if (await fs.pathExists(sourceCodePath)) {
      const spinner = createAsyncSpinner(`Removing generated source code folder...`, pkg, product);

      spinner.info(`Removing folder: ${sourceCodePath}...`);
      await fs.remove(sourceCodePath);

      spinner.succeed(`Removed generated source code folder`);
    }
    const packageSwiftPath = SPMGenerator.getSwiftPackagePath(pkg, product);
    if (await fs.pathExists(packageSwiftPath)) {
      const spinner = createAsyncSpinner(`Removing generated Package.swift...`, pkg, product);

      spinner.info(`Removing file: ${packageSwiftPath}...`);

      await fs.remove(packageSwiftPath);
      spinner.succeed(`Removed generated Package.swift`);
    }
  },

  /**
   * Returns the path to where we should place generated files when building the package and the
   * products within it.
   * @param pkg Package
   * @param product Product
   * @returns Path to generated files path
   */
  getGeneratedProductFilesPath: (pkg: SPMPackageSource, product: SPMProduct): string => {
    return path.join(pkg.path, '.build', 'source', pkg.packageName, product.name);
  },

  /**
   * Returns the path to included header files for a given product in the package.
   * @param pkg Package
   * @param product Product
   * @param target Target
   * @returns List of paths to header files
   */
  getHeaderFilesPath: (pkg: SPMPackageSource, product: SPMProduct, target: SPMTarget): string => {
    const productPath = SPMGenerator.getGeneratedProductFilesPath(pkg, product);
    // Use target.moduleName if specified, otherwise fall back to product.name
    // This allows targets to specify their own module name for header organization,
    // which is useful when multiple products share the same target with different module identities
    const moduleName =
      target.type !== 'framework' && target.moduleName ? target.moduleName : product.name;
    // We'll add module name at the end to make sure include lookups work correctly when building
    // our frameworks with SPM - otherwise the include statements in the source files won't resolve correctly
    // since they're in the form of #include <ModuleName/HeaderFile.h>. Flattening the include folders will
    // be performed when we compose the XCFrameworks later.
    return path.join(productPath, target.name, 'include', moduleName);
  },

  /**
   * Returns the path to the target source folder for the given package/product/target.
   * @param pkg  Package
   * @param product Product
   * @param target Target
   * @returns Source code path for the target
   */
  getTargetPath: (pkg: SPMPackageSource, product: SPMProduct, target: SPMTarget): string => {
    const productPath = SPMGenerator.getGeneratedProductFilesPath(pkg, product);
    return path.join(productPath, target.name);
  },

  /**
   * Returns the path to the Package.swift file for the given package. This is placed inside
   * the source folder where we build a source folder structure that fits the SPM requirements.
   * @param pkg Package
   * @param product Product
   * @returns string
   */
  getSwiftPackagePath: (pkg: SPMPackageSource, product: SPMProduct): string => {
    const productPath = SPMGenerator.getGeneratedProductFilesPath(pkg, product);
    return path.join(productPath, 'Package.swift');
  },
};
