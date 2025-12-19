import fs from 'fs-extra';
import ora from 'ora';
import path from 'path';

import Logger from '../Logger';
import { Package } from '../Packages';
import { BuildFlavor } from './Prebuilder.types';
import { getBuildPlatformsFromProductPlatform, SPMBuild } from './SPMBuild';
import { BuiltFramework } from './SPMBuild.types';
import { BuildPlatform, SPMConfig, SPMProduct, getTargetByName } from './SPMConfig.types';
import { SPMGenerator } from './SPMGenerator';
import { spawnXcodeBuildWithSpinner } from './XCodeRunner';

export const Frameworks = {
  /**
   * Composes an XCFramework from the given built frameworks.
   * TODO: Signing of the frameworks if needed.
   * @param pkg Package
   * @param buildType Build flavor (Debug or Release)
   * @param options Options including platform and product name
   */
  composeXCFrameworkFromBuiltFrameworksAsync: async (
    pkg: Package,
    buildType: BuildFlavor,
    options?: {
      platform?: BuildPlatform;
      productName?: string;
    }
  ): Promise<void> => {
    const spmConfig = await pkg.getSwiftPMConfigurationAsync();
    if (!spmConfig) {
      throw new Error(`No SwiftPM configuration found for package: ${pkg.packageName}`);
    }

    for (const product of spmConfig.products) {
      if (options?.productName && product.name !== options.productName) {
        continue;
      }

      Logger.info(`🧩 Composing XCFramework for ${product.name}...`);

      // Get output path for the XCFramework
      const xcframeworkOutputPath = Frameworks.getFrameworkPath(pkg, product, buildType);

      // Resolve build platforms
      const allBuildPlatforms: BuildPlatform[] = [];
      for (const spmPlatform of spmConfig.platforms) {
        // Expand platforns: iOS(.v15) -> [iOS, iOS Simulator] and filter on the platforms requested
        const buildPlatforms = getBuildPlatformsFromProductPlatform(spmPlatform).filter(
          (platform) => !options?.platform || platform === options.platform
        );
        allBuildPlatforms.push(...buildPlatforms);
      }

      const frameworks: BuiltFramework[] = [];

      // Create output folder for the product
      for (const buildPlatform of allBuildPlatforms) {
        // Skip platform if a specific platform is requested
        if (options?.platform && buildPlatform !== options.platform) {
          continue;
        }

        frameworks.push({
          symbolsBundlePath: SPMBuild.getProductSymbolsBundleArtifactsPath(
            pkg,
            product,
            buildType,
            buildPlatform
          ),
          frameworkPath: SPMBuild.getProductFrameworkArtifactsPath(
            pkg,
            product,
            buildType,
            buildPlatform
          ),
          product,
          buildType,
        });
      }

      // Compose the XCFramework folder structure using XCode
      const slices = await composeFrameworkWithXCodeAsync(
        pkg,
        product,
        frameworks,
        xcframeworkOutputPath
      );

      // Collect and copy header files
      const collectedHeaderFiles = await collectAndCopyHeaderFilesFromBuiltFrameworksAsync(
        pkg,
        spmConfig,
        product,
        xcframeworkOutputPath
      );

      // Check if this product has a Swift target
      const hasSwiftTarget = product.targets.some((targetName) => {
        const target = getTargetByName(spmConfig, targetName);
        return target?.type === 'swift';
      });

      // Propagate headers down to each framework slice (slices)
      const sourceHeadersPath = path.join(xcframeworkOutputPath, 'Headers');

      for (const slice of slices) {
        const slicePath = path.join(xcframeworkOutputPath, slice, product.name + '.framework');

        const destHeadersPath = path.join(slicePath, 'Headers');
        await fs.mkdirp(destHeadersPath);
        await fs.copy(sourceHeadersPath, destHeadersPath);

        // Create module.modulemap and umbrella header file for each slice
        await createModuleMapWithUmbrellaHeaderFilesAsync(
          slicePath,
          product.name,
          collectedHeaderFiles,
          hasSwiftTarget
        );

        // Copy the generated ObjC header for Swift types (ProductName-Swift.h)
        if (hasSwiftTarget) {
          await copyGeneratedObjCSwiftHeaderAsync(pkg, spmConfig, product, slice, slicePath);
        }

        // Copy Swift module interfaces if this product has a Swift target
        await copySwiftModuleInterfacesAsync(pkg, spmConfig, product, buildType, slice, slicePath);
      }

      // remove the toplevel Headers directory as it's no longer needed
      await fs.remove(sourceHeadersPath);
    }
  },

  /**
   * Gets the output path for frameworks for the given package.
   * @param pkg Package information
   * @param buildType Build flavor
   * @returns Output path for frameworks
   */
  getFrameworksOutputPath: (pkg: Package, buildType: BuildFlavor): string => {
    // Find the Podspec path - an xcframework needs to be located at the same level as the podspec file.
    if (!pkg.podspecPath) {
      throw new Error(`Package ${pkg.packageName} does not have a podspec path defined.`);
    }

    return path.join(
      pkg.path,
      path.dirname(pkg.podspecPath),
      '.xcframeworks',
      buildType.toLowerCase()
    );
  },

  /**
   * Returns the full path to the built XCFramework for the given product.
   * @param pkg Package
   * @param product SPM product
   * @param buildType Build flavor
   * @returns Full path to the built XCFramework
   */
  getFrameworkPath: (pkg: Package, product: SPMProduct, buildType: BuildFlavor): string => {
    return path.join(
      Frameworks.getFrameworksOutputPath(pkg, buildType),
      `${product.name}.xcframework`
    );
  },
};

