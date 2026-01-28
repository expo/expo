/**
 * Generic artifact downloader library for downloading prebuilt artifacts
 * from Maven repositories or nightly builds.
 */

import { exec } from 'child_process';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import stream from 'stream';
import { promisify } from 'util';

import {
  ArtifactConfig,
  ArtifactDownloadOptions,
  ArtifactSourceType,
  ArtifactSourceTypes,
} from './Artifacts.types';
import { BuildFlavor } from './Prebuilder.types';
import { AsyncSpinner, createAsyncSpinner, SpinnerError } from './Utils';

const pipeline = promisify(stream.pipeline);

const DEFAULT_MAVEN_REPO_URL = 'https://repo1.maven.org/maven2';

// Artifact path constants - these match the structure inside the downloaded tarballs
const HERMES_XCFRAMEWORK_RELATIVE_PATH = [
  'destroot',
  'Library',
  'Frameworks',
  'universal',
  'hermesvm.xcframework',
];
const RN_DEPENDENCIES_XCFRAMEWORK_RELATIVE_PATH = [
  'packages',
  'react-native',
  'third-party',
  'ReactNativeDependencies.xcframework',
];
const RN_CORE_XCFRAMEWORK_NAME = 'React.xcframework';
const RN_DEPENDENCIES_XCFRAMEWORK_NAME = 'ReactNativeDependencies.xcframework';

/**
 * Creates a tarball filename generator for Maven artifacts.
 * @param artifactId The Maven artifact ID
 * @param artifactSuffix The suffix used in the tarball name (e.g., 'hermes-ios', 'reactnative-core')
 */
const createTarballFilenameGenerator =
  (artifactId: string, artifactSuffix: string) =>
  (version: string, buildType: BuildFlavor): string =>
    `${artifactId}-${version}-${artifactSuffix}-${buildType.toLowerCase()}.tar.gz`;

/**
 * Creates a nightly tarball URL generator for Maven artifacts.
 * @param mavenGroup The Maven group (e.g., 'hermes', 'react')
 * @param artifactCoordinate The artifact coordinate
 * @param artifactNameTemplate Function to generate artifact name from buildType
 */
const createNightlyTarballUrlGenerator =
  (
    mavenGroup: string,
    artifactCoordinate: string,
    artifactNameTemplate: (buildType: BuildFlavor) => string
  ) =>
  async (version: string, buildType: BuildFlavor): Promise<string> =>
    computeNightlyTarballURL(
      version,
      buildType,
      mavenGroup,
      artifactCoordinate,
      artifactNameTemplate(buildType)
    );

