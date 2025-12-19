import chalk from 'chalk';
import fs from 'fs-extra';
import { glob } from 'glob';
import ora from 'ora';
import path from 'path';

import { Package } from '../Packages';
import { BuildFlavor } from './Prebuilder.types';
import logger from '../Logger';
import { SPMProduct, SPMTarget } from './SPMConfig.types';
import { SPMPackage } from './SPMPackage';

export const SPMGenerator = {
  /**
   * Generates a Package.swift file for the given node package.
   * @param pkg Package
   * @param buildType Build type (e.g., Debug, Release)
   * @param productTargets Record of product names to their target definitions
   */
  genereateSwiftPackageAsync: async (
    pkg: Package,
    buildType: BuildFlavor,
    productTargets: Record<string, string[]>
  ): Promise<void> => {
    // Use SPMPackage to generate Package.swift
    const packageSwiftPath = SPMGenerator.getSwiftPackagePath(pkg);
    await SPMPackage.writePackageSwiftAsync(pkg, buildType, packageSwiftPath);
  },

  /**
   * Copies source files to the appropriate location for the given product in the package.
   * This is done so that we can keep the legacy source file structure intact while taking
   * advantage of building using Swift Package Manager.
   * @param pkg Package
   */
  generateSourceCodeFolderAsync: async (pkg: Package) => {
    const spmConfig = await pkg.getSwiftPMConfigurationAsync();
    if (!spmConfig) {
      throw new Error(`No SwiftPM configuration found for package ${pkg.packageName}`);
    }

    const loggerTitle = `${chalk.green(pkg.packageName)}`;
    logger.info(`📂 Generating temporary isolated code tree for ${loggerTitle}`);

    const sourceCodePath = SPMGenerator.getSourceTargetPath(pkg);
    await fs.ensureDir(sourceCodePath);

    // Build a map of target name to target definition for quick lookup
    const targetMap = new Map<string, SPMTarget>();
    for (const target of spmConfig.targets) {
      targetMap.set(target.name, target);
    }

    // Walk through all products and their targets, collecting source files to copy into spm code structure
    const targets: Record<string, string[]> = {};

    for (const productEntry of spmConfig.products) {
      const spinner = ora({ prefixText: '  ' }).start();

      // Create product folder in source code path
      const productPath = path.join(sourceCodePath, productEntry.name);
      await fs.ensureDir(productPath);

      const productTargets: string[] = [];

      for (const targetName of productEntry.targets) {
        const target = targetMap.get(targetName);
        if (!target) {
          spinner.warn(`Target '${targetName}' not found in configuration, skipping...`);
          continue;
        }

        spinner.text = `Generating source for target ${loggerTitle + '/' + chalk.green(productEntry.name) + '/' + chalk.green(target.name)}...`;

        // Ensure target is a source target!
        if (target.type === 'framework') {
          continue;
        }

        const targetDestination = path.join(productPath, target.name);
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

        // Track whether we've created the Exports.swift for this target (only one per target)
        let exportsCreated = false;

        for (const file of files) {
          // Create symlink to source file in the target source folder
          spinner.text = `Generating source for target ${chalk.green(target.name)} ${path.basename(file)}...`;
          const sourceFilePath = path.join(targetSourcePath, file);
          const destinationFilePath = path.join(targetDestination, file);

          if (!fs.existsSync(destinationFilePath)) {
            await fs.ensureDir(path.dirname(destinationFilePath));
            if (!exportsCreated && target.type === 'swift') {
              // Create a single Exports.swift at the target root (not in every subdirectory)
              const swiftWExportsFilePath = path.join(targetDestination, 'Exports.swift');
              if (!fs.existsSync(swiftWExportsFilePath)) {
                // Import ObjC module dependencies with @_exported.
                // These are needed for build-time access to types like JavaScriptObject, JavaScriptRuntime, etc.
                // Only include _objc targets (not _cpp) since C++ targets can't be imported by Swift.
                const objcDependencyImports = (target.dependencies ?? [])
                  .filter((dep) => /_objc$/.test(dep))
                  .map((dep) => `@_exported import ${dep}`);

                // Also export linked frameworks (like Combine, SwiftUI) so that types from these
                // frameworks are properly available for public conformances throughout the module.
                // Without this, Swift complains about "aliases" when using types like ObservableObject.
                const frameworkImports = (target.linkedFrameworks ?? []).map(
                  (framework) => `@_exported import ${framework}`
                );

                const allImports = [...frameworkImports, ...objcDependencyImports];
                if (allImports.length > 0) {
                  await fs.writeFile(swiftWExportsFilePath, allImports.join('\n'), 'utf-8');
                }
              }
              exportsCreated = true;
            }

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
              spinner.text = `Generating include files for target ${chalk.green(target.name)} ${path.basename(file)}...`;
              const sourceFilePath = path.join(targetSourcePath, file);
              // Flatten destination and copy the file - we don't want a symlink here, since these files will be used
              // when composing the XCFrameworks later - and then we need the actual files present
              const destinationFilePath = path.join(
                SPMGenerator.getHeaderFilesPath(pkg, productEntry, target),
                path.basename(file)
              );
              if (!fs.existsSync(destinationFilePath)) {
                await fs.ensureDir(path.dirname(destinationFilePath));
                await fs.copy(sourceFilePath, destinationFilePath);
              }
            }
          }
        }

        // For Swift targets, we would normally generate a bridging header, but SPM automatically
        // makes ObjC modules importable when Swift depends on them. The bridging header approach
        // causes cyclic module dependency errors because the ObjC headers use angle-bracket
        // includes which trigger Clang module building.
        //
        // Instead, Swift code should use `import ModuleName` to access ObjC types from dependencies.
        // This requires the Swift files to be updated to use proper imports.
        const bridgingHeaderPath: string | undefined = undefined;

        // Now let's create a target for the Package.swift file to pick up source and header files
        // from the temp source folder structure
        const targetDependencies = [...(target.dependencies || [])];

        // Include includeDirectories for ObjC/C++ targets that have headers
        const hasHeaders =
          !!target.headerPattern && (target.type === 'objc' || target.type === 'cpp');

        productTargets.push(`  ${target.type === 'cpp' ? 'CPPTarget' : target.type === 'objc' ? 'ObjCTarget' : 'SwiftTarget'}(
          name: "${target.name}",
          dependencies: [${targetDependencies.map((dep) => `"${dep}"`).join(', ')}],
          path: "${path.relative(pkg.path, targetDestination)}",
          ${hasHeaders ? 'includeDirectories: ["include"],' : ''}${
            (target.type === 'objc' || target.type === 'cpp') && target.useIncludesFrom
              ? `useIncludesFrom: [${target.useIncludesFrom.map((include) => `"${include}"`).join(', ')}], `
              : ''
          }linkedFrameworks: [ ${(target.linkedFrameworks || []).map((framework) => `"${framework}"`).join(', ')} ]${
            target.type === 'swift' && bridgingHeaderPath
              ? `,
          bridgingHeader: "${bridgingHeaderPath}"`
              : ''
          }
      )`);
      }

      targets[productEntry.name] = productTargets;

      spinner.succeed(
        `Generated a temporary isolated code tree for ${chalk.green(loggerTitle) + '/' + chalk.green(productEntry.name)}`
      );
    }

    return targets;
  },

  /**
   * Cleans the generated source code folder for the given package.
   * @param pkg Package
   */
  cleanGeneratedSourceCodeFolderAsync: async (pkg: Package): Promise<void> => {
    const sourceCodePath = SPMGenerator.getSourceTargetPath(pkg);
    if (await fs.pathExists(sourceCodePath)) {
      logger.info(`🧹 Cleaning generated source code folder for ${chalk.green(pkg.packageName)}`);
      await fs.remove(sourceCodePath);
    }
    const packageSwiftPath = SPMGenerator.getSwiftPackagePath(pkg);
    if (await fs.pathExists(packageSwiftPath)) {
      logger.info(`🧹 Cleaning generated Package.swift for ${chalk.green(pkg.packageName)}`);
      await fs.remove(packageSwiftPath);
    }
  },

  /**
   * Returns the path to where we should place source files when building the package.
   * @param pkg Package
   * @returns Path to source path
   */
  getSourceTargetPath: (pkg: Package): string => {
    return path.join(pkg.path, '.build', 'source', pkg.packageName);
  },

  /**
   * Returns the path to included header files for a given product in the package.
   * @param pkg Package
   * @param product Product
   * @param target Target
   * @returns List of paths to header files
   */
  getHeaderFilesPath: (pkg: Package, product: SPMProduct, target: SPMTarget): string => {
    const productPath = SPMGenerator.getProductPath(pkg, product.name);
    // We'll add product name at the end to make sure include lookups work correctly when building
    // our frameworks with SPM - otherwise the include statements in the source files won't resolve correctly
    // since they're in the form of #include <ProductName/HeaderFile.h>. Flattening the include folders will
    // be performed when we compose the XCFrameworks later.
    return path.join(productPath, target.name, 'include', product.name);
  },

  /**
   * Returns the path to the Package.swift file for the given package. This is placed inside
   * the source folder where we build a source folder structure that fits the SPM requirements.
   * @param pkg Package
   * @returns string
   */
  getSwiftPackagePath: (pkg: Package): string => {
    return path.join(pkg.path, 'Package.swift');
  },

  /**
   * Returns the path to the product source folder for the given package and product.
   * @param pkg Package
   * @param productName Product name
   * @returns Path to product source folder
   */
  getProductPath: (pkg: Package, productName: string): string => {
    return path.join(SPMGenerator.getSourceTargetPath(pkg), productName);
  },
};