/**
 * Creates a module.modulemap file and umbrella header for the given framework slice.
 * For Swift-only frameworks (no ObjC headers), the umbrella header is skipped and the
 * module map only includes the -Swift.h header for ObjC consumers.
 * @param frameworkSlicePath Path to the framework slice
 * @param productName Name of the product/framework
 * @param umbrellaHeaderFiles Collected umbrella header files (full paths)
 * @param hasSwiftTarget Whether this product has a Swift target
 */
const createModuleMapWithUmbrellaHeaderFilesAsync = async (
  frameworkSlicePath: string,
  productName: string,
  umbrellaHeaderFiles: string[],
  hasSwiftTarget: boolean = false
): Promise<void> => {
  const hasObjCHeaders = umbrellaHeaderFiles.length > 0;

  // If no ObjC headers and no Swift target, nothing to generate
  if (!hasObjCHeaders && !hasSwiftTarget) {
    return;
  }

  const umbrellaName = `${productName}_umbrella.h`;

  // Build the module map content
  let moduleMapContent = `framework module ${productName} {\n`;

  // Only include umbrella header if we have ObjC headers
  if (hasObjCHeaders) {
    moduleMapContent += `    umbrella header "${umbrellaName}"\n`;
  }

  // If there's a Swift target, we need to include the generated Swift header
  // so @objc Swift classes are visible when importing the module from ObjC
  if (hasSwiftTarget) {
    moduleMapContent += `    header "${productName}-Swift.h"\n`;
  }

  moduleMapContent += `
    export *`;

  // Only add inferred submodules when we have an umbrella header
  // The `module * { export * }` syntax requires an umbrella to enumerate submodules from
  if (hasObjCHeaders) {
    moduleMapContent += `
    module * { export * }`;
  }

  moduleMapContent += `
}
`;

  const moduleMapPath = path.join(frameworkSlicePath, 'Modules', 'module.modulemap');
  await fs.mkdirp(path.dirname(moduleMapPath));
  await fs.writeFile(moduleMapPath, moduleMapContent, 'utf8');

  // Create the umbrella header file only if we have ObjC headers
  if (hasObjCHeaders) {
    // Use only the basename since headers are flattened into the Headers directory
    const umbrellaHeaderContent = umbrellaHeaderFiles
      .map((headerFile) => `#include "${path.basename(headerFile)}"`)
      .join('\n');

    const umbrellaHeaderPath = path.join(frameworkSlicePath, 'Headers', `${umbrellaName}`);
    await fs.writeFile(umbrellaHeaderPath, umbrellaHeaderContent, 'utf8');
  }
};

