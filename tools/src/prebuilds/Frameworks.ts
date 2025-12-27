import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';

import logger from '../Logger';
import { Package } from '../Packages';
import { BuildFlavor } from './Prebuilder.types';
import { getBuildPlatformsFromProductPlatform, SPMBuild } from './SPMBuild';
import { BuiltFramework } from './SPMBuild.types';
import { BuildPlatform, SPMConfig, SPMProduct } from './SPMConfig.types';
import { SPMGenerator } from './SPMGenerator';
import { createAsyncSpinner, SpinnerError } from './Utils';
import { spawnXcodeBuildWithSpinner } from './XCodeRunner';

export const Frameworks = {
  /**
   * Composes an XCFramework from the given built frameworks.
   * TODO: Signing of the frameworks if needed.
   * @param pkg Package
   * @param product SPM product
   * @param buildType Build flavor (Debug or Release)
   * @param platform Optional platform to filter on
   */
  composeXCFrameworkAsync: async (
    pkg: Package,
    product: SPMProduct,
    buildType: BuildFlavor,
    platform?: BuildPlatform
  ): Promise<void> => {
    const spmConfig = pkg.getSwiftPMConfiguration();

    logger.info(
      `🧩 Composing XCFramework for ${chalk.green(pkg.packageName) + '/' + chalk.green(product.name)}...`
    );

    // Get output path for the XCFramework
    const xcframeworkOutputPath = Frameworks.getFrameworkPath(pkg.path, product.name, buildType);

    // Collect frameworks for each build platform
    const frameworks = collectFrameworksForProduct(pkg, product, buildType, platform);

    // Compose the XCFramework folder structure using XCode
    const slices = await composeFrameworkWithXCodeAsync(
      pkg,
      product,
      frameworks,
      xcframeworkOutputPath
    );

    // Collect and copy header files
    const { headerFiles: collectedHeaderFiles, targetModuleNames } =
      await collectAndCopyHeaderFilesFromBuiltFrameworksAsync(pkg, product, xcframeworkOutputPath);

    // Check if this product has a Swift target
    const hasSwiftTarget = product.targets.some((target) => target?.type === 'swift');

    // Process each slice: copy headers, create module maps, and handle Swift interfaces
    await processXCFrameworkSlices(
      pkg,
      spmConfig,
      product,
      buildType,
      slices,
      xcframeworkOutputPath,
      collectedHeaderFiles,
      hasSwiftTarget,
      targetModuleNames
    );

    // Remove the toplevel Headers directory as it's no longer needed
    await fs.remove(path.join(xcframeworkOutputPath, 'Headers'));
  },

  /**
   * Gets the output path for frameworks for the given package. The path should be inside the
   * package's podspecPath/.xcframeworks/{buildType} folder
   * @param pkgPath Package path (the directory of the package)
   * @param buildType Build flavor
   * @returns Output path for frameworks
   */
  getFrameworksOutputPath: (pkgPath: string, buildType: BuildFlavor): string => {
    const podspecPath = new Package(pkgPath).podspecPath;
    if (!podspecPath) {
      throw new Error(`Package at path ${pkgPath} does not have a podspecPath defined.`);
    }

    return path.join(
      path.join(pkgPath, path.dirname(podspecPath)),
      '.xcframeworks',
      buildType.toLowerCase()
    );
  },

  /**
   * Returns the full path to the built XCFramework for the given product.
   * @param pkgPath Package path
   * @param productName SPM product name
   * @param buildType Build flavor
   * @returns Full path to the built XCFramework
   */
  getFrameworkPath: (pkgPath: string, productName: string, buildType: BuildFlavor): string => {
    return path.join(
      Frameworks.getFrameworksOutputPath(pkgPath, buildType),
      `${productName}.xcframework`
    );
  },
};

/**
 * Collects framework paths for all build platforms of a product.
 * @param pkg Package
 * @param product SPM product
 * @param buildType Build flavor
 * @param platform Optional platform to filter on
 * @returns Array of built framework information
 */