export const Artifacts = {
  /**
   * Downloads and prepares an artifact based on the provided configuration and options.
   *
   * @param config - The artifact configuration
   * @param options - Download options including version, build type, and output path
   * @returns The path to the extracted artifacts
   */
  downloadArtifactAsync: async (
    config: ArtifactConfig,
    options: ArtifactDownloadOptions
  ): Promise<string> => {
    const spinner = createAsyncSpinner(`Preparing ${config.name}...`);

    try {
      const { outputPath, localTarballPath, buildType, skipArtifacts } = options;
      let { version } = options;

      // Ensure that the output folder exists
      if (!fs.existsSync(outputPath)) {
        await fs.mkdir(outputPath, { recursive: true });
      }

      // Path for keeping track of the current version in the artifacts folder
      const versionFilePath = path.join(outputPath, `${config.name.toLowerCase()}.version`);

      // Check if the artifacts are already downloaded - only if we're asked to actually download artifacts
      if (
        !skipArtifacts &&
        !localTarballPath &&
        checkExistingVersion(config, versionFilePath, version, buildType, outputPath)
      ) {
        spinner.succeed(`${config.name} ${version} (${buildType}) - already downloaded`);
        return outputPath;
      }

      if (skipArtifacts) {
        // Ensure that the file exists if we're skipping artifacts
        if (!fs.existsSync(config.getValidationPath(outputPath))) {
          throw new SpinnerError(
            `${config.name} artifacts not found at ${outputPath}, cannot skip download.`,
            spinner
          );
        }
        spinner.succeed(`${config.name}: Skipping download`);
        return outputPath;
      }

      let tarballPath: string | null = localTarballPath ?? null;

      // Only check if the artifacts folder exists if we are not using a local tarball
      if (!tarballPath) {
        // Resolve nightly version if needed
        if (version === 'nightly') {
          spinner.info(`${config.name}: Resolving latest nightly version...`);
          version = await getNightlyVersionFromNPMAsync(config.npmPackageName);
        }

        spinner.info(`${config.name}: Checking artifact availability...`);
        const sourceType = await determineSourceTypeAsync(config, options, version);

        spinner.info(`${config.name}: Downloading ${version} (${buildType})...`);
        tarballPath = await downloadFromSourceTypeAsync(
          config,
          sourceType,
          version,
          buildType,
          outputPath,
          options.mavenRepoUrl,
          spinner
        );
      } else {
        spinner.info(`${config.name}: Using local tarball`);
        // Clean the output directory and recreate it when using a local tarball
        // to ensure we're starting fresh with the new tarball contents
        await fs.rm(outputPath, { recursive: true, force: true });
        await fs.mkdir(outputPath, { recursive: true });
      }

      // Custom post-extraction if provided
      spinner.info(`${config.name}: Extracting...`);
      if (config.postExtract) {
        await config.postExtract(tarballPath, outputPath);
      } else {
        // Default extraction: extract tarball directly to output path
        const execAsync = promisify(exec);
        await execAsync(`tar -xzf "${tarballPath}" -C "${outputPath}"`);
      }

      // Delete the tarball after extraction (unless it's a user-provided local tarball)
      if (!localTarballPath && fs.existsSync(tarballPath)) {
        await fs.unlink(tarballPath);
      }

      // Write version.txt only after successful download and extraction
      if (!localTarballPath) {
        const resolvedVersion = `${version}-${buildType}`;
        await fs.writeFile(versionFilePath, resolvedVersion, 'utf8');
        spinner.succeed(`${config.name} ${version} (${buildType}) - downloaded and extracted`);
      } else {
        spinner.succeed(`${config.name} - extracted from local tarball`);
      }

      return outputPath;
    } catch (error: any) {
      spinner.fail(`${config.name}: ${error.message}`);
      throw error;
    }
  },

  /**
   * Returns the shared artifacts path for downloading and storing external artifacts.
   * @param rootPath Root path of the prebuild packages
   * @returns Path to the artifacts folder
   */
  getArtifactsPath: (rootPath: string) => {
    return path.join(rootPath, '.artifacts');
  },

  /**
   * Configuration for downloading Hermes artifacts.
   */
  HermesArtifactConfig: {
    name: 'Hermes',
    npmPackageName: 'hermes-compiler',
    mavenNamespace: 'com/facebook/hermes',
    mavenArtifactId: 'hermes-ios',
    getTarballFilename: createTarballFilenameGenerator('hermes-ios', 'hermes-ios'),
    getNightlyTarballUrl: createNightlyTarballUrlGenerator(
      'hermes',
      'hermes-ios',
      (buildType) => `hermes-ios-${buildType.toLowerCase()}.tar.gz`
    ),
    getValidationPath: (outputPath: string) =>
      path.join(outputPath, ...HERMES_XCFRAMEWORK_RELATIVE_PATH),
  } as ArtifactConfig,

  /**
   * Configuration for downloading ReactNativeDependencies artifacts.
   */
  ReactNativeDependenciesArtifactConfig: {
    name: 'ReactNativeDependencies',
    npmPackageName: 'react-native',
    mavenNamespace: 'com/facebook/react',
    mavenArtifactId: 'react-native-artifacts',
    getTarballFilename: createTarballFilenameGenerator(
      'react-native-artifacts',
      'reactnative-dependencies'
    ),
    getNightlyTarballUrl: createNightlyTarballUrlGenerator(
      'react',
      'react-native-artifacts',
      (buildType) => `reactnative-dependencies-${buildType.toLowerCase()}.tar.gz`
    ),
    getValidationPath: (outputPath: string) =>
      path.join(outputPath, RN_DEPENDENCIES_XCFRAMEWORK_NAME),

    postExtract: async (tarballPath: string, outputPath: string) => {
      const execAsync = promisify(exec);

      // ReactNativeDependencies has a nested structure that needs special handling
      const tmpPath = path.join(os.tmpdir(), 'react-native-dependencies');
      fs.mkdirSync(tmpPath, { recursive: true });

      // Extract to temp directory first
      await execAsync(`tar -xzf "${tarballPath}" -C "${tmpPath}"`);

      // The xcframework is nested in the tarball
      const xcframeworkSource = path.join(tmpPath, ...RN_DEPENDENCIES_XCFRAMEWORK_RELATIVE_PATH);

      // Copy the xcframework to the output path
      await execAsync(`cp -R "${xcframeworkSource}" "${outputPath}"`);

      // Clean up temp directory
      fs.rmSync(tmpPath, { recursive: true, force: true });
    },
  } as ArtifactConfig,

  /**
   * Configuration for downloading React Native Core artifacts.
   */
  ReactNativeArtifactConfig: {
    name: 'ReactNative',
    npmPackageName: 'react-native',
    mavenNamespace: 'com/facebook/react',
    mavenArtifactId: 'react-native-artifacts',
    getTarballFilename: createTarballFilenameGenerator(
      'react-native-artifacts',
      'reactnative-core'
    ),
    getNightlyTarballUrl: createNightlyTarballUrlGenerator(
      'react',
      'react-native-artifacts',
      (buildType) => `reactnative-core-${buildType.toLowerCase()}.tar.gz`
    ),
    // React Native core artifacts contain the React xcframeworks
    getValidationPath: (outputPath: string) => path.join(outputPath, RN_CORE_XCFRAMEWORK_NAME),
  } as ArtifactConfig,
};

