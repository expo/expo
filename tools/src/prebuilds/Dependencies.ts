import chalk from 'chalk';
import fs from 'fs-extra';
import ora from 'ora';
import path from 'path';

import Logger from '../Logger';
import { Artifacts } from './Artifacts';
import { Package } from '../Packages';
import type { DownloadDependenciesOptions, DownloadedDependencies } from './Artifacts.types';
import { BuildFlavor } from './Prebuilder.types';

export const Dependencies = {
  /**
   * Cleans the dependencies path if necessary.
   * @param options Options object
   * @param artifactsPath Path to the artifacts folder.
   * @returns Whether downloading artifacts should be skipped.
   */
  cleanArtifactsAsync: async (artifactsPath: string): Promise<void> => {
    Logger.info(
      `🧹 Clearing artifacts folder: ${chalk.gray(path.relative(process.cwd(), artifactsPath))}`
    );
    await fs.remove(artifactsPath);
  },

  /**
   * Downloads all React Native dependencies (Hermes, ReactNativeDependencies, React Native).
   */
  downloadArtifactsAsync: async (
    options: DownloadDependenciesOptions
  ): Promise<{
    hermes: string;
    reactNativeDependencies: string;
    react: string;
  }> => {
    const {
      reactNativeVersion,
      hermesVersion,
      artifactsPath: dependenciesPath,
      buildFlavor: buildType,
      mavenRepoUrl,
      localTarballs,
      skipArtifacts,
    } = options;

    Logger.info(
      `⬇️  ${options.skipArtifacts ? 'Verifying artifacts' : 'Downloading artifacts'}...`
    );

    // Ensure we have a valid output path for the dependencies
    await fs.mkdir(dependenciesPath, { recursive: true });

    // Create flavor-specific output paths so Debug and Release can coexist
    const flavorPath = path.join(dependenciesPath, buildType.toLowerCase());

    // Download dependencies sequentially
    // Note: Hermes uses its own versioning separate from React Native
    const hermesPath = await downloadHermesAsync(hermesVersion, path.join(flavorPath, 'hermes'), {
      buildType,
      mavenRepoUrl,
      localTarballPath: localTarballs?.hermes,
      skipArtifacts,
    });

    const reactNativeDependenciesPath = await downloadReactNativeDependenciesAsync(
      reactNativeVersion,
      path.join(flavorPath, 'react-native-dependencies'),
      {
        buildType,
        mavenRepoUrl,
        localTarballPath: localTarballs?.reactNativeDependencies,
        skipArtifacts,
      }
    );

    const reactNativePath = await downloadReactNativeAsync(
      reactNativeVersion,
      path.join(flavorPath, 'react-native'),
      {
        buildType,
        mavenRepoUrl,
        localTarballPath: localTarballs?.reactNative,
        skipArtifacts,
      }
    );

    return {
      hermes: hermesPath,
      reactNativeDependencies: reactNativeDependenciesPath,
      react: reactNativePath,
    };
  },

  /**
   * To avoid having to download dependencies for each package build,
   * we copy the downloaded dependencies into each package's Dependencies folder from
   * the shared artifacts folder in the dependencies download path.
   * @param pkg Package
   * @param artifacts: Downloaded artifacts' paths
   * @param depsDestinationPath Path to the package's Dependencies folder
   */
  copyOrCheckPackageDependencies: async (
    pkg: Package,
    artifacts: DownloadedDependencies,
    depsDestinationPath: string,
    copyDependencies: boolean
  ): Promise<void> => {
    Logger.info(
      `📋 ${copyDependencies ? 'Copying' : 'Checking'} package dependencies for ${pkg.packageName}...`
    );

    // Symlink each dependency into the package's Dependencies folder
    const hermesDest = path.join(depsDestinationPath, 'Hermes');
    const rnDepsDest = path.join(depsDestinationPath, 'ReactNativeDependencies');
    const rnDest = path.join(depsDestinationPath, 'React-Core-prebuilt');

    if (copyDependencies) {
      const spinner = ora({
        text: `Copying dependencies to ${pkg.packageName}...`,
        prefixText: '  ',
      }).start();

      // Delete folder if it exists
      if (await fs.pathExists(depsDestinationPath)) {
        await fs.remove(depsDestinationPath);
      }
      // Recreate the Dependencies folder
      await fs.mkdir(depsDestinationPath, { recursive: true });

      // Copy directories
      await fs.copy(artifacts.hermes, hermesDest);
      await fs.copy(artifacts.reactNativeDependencies, rnDepsDest);
      await fs.copy(artifacts.react, rnDest);

      spinner.succeed(`Copied dependencies to ${pkg.packageName}`);

      // Resolve the VFS overlay template with the correct paths
      await resolveVFSOverlayTemplate(rnDest);
    } else {
      // check that we have the dependencies in place
      if (!(await fs.pathExists(hermesDest))) {
        throw new Error(`Hermes dependency is missing in package: ${pkg.packageName}`);
      }
      if (!(await fs.pathExists(rnDepsDest))) {
        throw new Error(
          `ReactNativeDependencies dependency is missing in package: ${pkg.packageName}`
        );
      }
      if (!(await fs.pathExists(rnDest))) {
        throw new Error(`React Native dependency is missing in package: ${pkg.packageName}`);
      }
    }
  },

  /**
   * Cleans the dependencies output folder for a given package
   * @param pkg Package
   */
  cleanDependenciesFolderAsync: async (pkg: Package): Promise<void> => {
    Logger.info(`🧹 Cleaning dependencies folder...`);
    const buildFolderToClean = Dependencies.getPackageDependenciesPath(pkg);
    await fs.remove(buildFolderToClean);
  },

  /**
   * Returns the path to the dependencies folder. This is where downloaded dependencies are stored for
   * a single package
   * @param pkg Package
   * @returns Path to dependencies folder for the given package
   */
  getPackageDependenciesPath: (pkg: Package) => {
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
 */
const resolveVFSOverlayTemplate = async (outputPath: string): Promise<void> => {
  const xcframeworkPath = path.join(outputPath, 'React.xcframework');
  const vfsTemplatePath = path.join(xcframeworkPath, 'React-VFS-template.yaml');
  const vfsOutputPath = path.join(outputPath, 'React-VFS.yaml');

  if (!fs.existsSync(vfsTemplatePath)) {
    throw new Error(`VFS overlay template not found at ${vfsTemplatePath}`);
  }

  const templateContent = fs.readFileSync(vfsTemplatePath, 'utf8');
  const resolvedContent = templateContent.replace(/\$\{ROOT_PATH\}/g, xcframeworkPath);
  await fs.writeFile(vfsOutputPath, resolvedContent, 'utf8');

  Logger.debug(
    `   ✓ Resolved VFS overlay template to ${path.relative(process.cwd(), vfsOutputPath)}`
  );
};
