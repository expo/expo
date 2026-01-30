import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';

import logger from '../Logger';
import { Package } from '../Packages';
import { Artifacts } from './Artifacts';
import type { DownloadDependenciesOptions, DownloadedDependencies } from './Artifacts.types';
import type { SPMPackageSource } from './ExternalPackage';
import { BuildFlavor } from './Prebuilder.types';
import { createAsyncSpinner, SpinnerError } from './Utils';

/**
 * Checks if file content has changed between source and destination.
 * Uses fast checks first (existence, size, mtime), then falls back to content comparison.
 * Returns true if destination doesn't exist or content differs.
 */
function hasFileContentChanged(sourcePath: string, destPath: string): boolean {
  if (!fs.existsSync(destPath)) {
    return true;
  }

  const sourceStat = fs.statSync(sourcePath);
  const destStat = fs.statSync(destPath);

  // Different size = different content (fast check)
  if (sourceStat.size !== destStat.size) {
    return true;
  }

  // Same mtime = same content (fast check for previously synced files)
  if (sourceStat.mtimeMs === destStat.mtimeMs) {
    return false;
  }

  // Same size but different mtime - need to compare content
  // Use streaming comparison for large files, buffer comparison for small files
  const SMALL_FILE_THRESHOLD = 64 * 1024; // 64KB

  if (sourceStat.size <= SMALL_FILE_THRESHOLD) {
    // Small file - read both into memory and compare
    const srcBuf = fs.readFileSync(sourcePath);
    const destBuf = fs.readFileSync(destPath);
    return !srcBuf.equals(destBuf);
  }

  // Large file - compare in chunks to avoid memory issues
  const CHUNK_SIZE = 64 * 1024;
  const srcFd = fs.openSync(sourcePath, 'r');
  const destFd = fs.openSync(destPath, 'r');

  try {
    const srcBuf = Buffer.alloc(CHUNK_SIZE);
    const destBuf = Buffer.alloc(CHUNK_SIZE);
    let position = 0;

    while (position < sourceStat.size) {
      const srcRead = fs.readSync(srcFd, srcBuf, 0, CHUNK_SIZE, position);
      const destRead = fs.readSync(destFd, destBuf, 0, CHUNK_SIZE, position);

      if (srcRead !== destRead) {
        return true;
      }

      // Compare only the bytes that were read
      for (let i = 0; i < srcRead; i++) {
        if (srcBuf[i] !== destBuf[i]) {
          return true;
        }
      }

      position += srcRead;
    }

    return false;
  } finally {
    fs.closeSync(srcFd);
    fs.closeSync(destFd);
  }
}

/**
 * Recursively syncs a source directory to a destination directory.
 * Only copies files that have changed, preserving mtime for unchanged files.
 * This enables incremental builds by not triggering xcodebuild rebuilds.
 * @param srcDir Source directory
 * @param destDir Destination directory
 * @param preserveExtraFiles Files in destination that should not be deleted even if not in source
 * @returns Number of files that were actually updated
 */
async function syncDirectoryAsync(
  srcDir: string,
  destDir: string,
  preserveExtraFiles: Set<string> = new Set()
): Promise<number> {
  let updatedCount = 0;

  // Ensure destination exists
  await fs.ensureDir(destDir);

  // Get all entries in source
  const entries = await fs.readdir(srcDir, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);

    if (entry.isDirectory()) {
      // Recursively sync subdirectories
      updatedCount += await syncDirectoryAsync(srcPath, destPath, preserveExtraFiles);
    } else if (entry.isSymbolicLink()) {
      // Handle symlinks - recreate if target differs
      const srcTarget = await fs.readlink(srcPath);
      if (await fs.pathExists(destPath)) {
        const destTarget = await fs.readlink(destPath).catch(() => null);
        if (destTarget !== srcTarget) {
          await fs.remove(destPath);
          await fs.symlink(srcTarget, destPath);
          updatedCount++;
        }
      } else {
        await fs.symlink(srcTarget, destPath);
        updatedCount++;
      }
    } else {
      // Regular file - only copy if content changed
      if (hasFileContentChanged(srcPath, destPath)) {
        await fs.copy(srcPath, destPath, { overwrite: true, preserveTimestamps: true });
        updatedCount++;
      }
    }
  }

  // Remove files in dest that don't exist in source (except preserved files)
  if (await fs.pathExists(destDir)) {
    const destEntries = await fs.readdir(destDir, { withFileTypes: true });
    for (const destEntry of destEntries) {
      const srcPath = path.join(srcDir, destEntry.name);
      const destPath = path.join(destDir, destEntry.name);
      // Skip deletion if file is in preserve list
      if (preserveExtraFiles.has(destEntry.name)) {
        continue;
      }
      if (!(await fs.pathExists(srcPath))) {
        await fs.remove(destPath);
      }
    }
  }

  return updatedCount;
}