/**
 * Fetches the latest nightly version from NPM.
 */
async function getNightlyVersionFromNPMAsync(packageName: string): Promise<string> {
  const npmResponse = await fetch(`https://registry.npmjs.org/${packageName}/nightly`);

  if (!npmResponse.ok) {
    throw new Error(
      `Couldn't get an answer from NPM: ${npmResponse.status} ${npmResponse.statusText}`
    );
  }

  const json = await npmResponse.json();
  return json.version;
}

/**
 * Checks if the artifacts are already downloaded and up to date with the specified version.
 * Returns true if the artifacts are up to date, false otherwise.
 */
function checkExistingVersion(
  config: ArtifactConfig,
  versionFilePath: string,
  version: string,
  buildType: BuildFlavor,
  outputPath: string
): boolean {
  const resolvedVersion = `${version}-${buildType}`;
  const validationPath = config.getValidationPath(outputPath);

  if (fs.existsSync(validationPath) && fs.existsSync(versionFilePath)) {
    const versionFileContent = fs.readFileSync(versionFilePath, 'utf8');
    if (versionFileContent.trim() === resolvedVersion) {
      return true;
    }
  }

  // If the version file does not exist or the version does not match, delete the artifacts folder
  fs.rmSync(outputPath, { recursive: true, force: true });

  // Recreate the output directory
  fs.mkdirSync(outputPath, { recursive: true });

  return false;
}

/**
 * Builds the Maven tarball URL for a stable release.
 */
function getTarballUrl(
  config: ArtifactConfig,
  version: string,
  buildType: BuildFlavor,
  mavenRepoUrl?: string
): string {
  const repoUrl = mavenRepoUrl ?? DEFAULT_MAVEN_REPO_URL;
  const filename = config.getTarballFilename(version, buildType);
  return `${repoUrl}/${config.mavenNamespace}/${config.mavenArtifactId}/${version}/${filename}`;
}

/**
 * Checks if an artifact exists at the given URL.
 */
async function getArtifactExistsAsync(tarballUrl: string): Promise<boolean> {
  try {
    const response = await fetch(tarballUrl, { method: 'HEAD' });
    return response.status === 200;
  } catch {
    return false;
  }
}

/**
 * Determines the source type for the artifact based on availability.
 */
async function determineSourceTypeAsync(
  config: ArtifactConfig,
  options: ArtifactDownloadOptions,
  version: string
): Promise<ArtifactSourceType> {
  const { buildType, localTarballPath, mavenRepoUrl } = options;

  if (localTarballPath && fs.existsSync(localTarballPath)) {
    return ArtifactSourceTypes.LOCAL_PREBUILT_TARBALL;
  }

  const tarballUrl = getTarballUrl(config, version, buildType, mavenRepoUrl);
  if (await getArtifactExistsAsync(tarballUrl)) {
    return ArtifactSourceTypes.DOWNLOAD_PREBUILD_TARBALL;
  }

  // Try nightly tarball if available
  if (config.getNightlyTarballUrl) {
    const nightlyUrl = await config.getNightlyTarballUrl(version, buildType);
    if (await getArtifactExistsAsync(nightlyUrl)) {
      return ArtifactSourceTypes.DOWNLOAD_PREBUILT_NIGHTLY_TARBALL;
    }
  }

  // Neither Maven Central nor nightly URL exists - throw an error
  throw new Error(
    `Could not find ${config.name} artifact for version ${version} (${buildType}). ` +
      `Checked Maven Central: ${tarballUrl}`
  );
}