/**
 * Composes the XCFramework using xcodebuild.
 * @param pkg Package information
 * @param product SPM product information
 * @param frameworks Built frameworks to include
 * @param outputFrameworkPath Output path for the composed XCFramework
 */
const composeFrameworkWithXCodeAsync = async (
  pkg: Package,
  product: SPMProduct,
  frameworks: BuiltFramework[],
  outputFrameworkPath: string
): Promise<string[]> => {
  // Clean output directory
  await fs.remove(outputFrameworkPath);
  await fs.mkdirp(path.dirname(outputFrameworkPath));

  // Run XCode build command with formatted output
  // Pair each framework with its debug symbols to avoid dSYM name collisions
  const args = [
    `-create-xcframework`,
    ...frameworks.flatMap((framework) => [
      '-framework',
      framework.frameworkPath,
      '-debug-symbols',
      framework.symbolsBundlePath,
    ]),
    `-output`,
    outputFrameworkPath,
  ];

  const { code, error: buildError } = await spawnXcodeBuildWithSpinner(
    args,
    pkg.path,
    `Building ${product.name}.xcframework`
  );

  if (code !== 0) {
    throw new Error(
      `xcodebuild failed with code ${code}:\n${buildError}\n\nxcodebuild ${args.join(' ')}`
    );
  }

  // Find slices in the composed XCFramework - they are the folders inside the .xcframework
  // remember to return only directories, not files - and return their names.
  return (await fs.readdir(outputFrameworkPath)).filter((name) => {
    const fullPath = path.join(outputFrameworkPath, name);
    return fs.statSync(fullPath).isDirectory();
  });
};

/**
 * Collects header files for the given product. The function uses the product definition's
 * include files to locate and copy the headers into the XCFramework's Headers directory.
 * @param pkg Package information
 * @param spmConfig SPM configuration
 * @param product SPM product information
 * @returns Collected header file paths
 */
const collectAndCopyHeaderFilesFromBuiltFrameworksAsync = async (
  pkg: Package,
  spmConfig: SPMConfig,
  product: SPMProduct,
  frameworkOutputPath: string
) => {
  const spinner = ora({
    text: `Collecting header files for ${product.name}`,
    prefixText: '  ',
  }).start();

  spinner.text = `Copying header files for ${product.name}`;

  // Create headers directory inside the XCFramework output path
  const frameworkHeadersPath = path.join(frameworkOutputPath, 'Headers');
  await fs.mkdirp(frameworkHeadersPath);

  // Get header files and copy them to the Headers directory
  const headerFilesCollected: string[] = [];
  for (const targetName of product.targets) {
    const target = getTargetByName(spmConfig, targetName);
    if (!target || target.type === 'swift') {
      continue;
    }
    const targetHeaderFilesPath = SPMGenerator.getHeaderFilesPath(pkg, product, target);
    const headerFiles = await fs.readdir(targetHeaderFilesPath);
    headerFilesCollected.push(...headerFiles.map((f) => path.join(targetHeaderFilesPath, f)));
    for (const headerFile of headerFiles) {
      const sourceHeaderFilePath = path.join(targetHeaderFilesPath, headerFile);
      const destHeaderFilePath = path.join(frameworkHeadersPath, headerFile);
      await fs.copy(sourceHeaderFilePath, destHeaderFilePath);
    }
  }

  spinner.succeed(`Copied header files for ${product.name}`);

  return headerFilesCollected;
};

