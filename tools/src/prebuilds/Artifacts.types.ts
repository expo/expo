/**
 * Types for the artifact downloader library.
 */

import { BuildFlavor } from './Prebuilder.types';

export type ArtifactSourceType =
  | 'local_prebuilt_tarball'
  | 'download_prebuild_tarball'
  | 'download_prebuilt_nightly_tarball';

export const ArtifactSourceTypes = {
  LOCAL_PREBUILT_TARBALL: 'local_prebuilt_tarball' as const,
  DOWNLOAD_PREBUILD_TARBALL: 'download_prebuild_tarball' as const,
  DOWNLOAD_PREBUILT_NIGHTLY_TARBALL: 'download_prebuilt_nightly_tarball' as const,
};

/**
 * Options for downloading an artifact.
 */
export interface ArtifactDownloadOptions {
  /**
   * The version of the artifact to download.
   * Use 'nightly' to fetch the latest nightly version.
   */
  version: string;

  /**
   * The build flavor (Debug or Release).
   */
  buildType: BuildFlavor;

  /**
   * The output path where artifacts should be downloaded and extracted.
   */
  outputPath: string;

  /**
   * Optional local tarball path to use instead of downloading.
   */
  localTarballPath?: string;

  /**
   * Optional custom Maven repository URL for enterprise mirrors.
   * Defaults to Maven Central.
   */
  mavenRepoUrl?: string;

  /**
   * If set to true, we'll skip downloading / processing and just return the path where the artifact would be.
   * If set to true and the artifact is missing, an error will be thrown.
   */
  skipArtifacts?: boolean;
}

/**
 * Configuration for an artifact type (e.g., Hermes, ReactNativeDependencies).
 */
export interface ArtifactConfig {
  /**
   * The name of the artifact for logging purposes.
   */
  name: string;

  /**
   * The NPM package name to fetch nightly versions from.
   */
  npmPackageName: string;

  /**
   * The Maven namespace for the artifact (e.g., 'com/facebook/hermes').
   */
  mavenNamespace: string;

  /**
   * The Maven artifact ID.
   */
  mavenArtifactId: string;

  /**
   * Function to build the tarball filename for a given version and build type.
   */
  getTarballFilename: (version: string, buildType: BuildFlavor) => string;

  /**
   * Function to build the nightly tarball URL.
   * Returns null if nightly builds are not supported.
   */
  getNightlyTarballUrl?: (version: string, buildType: BuildFlavor) => Promise<string>;

  /**
   * Function to check if artifacts are already extracted and valid.
   * Returns the path to check for existence.
   */
  getValidationPath: (outputPath: string) => string;

  /**
   * Optional post-extraction callback for custom processing.
   */
  postExtract?: (tarballPath: string, outputPath: string) => Promise<void>;
}

/**
 * Options for downloading all React Native dependencies.
 */
export interface DownloadDependenciesOptions {
  /**
   * The React Native version to download dependencies for.
   */
  reactNativeVersion: string;

  /**
   * The Hermes version to download dependencies for.
   */
  hermesVersion: string;

  /**
   * The output path for all artifacts.
   */
  artifactsPath: string;

  /**
   * The build flavor (Debug or Release).
   * @default 'Debug'
   */
  buildFlavor: BuildFlavor;

  /**
   * Optional custom Maven repository URL for enterprise mirrors.
   */
  mavenRepoUrl?: string;

  /**
   * Optional local tarball paths for each artifact type.
   */
  localTarballs?: {
    hermes?: string;
    reactNativeDependencies?: string;
    reactNative?: string;
  };

  /**
   * If set to true, we'll skip downloading / processing and just return the paths where artifacts would be.
   * If set to true and some artifacts are missing, an error will be thrown.
   */
  skipArtifacts?: boolean;
}

/**
 * Structure representing downloaded dependencies paths.
 */
export interface DownloadedDependencies {
  hermes: string;
  reactNativeDependencies: string;
  react: string;
}
