import chalk from 'chalk';
import fs from 'fs-extra';
import { glob } from 'glob';
import path from 'path';

import { Package } from '../Packages';
import { BuildFlavor } from './Prebuilder.types';
import { SPMProduct, SPMTarget } from './SPMConfig.types';
import { SPMPackage } from './SPMPackage';
import { createAsyncSpinner } from './Utils';
import logger from '../Logger';

export const SPMGenerator = {
  /**
   * Generates a Package.swift file for the given node package.
   * @param pkg Package
   * @param product Product
   * @param buildType Build type (e.g., Debug, Release)
   */
  genereateSwiftPackageAsync: async (
    pkg: Package,
    product: SPMProduct,
    buildType: BuildFlavor
  ): Promise<void> => {
    logger.info(
      `📦 Generating Package.swift for ${chalk.green(pkg.packageName)}/${chalk.green(product.name)}...`
    );
    // Use SPMPackage to generate Package.swift
    const packageSwiftPath = SPMGenerator.getSwiftPackagePath(pkg, product);
    const targetSourceCodePath = SPMGenerator.getGeneratedProductFilesPath(pkg, product);
    await SPMPackage.writePackageSwiftAsync(
      pkg,
      product,
      buildType,
      packageSwiftPath,
      targetSourceCodePath
    );
  },

  /**
   * Copies source files to the appropriate location for the given product in the package.
   * This is done so that we can keep the legacy source file structure intact while taking
   * advantage of building using Swift Package Manager that needs to be isolated per target.
   * @param pkg Package
   * @param product Product
   */
  generateIsolatedSourcesForTargetsAsync: async (pkg: Package, product: SPMProduct) => {
    const spmConfig = pkg.getSwiftPMConfiguration();

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

      // Use glob to get the source files
      const files = await glob(pattern, { cwd: targetSourcePath, ignore: targetExcludes });

      for (const file of files) {
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
            spinner.info(
              `Generating header files for target ${chalk.green(target.name)} ${path.basename(file)}...`
            );
            const sourceFilePath = path.join(targetSourcePath, file);
            // Flatten destination and copy the file - we don't want a symlink here, since these files will be used
            // when composing the XCFrameworks later - and then we need the actual files present
            const destinationFilePath = path.join(
              SPMGenerator.getHeaderFilesPath(pkg, product, target),
              path.basename(file)
            );

            if (!fs.existsSync(destinationFilePath)) {
              await fs.ensureDir(path.dirname(destinationFilePath));
              await fs.copy(sourceFilePath, destinationFilePath);
            }
          }
        }
      }

      // Generate exports file for Swift targets to re-export dependencies
      if (target.type === 'swift') {
        const exportsFilePath = path.join(targetDestination, `${product.name}.swift`);
        if (!fs.existsSync(exportsFilePath)) {
          spinner.info(
            `Generating ${product.name}.swift for target ${loggerTitle + '/' + chalk.green(product.name) + '/' + chalk.green(target.name)}...`
          );

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
            await fs.writeFile(exportsFilePath, fileContent, 'utf-8');
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
  cleanGeneratedSourceCodeFolderAsync: async (pkg: Package, product: SPMProduct): Promise<void> => {
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
  getGeneratedProductFilesPath: (pkg: Package, product: SPMProduct): string => {
    return path.join(pkg.path, '.build', 'source', pkg.packageName, product.name);
  },

  /**
   * Returns the path to included header files for a given product in the package.
   * @param pkg Package
   * @param product Product
   * @param target Target
   * @returns List of paths to header files
   */
  getHeaderFilesPath: (pkg: Package, product: SPMProduct, target: SPMTarget): string => {
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
  getTargetPath: (pkg: Package, product: SPMProduct, target: SPMTarget): string => {
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
  getSwiftPackagePath: (pkg: Package, product: SPMProduct): string => {
    const productPath = SPMGenerator.getGeneratedProductFilesPath(pkg, product);
    return path.join(productPath, 'Package.swift');
  },
};