/**
 * Maps xcframework slice names to xcodebuild build folder prefixes
 */
const sliceToBuildFolderPrefix: Record<string, string> = {
  'ios-arm64': 'iphoneos',
  'ios-arm64_x86_64-simulator': 'iphonesimulator',
  'macos-arm64_x86_64': 'macosx',
  'tvos-arm64': 'appletvos',
  'tvos-arm64_x86_64-simulator': 'appletvsimulator',
};

/**
 * Copies the generated ObjC header for Swift types (ProductName-Swift.h) from the build output
 * into the xcframework slice. This header exposes @objc Swift classes/methods to ObjC/C++ code.
 * @param pkg Package information
 * @param spmConfig SPM configuration
 * @param product SPM product information
 * @param slice The xcframework slice name (e.g., "ios-arm64")
 * @param slicePath Path to the framework inside the slice
 */
const copyGeneratedObjCSwiftHeaderAsync = async (
  pkg: Package,
  spmConfig: SPMConfig,
  product: SPMProduct,
  slice: string,
  slicePath: string
): Promise<void> => {
  const spinner = ora({
    text: `Copying generated ObjC Swift header for ${product.name} (${slice})`,
    prefixText: '  ',
  }).start();

  // Map slice name to build folder prefix
  const buildFolderPrefix = sliceToBuildFolderPrefix[slice];
  if (!buildFolderPrefix) {
    spinner.warn(`Unknown xcframework slice: ${slice}, skipping ObjC Swift header copy`);
    return;
  }

  // The header is generated in the Intermediates/GeneratedModuleMaps directory
  const generatedObjCHeaderName = `${product.name}-Swift.h`;
  const generatedModuleMapsPath = path.join(
    SPMBuild.getPackageBuildPath(pkg),
    'Build',
    'Intermediates.noindex',
    `GeneratedModuleMaps-${buildFolderPrefix}`,
    generatedObjCHeaderName
  );

  if (!(await fs.pathExists(generatedModuleMapsPath))) {
    spinner.warn(`Generated ObjC Swift header not found at ${generatedModuleMapsPath}`);
    return;
  }

  // Copy to Headers directory
  const destObjCHeaderPath = path.join(slicePath, 'Headers', generatedObjCHeaderName);
  await fs.copy(generatedModuleMapsPath, destObjCHeaderPath);

  // Post-process the header to remove internal SPM module imports
  await fixObjCSwiftHeaderModuleReferencesAsync(destObjCHeaderPath, spmConfig);

  spinner.succeed(`Copied generated ObjC Swift header: ${generatedObjCHeaderName}`);
};

/**
 * Copies Swift module interface files (.swiftinterface, .swiftmodule, etc.) from the build output
 * into the xcframework slice. This is required for other Swift modules to import this framework.
 * The Swift target should have the same name as the product for proper module naming.
 * @param pkg Package information
 * @param spmConfig SPM configuration
 * @param product SPM product information
 * @param buildType Build flavor
 * @param slice The xcframework slice name (e.g., "ios-arm64")
 * @param slicePath Path to the framework inside the slice
 */