export const Dependencies = {
  /**
   * Cleans the dependencies path if necessary.
   * @param options Options object
   * @param artifactsPath Path to the artifacts folder.
   * @returns Whether downloading artifacts should be skipped.
   */
  cleanArtifactsAsync: async (artifactsPath: string): Promise<void> => {
    logger.info(
      `🧹 Clearing artifacts folder: ${chalk.gray(path.relative(process.cwd(), artifactsPath))}`
    );
    await fs.remove(artifactsPath);
  },

  /**
   * Prunes unused cached artifacts, keeping only the versions currently in use.
   * Scans the cache directory and removes any version directories that don't match
   * the current version+flavor combination.
   *
   * @param cachePath Path to the cache directory
   * @param currentVersions Map of artifact names to their current version-flavor combos
   */
  pruneUnusedCacheAsync: async (
    cachePath: string,
    currentVersions: { hermes: string; reactNativeVersion: string; buildFlavor: BuildFlavor }
  ): Promise<{ removed: string[]; keptCount: number }> => {
    const removed: string[] = [];
    let keptCount = 0;

    if (!fs.existsSync(cachePath)) {
      return { removed, keptCount };
    }

    // Map artifact folder names to their current version
    const currentVersionMap: Record<string, string> = {
      hermes: `${currentVersions.hermes}-${currentVersions.buildFlavor}`,
      'react-native-dependencies': `${currentVersions.reactNativeVersion}-${currentVersions.buildFlavor}`,
      react: `${currentVersions.reactNativeVersion}-${currentVersions.buildFlavor}`,
    };

    logger.info(`🧹 Pruning unused cache entries from ${chalk.gray(cachePath)}...`);

    // Iterate through artifact directories (hermes, react-native-dependencies, react)
    const artifactDirs = await fs.readdir(cachePath, { withFileTypes: true });

    for (const artifactDir of artifactDirs) {
      if (!artifactDir.isDirectory()) {
        continue;
      }

      const artifactPath = path.join(cachePath, artifactDir.name);
      const currentVersion = currentVersionMap[artifactDir.name];

      if (!currentVersion) {
        // Unknown artifact directory - skip it
        continue;
      }

      // Check version subdirectories
      const versionDirs = await fs.readdir(artifactPath, { withFileTypes: true });

      for (const versionDir of versionDirs) {
        if (!versionDir.isDirectory()) {
          continue;
        }

        const versionPath = path.join(artifactPath, versionDir.name);

        if (versionDir.name === currentVersion) {
          // This is the current version - keep it
          keptCount++;
          logger.info(
            `  ✓ Keeping ${chalk.green(artifactDir.name)}/${chalk.cyan(versionDir.name)}`
          );
        } else {
          // Old version - remove it
          logger.info(
            `  🗑  Removing ${chalk.yellow(artifactDir.name)}/${chalk.gray(versionDir.name)}`
          );
          await fs.remove(versionPath);
          removed.push(`${artifactDir.name}/${versionDir.name}`);
        }
      }
    }

    if (removed.length > 0) {
      logger.info(`🧹 Pruned ${chalk.yellow(removed.length)} old cache entries`);
    } else {
      logger.info(`🧹 Cache is clean - no old entries to prune`);
    }

    return { removed, keptCount };
  },

  /**
   * Downloads all React Native dependencies (Hermes, ReactNativeDependencies, React Native)
   * to a centralized versioned cache. Each artifact is stored in a version-specific directory
   * to allow multiple versions to coexist and prevent version conflicts.
   *
   * Cache structure: <cachePath>/<artifactName>/<version>-<flavor>/
   */
  downloadArtifactsAsync: async (
    options: DownloadDependenciesOptions
  ): Promise<DownloadedDependencies> => {
    const {
      reactNativeVersion,
      hermesVersion,
      artifactsPath: cachePath,
      buildFlavor: buildType,
      mavenRepoUrl,
      localTarballs,
      skipArtifacts,
    } = options;

    logger.info(
      `⬇️  ${options.skipArtifacts ? 'Verifying' : 'Preparing'} centralized cache at ${chalk.gray(path.relative(process.cwd(), cachePath))}...`
    );

    // Ensure we have a valid cache path
    await fs.mkdir(cachePath, { recursive: true });

    // Download dependencies to versioned paths
    // Structure: <cache>/<artifact>/<version>-<flavor>/
    // Note: Hermes uses its own versioning separate from React Native
    const hermesPath = await downloadHermesAsync(
      hermesVersion,
      Artifacts.getVersionedArtifactPath(cachePath, 'hermes', hermesVersion, buildType),
      {
        buildType,
        mavenRepoUrl,
        localTarballPath: localTarballs?.hermes,
        skipArtifacts,
      }
    );

    const reactNativeDependenciesPath = await downloadReactNativeDependenciesAsync(
      reactNativeVersion,
      Artifacts.getVersionedArtifactPath(
        cachePath,
        'react-native-dependencies',
        reactNativeVersion,
        buildType
      ),
      {
        buildType,
        mavenRepoUrl,
        localTarballPath: localTarballs?.reactNativeDependencies,
        skipArtifacts,
      }
    );

    const reactNativePath = await downloadReactNativeAsync(
      reactNativeVersion,
      Artifacts.getVersionedArtifactPath(cachePath, 'react', reactNativeVersion, buildType),
      {
        buildType,
        mavenRepoUrl,
        localTarballPath: localTarballs?.reactNative,
        skipArtifacts,
      }
    );

    // Generate the VFS overlay file from the template (resolves ${ROOT_PATH} placeholders)
    await resolveVFSOverlayTemplate(reactNativePath);

    return {
      hermes: hermesPath,
      reactNativeDependencies: reactNativeDependenciesPath,
      react: reactNativePath,
      cachePath,
      hermesVersion,
      reactNativeVersion,
      buildFlavor: buildType,
    };
  },

  /**
   * To avoid having to download dependencies for each package build,
   * we copy the downloaded dependencies into each package's Dependencies folder from
   * the shared artifacts folder in the dependencies download path.
   * Uses smart syncing to only copy files that have changed, preserving mtimes
   * for unchanged files to enable incremental xcodebuild builds.
   * @param pkg Package
   * @param artifacts: Downloaded artifacts' paths
   * @param depsDestinationPath Path to the package's Dependencies folder
   */
  copyOrCheckPackageDependencies: async (
    pkg: SPMPackageSource,
    artifacts: DownloadedDependencies,
    depsDestinationPath: string,
    copyDependencies: boolean
  ): Promise<void> => {
    logger.info(
      `📋 ${copyDependencies ? 'Syncing' : 'Checking'} package dependencies for ${chalk.green(pkg.packageName)}`
    );

    // Symlink each dependency into the package's Dependencies folder
    const hermesDest = path.join(depsDestinationPath, 'Hermes');
    const rnDepsDest = path.join(depsDestinationPath, 'ReactNativeDependencies');
    const rnDest = path.join(depsDestinationPath, 'React-Core-prebuilt');

    if (copyDependencies) {
      const spinner = createAsyncSpinner('Syncing artifacts to local dependencies', pkg);

      // Ensure the Dependencies folder exists
      await fs.mkdir(depsDestinationPath, { recursive: true });

      // Generated files that should be preserved in destination (not deleted during sync)
      // React-VFS.yaml is generated from React-VFS-template.yaml by resolveVFSOverlayTemplate
      const preserveGeneratedFiles = new Set(['React-VFS.yaml']);

      // Sync directories (only copies changed files, preserves mtime for unchanged)
      spinner.info('Syncing Hermes...');
      const hermesUpdated = await syncDirectoryAsync(artifacts.hermes, hermesDest);

      spinner.info('Syncing ReactNativeDependencies...');
      const rnDepsUpdated = await syncDirectoryAsync(artifacts.reactNativeDependencies, rnDepsDest);

      spinner.info('Syncing React Native...');
      const rnUpdated = await syncDirectoryAsync(artifacts.react, rnDest, preserveGeneratedFiles);

      const totalUpdated = hermesUpdated + rnDepsUpdated + rnUpdated;
      if (totalUpdated > 0) {
        spinner.succeed(
          `Synced artifacts to local .dependencies folder (${totalUpdated} files updated)`
        );
      } else {
        spinner.succeed('Artifacts already up-to-date in local .dependencies folder');
      }

      // Resolve the VFS overlay template with the correct paths
      await resolveVFSOverlayTemplate(rnDest);
    } else {
      const spinner = createAsyncSpinner('Verifying artifacts for local dependencies', pkg);

      // check that we have the dependencies in place
      if (!(await fs.pathExists(hermesDest))) {
        throw new SpinnerError('Hermes dependency is missing', spinner);
      }
      if (!(await fs.pathExists(rnDepsDest))) {
        throw new SpinnerError('ReactNativeDependencies dependency is missing', spinner);
      }
      if (!(await fs.pathExists(rnDest))) {
        throw new SpinnerError('React Native dependency is missing', spinner);
      }
      spinner.succeed('Verified artifacts for local dependencies');
    }
  },

  /**
   * Cleans the dependencies output folder for a given package
   * @param pkg Package
   */
  cleanDependenciesFolderAsync: async (pkg: SPMPackageSource): Promise<void> => {
    logger.info(`🧹 Cleaning dependencies folder for package ${chalk.green(pkg.packageName)}...`);
    const buildFolderToClean = Dependencies.getPackageDependenciesPath(pkg);
    await fs.remove(buildFolderToClean);
  },

  /**
   * Cleans the xcframeworks output folder for a given package.
   * This is where the final composed xcframeworks are stored.
   * For Expo packages: podspecPath/.xcframeworks/ (e.g., packages/expo-font/ios/.xcframeworks/)
   * For external packages: pkg.path/.xcframeworks/ (e.g., node_modules/react-native-svg/.xcframeworks/)
   * @param pkg Package
   */
  cleanXCFrameworksFolderAsync: async (pkg: SPMPackageSource): Promise<void> => {
    // Determine the correct xcframeworks path based on package type
    let xcframeworksPath: string;

    try {
      // Try to treat it as an Expo package with a podspec
      const expoPkg = new Package(pkg.path);
      const podspecPath = expoPkg.podspecPath;
      if (podspecPath) {
        // Expo package: xcframeworks are next to the podspec
        xcframeworksPath = path.join(pkg.path, path.dirname(podspecPath), '.xcframeworks');
      } else {
        // No podspec, use package root
        xcframeworksPath = path.join(pkg.path, '.xcframeworks');
      }
    } catch {
      // External package: xcframeworks are directly in package root
      xcframeworksPath = path.join(pkg.path, '.xcframeworks');
    }

    if (fs.existsSync(xcframeworksPath)) {
      logger.info(`🧹 Cleaning xcframeworks folder for package ${chalk.green(pkg.packageName)}...`);
      await fs.remove(xcframeworksPath);
    }
  },

  /**
   * Cleans the generated code folder for a given package.
   * This is where codegen output is stored.
   * @param pkg Package
   */
  cleanGeneratedFolderAsync: async (pkg: SPMPackageSource): Promise<void> => {
    const generatedPath = path.join(pkg.path, '.generated');
    if (fs.existsSync(generatedPath)) {
      logger.info(`🧹 Cleaning generated folder for package ${chalk.green(pkg.packageName)}...`);
      await fs.remove(generatedPath);
    }
  },

  /**
   * Returns the path to the dependencies folder. This is where downloaded dependencies are stored for
   * a single package
   * @param pkg Package
   * @returns Path to dependencies folder for the given package
   */
  getPackageDependenciesPath: (pkg: SPMPackageSource) => {
    return path.join(pkg.path, '.dependencies');
  },
};