const collectFrameworksForProduct = (
  pkg: Package,
  product: SPMProduct,
  buildType: BuildFlavor,
  platform?: BuildPlatform
): BuiltFramework[] => {
  // Expand product platforms to build platforms (e.g., iOS(.v15) -> [iOS, iOS Simulator])
  const allBuildPlatforms = product.platforms.flatMap(getBuildPlatformsFromProductPlatform);

  // Filter and map to framework info
  return allBuildPlatforms
    .filter((buildPlatform) => !platform || buildPlatform === platform)
    .map((buildPlatform) => ({
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
    }));
};

/**
 * Processes each xcframework slice: copies headers, creates module maps, and handles Swift interfaces.
 * @param pkg Package
 * @param spmConfig SPM configuration
 * @param product SPM product
 * @param buildType Build flavor
 * @param slices Array of slice names
 * @param xcframeworkOutputPath Path to the xcframework
 * @param collectedHeaderFiles Collected header files
 * @param hasSwiftTarget Whether the product has a Swift target
 * @param targetModuleNames Map of module names to their headers
 */
const processXCFrameworkSlices = async (
  pkg: Package,
  spmConfig: SPMConfig,
  product: SPMProduct,
  buildType: BuildFlavor,
  slices: string[],
  xcframeworkOutputPath: string,
  collectedHeaderFiles: string[],
  hasSwiftTarget: boolean,
  targetModuleNames: Map<string, string[]>
): Promise<void> => {
  const sourceHeadersPath = path.join(xcframeworkOutputPath, 'Headers');
  const submoduleNames = Array.from(targetModuleNames.keys());

  for (const slice of slices) {
    const slicePath = path.join(xcframeworkOutputPath, slice, `${product.name}.framework`);
    const destHeadersPath = path.join(slicePath, 'Headers');

    // Copy headers to slice
    await fs.mkdirp(destHeadersPath);
    await fs.copy(sourceHeadersPath, destHeadersPath);

    // Create module.modulemap and umbrella header
    await createModuleMapWithUmbrellaHeaderFilesAsync(
      slicePath,
      product,
      collectedHeaderFiles,
      hasSwiftTarget,
      targetModuleNames
    );

    // Copy Swift-related artifacts if applicable
    if (hasSwiftTarget) {
      await copyGeneratedObjCSwiftHeaderAsync(pkg, spmConfig, product, slice, slicePath);
    }

    // Copy Swift module interfaces (needed for ABI stability)
    await copySwiftModuleInterfacesAsync(
      pkg,
      spmConfig,
      product,
      buildType,
      slice,
      slicePath,
      submoduleNames
    );
  }
};

/**
 * Creates a module.modulemap file and umbrella header for the given framework slice.
 * For Swift-only frameworks (no ObjC headers), the umbrella header is skipped and the
 * module map only includes the -Swift.h header for ObjC consumers.
 * @param frameworkSlicePath Path to the framework slice
 * @param product SPM product information
 * @param umbrellaHeaderFiles Collected umbrella header files (header names only, flat)
 * @param hasSwiftTarget Whether this product has a Swift target
 * @param targetModuleNames Map of moduleName to header files for creating virtual submodules
 */