const copySwiftModuleInterfacesAsync = async (
  pkg: Package,
  spmConfig: SPMConfig,
  product: SPMProduct,
  buildType: BuildFlavor,
  slice: string,
  slicePath: string
): Promise<void> => {
  const spinner = ora({
    text: `Copying Swift module interfaces for ${product.name} (${slice})`,
    prefixText: '  ',
  }).start();

  // Find Swift target in the product - it should have the same name as the product
  const swiftTarget = product.targets
    .map((targetName) => getTargetByName(spmConfig, targetName))
    .find((target) => target?.type === 'swift');

  if (!swiftTarget) {
    // No Swift target in this product, nothing to copy
    spinner.info(`No Swift target in ${product.name}, skipping Swift module copy`);
    return;
  }

  // Map slice name to build folder prefix
  const buildFolderPrefix = sliceToBuildFolderPrefix[slice];
  if (!buildFolderPrefix) {
    spinner.warn(`Unknown xcframework slice: ${slice}, skipping Swift module copy`);
    return;
  }

  // Construct path to the built swiftmodule directory
  // The swiftmodule is named after the Swift target (which should match the product name)
  const buildProductsPath = path.join(
    SPMBuild.getPackageBuildPath(pkg),
    'Build',
    'Products',
    `${buildType}-${buildFolderPrefix}`
  );

  const sourceSwiftModulePath = path.join(buildProductsPath, `${swiftTarget.name}.swiftmodule`);

  if (!(await fs.pathExists(sourceSwiftModulePath))) {
    spinner.warn(
      `Swift module not found at ${sourceSwiftModulePath}, skipping swiftinterface copy`
    );
    spinner.succeed(`Copied Swift module interfaces for ${product.name} (${slice})`);
    return;
  }

  // Destination path: Framework/Modules/ProductName.swiftmodule
  const destSwiftModulePath = path.join(slicePath, 'Modules', `${product.name}.swiftmodule`);
  await fs.mkdirp(destSwiftModulePath);

  // Copy all files from the source swiftmodule directory
  const swiftModuleFiles = await fs.readdir(sourceSwiftModulePath);
  for (const file of swiftModuleFiles) {
    const sourceFile = path.join(sourceSwiftModulePath, file);

    // Skip directories (like Project/)
    if ((await fs.stat(sourceFile)).isDirectory()) {
      continue;
    }

    // Skip binary .swiftmodule files - they are compiler-version specific and contain
    // hardcoded internal SPM module references. For distributable frameworks built with
    // BUILD_LIBRARY_FOR_DISTRIBUTION=YES, only the textual .swiftinterface files should
    // be included as they support library evolution and cross-compiler compatibility.
    if (file.endsWith('.swiftmodule')) {
      continue;
    }

    // Copy files as-is since the directory name determines the module name
    const destFile = path.join(destSwiftModulePath, file);
    await fs.copy(sourceFile, destFile);

    // Post-process .swiftinterface files to fix internal module references
    if (file.endsWith('.swiftinterface')) {
      await fixSwiftInterfaceModuleReferencesAsync(destFile, spmConfig);
    }
  }

  spinner.succeed(`Copied Swift module interfaces for ${product.name} (${slice})`);
};

/**
 * Post-processes a .swiftinterface file to:
 * 1. Remove React imports (React.xcframework has VFS overlay issues that prevent module loading)
 * 2. Remap internal SPM target names to their product names
 *    (e.g., ExpoModulesCore_ios_objc -> ExpoModulesCore)
 *
 * @param swiftInterfaceFilePath Path to the .swiftinterface file
 * @param spmConfig SPM configuration containing product/target mappings
 */