/**
 * Downloads the artifact based on the source type.
 */
async function downloadFromSourceTypeAsync(
  config: ArtifactConfig,
  sourceType: ArtifactSourceType,
  version: string,
  buildType: BuildFlavor,
  outputPath: string,
  mavenRepoUrl: string | undefined,
  spinner: AsyncSpinner
): Promise<string> {
  switch (sourceType) {
    case ArtifactSourceTypes.LOCAL_PREBUILT_TARBALL:
      throw new Error('Local tarball should be handled before this point');

    case ArtifactSourceTypes.DOWNLOAD_PREBUILD_TARBALL: {
      const url = getTarballUrl(config, version, buildType, mavenRepoUrl);
      return downloadTarballAsync(config, url, version, buildType, outputPath, spinner);
    }

    case ArtifactSourceTypes.DOWNLOAD_PREBUILT_NIGHTLY_TARBALL: {
      if (!config.getNightlyTarballUrl) {
        throw new Error(`Nightly builds are not supported for ${config.name}`);
      }
      const url = await config.getNightlyTarballUrl(version, buildType);
      return downloadTarballAsync(config, url, version, buildType, outputPath, spinner);
    }

    default:
      throw new Error(`Unsupported or invalid source type provided: ${sourceType}`);
  }
}

/**
 * Downloads a tarball from the given URL with progress updates.
 */
async function downloadTarballAsync(
  config: ArtifactConfig,
  tarballUrl: string,
  version: string,
  buildType: BuildFlavor,
  outputPath: string,
  spinner: AsyncSpinner
): Promise<string> {
  const filename = config.getTarballFilename(version, buildType);
  const destPath = path.join(outputPath, filename);

  if (!fs.existsSync(destPath)) {
    const tmpFile = path.join(outputPath, `${config.name.toLowerCase()}.download`);
    try {
      await fs.mkdir(outputPath, { recursive: true });

      const response = await fetch(tarballUrl);

      if (!response.ok) {
        throw new Error(`Failed to download: ${response.status} ${response.statusText}`);
      }

      const contentLength = response.headers.get('content-length');
      const totalSize = contentLength ? parseInt(contentLength, 10) : 0;

      // Create a write stream to the temporary file
      const fileStream = fs.createWriteStream(tmpFile);

      if (response.body && totalSize > 0) {
        // Track download progress
        let downloadedSize = 0;
        const reader = response.body.getReader();

        const readableStream = new ReadableStream({
          async start(controller) {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              downloadedSize += value.length;
              const progress = ((downloadedSize / totalSize) * 100).toFixed(1);
              const downloadedMB = (downloadedSize / 1024 / 1024).toFixed(1);
              const totalMB = (totalSize / 1024 / 1024).toFixed(1);
              spinner.info(
                `${config.name}: Downloading... ${progress}% (${downloadedMB}/${totalMB} MB)`
              );

              controller.enqueue(value);
            }
            controller.close();
          },
        });

        await pipeline(readableStream as unknown as NodeJS.ReadableStream, fileStream);
      } else if (response.body) {
        await pipeline(response.body as unknown as NodeJS.ReadableStream, fileStream);
      } else {
        // For older fetch implementations that don't support response.body as a stream
        const buffer = await response.arrayBuffer();
        fs.writeFileSync(tmpFile, Buffer.from(buffer));
      }

      // Move the temporary file to the destination path
      fs.renameSync(tmpFile, destPath);
    } catch (e: any) {
      // Clean up the temporary file if it exists
      if (fs.existsSync(tmpFile)) {
        fs.unlinkSync(tmpFile);
      }
      throw new Error(`Failed to download tarball from ${tarballUrl}: ${e.message}`);
    }
  }

  return destPath;
}

/**
 * Computes the nightly tarball URL for Maven Central artifacts.
 * This follows the pattern used by React Native nightly builds.
 */
async function computeNightlyTarballURL(
  version: string,
  _buildType: BuildFlavor,
  group: string,
  artifactCoordinate: string,
  artifactName: string
): Promise<string> {
  // Nightly builds use a different URL pattern
  // The version typically looks like "0.76.0-nightly-20241204-abcdef12"
  const mavenRepoUrl = 'https://oss.sonatype.org/content/repositories/snapshots';
  const namespace = `com/facebook/${group}`;
  return `${mavenRepoUrl}/${namespace}/${artifactCoordinate}/${version}/${artifactCoordinate}-${version}-${artifactName}`;
}