const createModuleMapWithUmbrellaHeaderFilesAsync = async (
  frameworkSlicePath: string,
  product: SPMProduct,
  umbrellaHeaderFiles: string[],
  hasSwiftTarget: boolean = false,
  targetModuleNames: Map<string, string[]> = new Map()
): Promise<void> => {
  const hasObjCHeaders = umbrellaHeaderFiles.length > 0;
  const productName = product.name;

  // If no ObjC headers and no Swift target, nothing to generate
  if (!hasObjCHeaders && !hasSwiftTarget) {
    return;
  }

  const umbrellaName = `${productName}_umbrella.h`;

  // Build the module map content
  let moduleMapContent = '';

  moduleMapContent += `framework module ${productName} {\n`;

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

  // Define submodules for targets with different moduleNames
  // These are nested inside the main framework module so their types are
  // available when importing the main module (e.g., TypedArrayKind from ExpoModulesJSI
  // is available when you `import ExpoModulesCore`)
  // We list headers explicitly since umbrella directory paths can be problematic
  // Note: We do NOT use "explicit" because we want the submodule's types to be
  // automatically available when importing the parent module
  for (const [moduleName, headers] of targetModuleNames.entries()) {
    if (headers.length > 0) {
      moduleMapContent += `

    module ${moduleName} {`;
      // List each header explicitly with proper path
      for (const header of headers) {
        moduleMapContent += `
        header "${moduleName}/${header}"`;
      }
      moduleMapContent += `
        export *
    }`;
    }
  }

  // Re-export all submodule contents in the main module
  // This ensures that types from submodules (like JavaScriptRuntime) are
  // visible when importing the main module
  if (targetModuleNames.size > 0) {
    moduleMapContent += `

    // Re-export submodule types for proper Swift inheritance resolution`;
    for (const [moduleName] of targetModuleNames.entries()) {
      moduleMapContent += `
    export ${moduleName}`;
    }
  }

  moduleMapContent += `
}
`;

  // Also create top-level module aliases for CocoaPods compatibility
  // This allows `#import <ExpoModulesJSI/Header.h>` to work
  for (const [moduleName, headers] of targetModuleNames.entries()) {
    if (headers.length > 0) {
      moduleMapContent += `
module ${moduleName} {
    export ${productName}.${moduleName}
}
`;
    }
  }

  const moduleMapPath = path.join(frameworkSlicePath, 'Modules', 'module.modulemap');
  await fs.mkdirp(path.dirname(moduleMapPath));
  await fs.writeFile(moduleMapPath, moduleMapContent, 'utf8');

  // Create the umbrella header file only if we have ObjC headers
  if (hasObjCHeaders) {
    // Headers in subdirectories (other modules) are excluded from main umbrella
    // Use angled imports for proper module resolution
    const umbrellaHeaderContent = umbrellaHeaderFiles
      .map((headerFile) => `#import <${productName}/${headerFile}>`)
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
  const spinner = createAsyncSpinner(`Building framework...`, pkg, product);

  // Clean output directory
  spinner.info(`Cleaning output directory at ${path.relative(pkg.path, outputFrameworkPath)}...`);
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
    throw new SpinnerError(
      `xcodebuild failed with code ${code}:\n${buildError}\n\nxcodebuild ${args.join(' ')}`,
      spinner
    );
  }

  spinner.succeed(`Built framework at ${path.relative(pkg.path, outputFrameworkPath)}`);

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
 * @param product SPM product information
 * @returns Collected header file paths
 */
const collectAndCopyHeaderFilesFromBuiltFrameworksAsync = async (
  pkg: Package,
  product: SPMProduct,
  frameworkOutputPath: string
) => {
  const spinner = createAsyncSpinner(`Collecting header files`, pkg, product);

  spinner.info('Copying header files...');

  // Create headers directory inside the XCFramework output path
  const frameworkHeadersPath = path.join(frameworkOutputPath, 'Headers');
  await fs.mkdirp(frameworkHeadersPath);

  // Get header files and copy them to the Headers directory
  // Headers with moduleName different from product go into subdirectories
  const headerFilesCollected: string[] = [];
  const targetModuleNames = new Map<string, string[]>(); // moduleName -> header files

  for (const target of product.targets) {
    if (target.type === 'swift') {
      continue;
    }
    spinner.info(`Processing target ${target.name}...`);

    const targetHeaderFilesPath = SPMGenerator.getHeaderFilesPath(pkg, product, target);
    const headerFiles = await fs.readdir(targetHeaderFilesPath);

    // Check if this target has a moduleName that differs from the product name
    const moduleName =
      target.type !== 'framework' && target.moduleName ? target.moduleName : product.name;
    const useSubdirectory = moduleName !== product.name;

    for (const headerFile of headerFiles) {
      const sourceHeaderFilePath = path.join(targetHeaderFilesPath, headerFile);
      let destHeaderFilePath: string;

      spinner.info(`Copying header file ${path.basename(headerFile)}...`);

      if (useSubdirectory) {
        // Put in subdirectory: Headers/ModuleName/Header.h
        const subdirPath = path.join(frameworkHeadersPath, moduleName);
        await fs.mkdirp(subdirPath);
        destHeaderFilePath = path.join(subdirPath, headerFile);

        // Track headers for this moduleName
        if (!targetModuleNames.has(moduleName)) {
          targetModuleNames.set(moduleName, []);
        }
        targetModuleNames.get(moduleName)!.push(headerFile);
      } else {
        // Flat structure: Headers/Header.h
        destHeaderFilePath = path.join(frameworkHeadersPath, headerFile);
        headerFilesCollected.push(headerFile);
      }

      await fs.copy(sourceHeaderFilePath, destHeaderFilePath);
    }
  }

  // Post-process all headers to rewrite imports for subdirectory modules
  // This is needed because frameworks don't support angled includes for
  // subdirectory headers when consumed via CocoaPods
  spinner.info('Rewriting header imports for submodules...');
  await rewriteHeaderImportsForSubmodulesAsync(frameworkHeadersPath, targetModuleNames);

  spinner.succeed(`Copied header files for ${product.name}`);

  return { headerFiles: headerFilesCollected, targetModuleNames };
};

/**
 * Derives the xcodebuild build folder prefix from an xcframework slice name.
 * Slice names follow patterns like: 'ios-arm64', 'ios-arm64_x86_64-simulator', 'macos-arm64_x86_64', etc.
 * @param slice The xcframework slice name
 * @returns The build folder prefix (e.g., 'iphoneos', 'iphonesimulator', 'macosx') or undefined if unknown
 */
const getBuildFolderPrefixForSlice = (slice: string): string | undefined => {
  const isSimulator = slice.endsWith('-simulator');
  // Extract OS from slice name (e.g., 'ios' from 'ios-arm64' or 'ios-arm64_x86_64-simulator')
  const osMatch = slice.match(/^(ios|macos|tvos|visionos)/);
  if (!osMatch) {
    return undefined;
  }
  const os = osMatch[1];
  switch (os) {
    case 'ios':
      return isSimulator ? 'iphonesimulator' : 'iphoneos';
    case 'macos':
      return 'macosx';
    case 'tvos':
      return isSimulator ? 'appletvsimulator' : 'appletvos';
    case 'visionos':
      return isSimulator ? 'visionossimulator' : 'visionos';
    default:
      return undefined;
  }
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
  const spinner = createAsyncSpinner(
    `Copying generated ObjC Swift header for ${product.name} (${slice})`,
    pkg,
    product
  );

  // Map slice name to build folder prefix
  const buildFolderPrefix = getBuildFolderPrefixForSlice(slice);
  if (!buildFolderPrefix) {
    spinner.fail(`Unknown xcframework slice: ${slice}, skipping ObjC Swift header copy`);
    return;
  }

  // The header is generated in the Intermediates/GeneratedModuleMaps directory
  const generatedObjCHeaderName = `${product.name}-Swift.h`;
  const generatedModuleMapsPath = path.join(
    SPMBuild.getPackageBuildPath(pkg, product),
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
 * @param submoduleNames Names of submodules whose types might be referenced in Swift interfaces
 */
const copySwiftModuleInterfacesAsync = async (
  pkg: Package,
  spmConfig: SPMConfig,
  product: SPMProduct,
  buildType: BuildFlavor,
  slice: string,
  slicePath: string,
  submoduleNames: string[] = []
): Promise<void> => {
  let spinner = createAsyncSpinner(`Copying Swift module interfaces for (${slice})`, pkg, product);

  // Find Swift targets in the product
  const swiftTarget = product.targets.find((target) => target?.type === 'swift');

  if (!swiftTarget) {
    // No Swift target in this product, nothing to copy
    spinner.fail(`No Swift target in ${product.name}, skipping Swift module copy`);
    return;
  }

  // Map slice name to build folder prefix
  const buildFolderPrefix = getBuildFolderPrefixForSlice(slice);
  if (!buildFolderPrefix) {
    spinner.fail(`Unknown xcframework slice: ${slice}, skipping Swift module copy`);
    return;
  }

  // Construct path to the built swiftmodule directory
  // The swiftmodule is named after the Swift target (which should match the product name)
  const buildProductsPath = path.join(
    SPMBuild.getPackageBuildPath(pkg, product),
    'Build',
    'Products',
    `${buildType}-${buildFolderPrefix}`
  );

  const sourceSwiftModulePath = path.join(buildProductsPath, `${swiftTarget.name}.swiftmodule`);

  if (!(await fs.pathExists(sourceSwiftModulePath))) {
    spinner.fail(
      `Swift module not found at ${sourceSwiftModulePath}, skipping swiftinterface copy`
    );
    return;
  }

  spinner.succeed(`Copied Swift module interfaces for ${product.name} (${slice})`);

  // Destination path: Framework/Modules/ProductName.swiftmodule
  const destSwiftModulePath = path.join(slicePath, 'Modules', `${product.name}.swiftmodule`);
  await fs.mkdirp(destSwiftModulePath);

  spinner = createAsyncSpinner(
    `Copying Swift module interfaces for ${product.name} (${slice})`,
    pkg,
    product
  );

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
    spinner.info(`Copying Swift module interface file: ${path.basename(file)}...`);
    await fs.copy(sourceFile, destFile);

    // Post-process .swiftinterface files to fix internal module references
    if (file.endsWith('.swiftinterface')) {
      await fixSwiftInterfaceModuleReferencesAsync(destFile, spmConfig, submoduleNames);
    }
  }

  spinner.succeed(`Copied Swift module interfaces for ${product.name} (${slice})`);
};

/**
 * Post-processes a .swiftinterface file to:
 * 1. Remove React imports (React.xcframework has VFS overlay issues that prevent module loading)
 * 2. Remap internal SPM target names to their product names
 *    (e.g., ExpoModulesCore_ios_objc -> ExpoModulesCore)
 * 3. Add @_exported imports for submodules that contain types used in the interface
 *
 * @param swiftInterfaceFilePath Path to the .swiftinterface file
 * @param spmConfig SPM configuration containing product/target mappings
 * @param submoduleNames Names of submodules whose types might be referenced
 */
const fixSwiftInterfaceModuleReferencesAsync = async (
  swiftInterfaceFilePath: string,
  spmConfig: SPMConfig,
  submoduleNames: string[] = []
): Promise<void> => {
  // Determine the product name from the file path
  const pathParts = swiftInterfaceFilePath.split('/');
  const frameworkName = pathParts.find((p) => p.endsWith('.framework'))?.replace('.framework', '');
  const productName = frameworkName || '';

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
  for (const product of spmConfig.products) {
    for (const target of product.targets) {
      if (target.name === product.name) {
        continue; // Skip targets that have same name as product
      }

      // Replace @_exported import statements
      const exportedImportPattern = new RegExp(`^@_exported import ${target.name}\\s*$`, 'gm');
      const exportedReplaced = content.replace(
        exportedImportPattern,
        `@_exported import ${product.name}`
      );
      if (exportedReplaced !== content) {
        content = exportedReplaced;
        modified = true;
      }

      // Replace regular import statements
      const importPattern = new RegExp(`^import ${target.name}\\s*$`, 'gm');
      const importReplaced = content.replace(importPattern, `import ${product.name}`);
      if (importReplaced !== content) {
        content = importReplaced;
        modified = true;
      }

      // Replace module-qualified type references
      // e.g., ExpoModulesCore_ios_objc.TypeName -> ExpoModulesCore.TypeName
      const qualifiedPattern = new RegExp(`\\b${target.name}\\.`, 'g');
      const qualifiedReplaced = content.replace(qualifiedPattern, `${product.name}.`);
      if (qualifiedReplaced !== content) {
        content = qualifiedReplaced;
        modified = true;
      }
    }
  }

  // For submodules (ObjC modules within the same framework), rewrite
  // ProductName.TypeName to just TypeName since the types are exposed via
  // the umbrella header and are not in a separate Swift module.
  // Note: We do NOT add @_exported import for submodules because they are
  // ObjC/Clang modules, not Swift modules. The types are available through
  // the framework's umbrella header.
  if (submoduleNames.length > 0) {
    // Rewrite ExpoModulesCore.TypedArrayKind -> TypedArrayKind
    // These types come from ObjC headers and are available without qualification
    const qualifiedTypePattern = new RegExp(`\\b${productName}\\.(\\w+)`, 'g');
    const qualifiedTypeReplaced = content.replace(qualifiedTypePattern, '$1');
    if (qualifiedTypeReplaced !== content) {
      content = qualifiedTypeReplaced;
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
  // Determine which product this header belongs to based on its path
  const pathParts = swiftHeaderPath.split('/');
  const frameworkName = pathParts.find((p) => p.endsWith('.framework'))?.replace('.framework', '');
  const currentProduct = frameworkName || '';

  // Read the header file
  let content = await fs.readFile(swiftHeaderPath, 'utf8');
  let modified = false;

  // Remove @import statements for internal SPM targets
  // These modules don't exist when consumed via CocoaPods
  for (const product of spmConfig.products) {
    for (const target of product.targets) {
      if (target.name === product.name) {
        continue; // Skip targets that have same name as product
      }

      // Match @import TargetName; statements
      const importPattern = new RegExp(`^@import ${target.name};\\s*$`, 'gm');
      if (product.name === currentProduct) {
        // Same framework - just remove the import, the types are already available
        const replaced = content.replace(
          importPattern,
          `// Removed internal target import: ${target.name}`
        );
        if (replaced !== content) {
          content = replaced;
          modified = true;
        }
      } else {
        // Different framework - replace with import of the product module
        const replaced = content.replace(importPattern, `@import ${product.name};`);
        if (replaced !== content) {
          content = replaced;
          modified = true;
        }
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

/**
 * Rewrites header imports for submodule headers in all headers within the framework.
 * This is necessary because frameworks don't properly support angled includes for
 * subdirectory headers when consumed via CocoaPods.
 *
 * For each submodule (e.g., ExpoModulesJSI), this converts:
 *   - In main headers (Headers/*.h):
 *       #import <ExpoModulesJSI/Header.h> -> #import "ExpoModulesJSI/Header.h"
 *   - In subdirectory headers (Headers/ExpoModulesJSI/*.h):
 *       #import <ExpoModulesJSI/Header.h> -> #import "Header.h"
 *
 * @param headersPath Path to the Headers directory in the framework
 * @param targetModuleNames Map of moduleName to header files for submodules
 */
const rewriteHeaderImportsForSubmodulesAsync = async (
  headersPath: string,
  targetModuleNames: Map<string, string[]>
): Promise<void> => {
  // Skip if no submodules
  if (targetModuleNames.size === 0) {
    return;
  }

  // Get all module names that need rewriting
  const moduleNames = Array.from(targetModuleNames.keys());

  // Process main headers (Headers/*.h)
  const mainHeaders = (await fs.readdir(headersPath)).filter(
    (f) => f.endsWith('.h') && !targetModuleNames.has(f)
  );

  for (const headerFile of mainHeaders) {
    const headerPath = path.join(headersPath, headerFile);
    let content = await fs.readFile(headerPath, 'utf8');
    let modified = false;

    for (const moduleName of moduleNames) {
      // Rewrite #import <ModuleName/Header.h> to #import "ModuleName/Header.h"
      const angledImportPattern = new RegExp(`#(import|include)\\s*<${moduleName}/([^>]+)>`, 'g');
      const newContent = content.replace(angledImportPattern, `#$1 "${moduleName}/$2"`);
      if (newContent !== content) {
        content = newContent;
        modified = true;
      }
    }

    if (modified) {
      await fs.writeFile(headerPath, content, 'utf8');
    }
  }

  // Process subdirectory headers (Headers/ModuleName/*.h)
  for (const moduleName of moduleNames) {
    const subdirPath = path.join(headersPath, moduleName);
    if (!(await fs.pathExists(subdirPath))) {
      continue;
    }

    const subdirHeaders = (await fs.readdir(subdirPath)).filter((f) => f.endsWith('.h'));

    for (const headerFile of subdirHeaders) {
      const headerPath = path.join(subdirPath, headerFile);
      const content = await fs.readFile(headerPath, 'utf8');

      // Rewrite #import <ModuleName/Header.h> to #import "Header.h" (sibling imports)
      const angledImportPattern = new RegExp(`#(import|include)\\s*<${moduleName}/([^>]+)>`, 'g');
      const newContent = content.replace(angledImportPattern, '#$1 "$2"');

      if (newContent !== content) {
        await fs.writeFile(headerPath, newContent, 'utf8');
      }
    }
  }
};