const fixSwiftInterfaceModuleReferencesAsync = async (
  swiftInterfaceFilePath: string,
  spmConfig: SPMConfig
): Promise<void> => {
  // Build a mapping from internal target names to their parent product names
  const targetToProductMap = new Map<string, string>();

  for (const product of spmConfig.products) {
    for (const targetName of product.targets) {
      targetToProductMap.set(targetName, product.name);
    }
  }

  // Read the swiftinterface file
  let content = await fs.readFile(swiftInterfaceFilePath, 'utf8');
  let modified = false;

  // Remove React imports - React.xcframework has VFS overlays that cause issues
  // when Swift tries to load the module at import time
  const reactImportPatterns = [/^@_exported import React\s*$/gm, /^import React\s*$/gm];
  for (const pattern of reactImportPatterns) {
    const replaced = content.replace(pattern, '// Removed: import React');
    if (replaced !== content) {
      content = replaced;
      modified = true;
    }
  }

  // Remap internal SPM target imports to product names
  // e.g., @_exported import ExpoModulesCore_ios_objc -> @_exported import ExpoModulesCore
  for (const [targetName, productName] of targetToProductMap) {
    if (targetName === productName) {
      continue; // Skip targets that have same name as product
    }

    // Replace @_exported import statements
    const exportedImportPattern = new RegExp(`^@_exported import ${targetName}\\s*$`, 'gm');
    const exportedReplaced = content.replace(
      exportedImportPattern,
      `@_exported import ${productName}`
    );
    if (exportedReplaced !== content) {
      content = exportedReplaced;
      modified = true;
    }

    // Replace regular import statements
    const importPattern = new RegExp(`^import ${targetName}\\s*$`, 'gm');
    const importReplaced = content.replace(importPattern, `import ${productName}`);
    if (importReplaced !== content) {
      content = importReplaced;
      modified = true;
    }

    // Replace module-qualified type references
    // e.g., ExpoModulesCore_ios_objc.TypeName -> ExpoModulesCore.TypeName
    const qualifiedPattern = new RegExp(`\\b${targetName}\\.`, 'g');
    const qualifiedReplaced = content.replace(qualifiedPattern, `${productName}.`);
    if (qualifiedReplaced !== content) {
      content = qualifiedReplaced;
      modified = true;
    }
  }

  // Write back if modified
  if (modified) {
    await fs.writeFile(swiftInterfaceFilePath, content, 'utf8');
  }
};

/**
 * Post-processes a generated ProductName-Swift.h header to remove or fix internal SPM
 * module imports. The generated header may contain @import statements for internal SPM
 * target modules (e.g., @import ExpoModulesCore_ios_objc) that don't exist when the
 * framework is consumed via CocoaPods.
 *
 * @param swiftHeaderPath Path to the ProductName-Swift.h file
 * @param spmConfig SPM configuration containing product/target mappings
 */
const fixObjCSwiftHeaderModuleReferencesAsync = async (
  swiftHeaderPath: string,
  spmConfig: SPMConfig
): Promise<void> => {
  // Build a mapping from internal target names to their parent product names
  const targetToProductMap = new Map<string, string>();

  for (const product of spmConfig.products) {
    for (const targetName of product.targets) {
      targetToProductMap.set(targetName, product.name);
    }
  }

  // Determine which product this header belongs to based on its path
  const pathParts = swiftHeaderPath.split('/');
  const frameworkName = pathParts.find((p) => p.endsWith('.framework'))?.replace('.framework', '');
  const currentProduct = frameworkName || '';

  // Read the header file
  let content = await fs.readFile(swiftHeaderPath, 'utf8');
  let modified = false;

  // Remove @import statements for internal SPM targets
  // These modules don't exist when consumed via CocoaPods
  for (const [targetName, productName] of targetToProductMap) {
    if (targetName === productName) {
      continue; // Skip targets that have same name as product
    }

    // Match @import TargetName; statements
    const importPattern = new RegExp(`^@import ${targetName};\\s*$`, 'gm');
    if (productName === currentProduct) {
      // Same framework - just remove the import, the types are already available
      const replaced = content.replace(
        importPattern,
        `// Removed internal target import: ${targetName}`
      );
      if (replaced !== content) {
        content = replaced;
        modified = true;
      }
    } else {
      // Different framework - replace with import of the product module
      const replaced = content.replace(importPattern, `@import ${productName};`);
      if (replaced !== content) {
        content = replaced;
        modified = true;
      }
    }
  }

  // Remove @import React - React.xcframework has VFS overlays that cause issues
  const reactImportPattern = /^@import React;\s*$/gm;
  const reactReplaced = content.replace(reactImportPattern, '// Removed: @import React;');
  if (reactReplaced !== content) {
    content = reactReplaced;
    modified = true;
  }

  // Write back if modified
  if (modified) {
    await fs.writeFile(swiftHeaderPath, content, 'utf8');
  }
};