interface DownloadArtifactOptions {
  buildType?: BuildFlavor;
  mavenRepoUrl?: string;
  localTarballPath?: string;
  skipArtifacts?: boolean;
}

const downloadHermesAsync = async (
  version: string,
  outputPath: string,
  options: DownloadArtifactOptions = {}
): Promise<string> => {
  return Artifacts.downloadArtifactAsync(Artifacts.HermesArtifactConfig, {
    version,
    buildType: options.buildType ?? 'Release',
    outputPath,
    mavenRepoUrl: options.mavenRepoUrl,
    localTarballPath: options.localTarballPath,
    skipArtifacts: options.skipArtifacts,
  });
};

const downloadReactNativeDependenciesAsync = async (
  version: string,
  outputPath: string,
  options: DownloadArtifactOptions = {}
): Promise<string> => {
  return Artifacts.downloadArtifactAsync(Artifacts.ReactNativeDependenciesArtifactConfig, {
    version,
    buildType: options.buildType ?? 'Release',
    outputPath,
    mavenRepoUrl: options.mavenRepoUrl,
    localTarballPath: options.localTarballPath,
    skipArtifacts: options.skipArtifacts,
  });
};

const downloadReactNativeAsync = async (
  version: string,
  outputPath: string,
  options: DownloadArtifactOptions = {}
): Promise<string> => {
  return Artifacts.downloadArtifactAsync(Artifacts.ReactNativeArtifactConfig, {
    version,
    buildType: options.buildType ?? 'Release',
    outputPath,
    mavenRepoUrl: options.mavenRepoUrl,
    localTarballPath: options.localTarballPath,
    skipArtifacts: options.skipArtifacts,
  });
};

/**
 * Resolves the VFS overlay template by replacing ${ROOT_PATH} placeholders
 * with the actual path to the React.xcframework.
 * Only writes the file if content has changed to preserve mtime for incremental builds.
 */
const resolveVFSOverlayTemplate = async (outputPath: string): Promise<void> => {
  const xcframeworkPath = path.join(outputPath, 'React.xcframework');
  const vfsTemplatePath = path.join(xcframeworkPath, 'React-VFS-template.yaml');
  const vfsOutputPath = path.join(outputPath, 'React-VFS.yaml');

  if (!fs.existsSync(vfsTemplatePath)) {
    // VFS template may not exist in Maven artifacts - this is OK for builds that don't
    // use the local React Native build (e.g., external packages using downloaded artifacts)
    // The VFS overlay is only needed when building from react-native source
    return;
  }

  const templateContent = fs.readFileSync(vfsTemplatePath, 'utf8');
  const resolvedContent = templateContent.replace(/\$\{ROOT_PATH\}/g, xcframeworkPath);

  // Only write if content changed (preserves mtime for incremental builds)
  if (fs.existsSync(vfsOutputPath)) {
    const existingContent = fs.readFileSync(vfsOutputPath, 'utf8');
    if (existingContent === resolvedContent) {
      return; // No changes needed
    }
  }
  await fs.writeFile(vfsOutputPath, resolvedContent, 'utf8');
};
