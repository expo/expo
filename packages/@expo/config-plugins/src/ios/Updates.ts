import * as path from 'path';
import resolveFrom from 'resolve-from';
import xcode from 'xcode';

import { ExpoPlist } from './IosConfig.types';
import { ConfigPlugin } from '../Plugin.types';
import { withExpoPlist } from '../plugins/ios-plugins';
import {
  ExpoConfigUpdates,
  getExpoUpdatesPackageVersion,
  getRuntimeVersionNullableAsync,
  getUpdatesCheckOnLaunch,
  getUpdatesCodeSigningCertificate,
  getUpdatesCodeSigningMetadata,
  getUpdatesRequestHeaders,
  getUpdatesEnabled,
  getUpdatesTimeout,
  getUpdateUrl,
} from '../utils/Updates';

const CREATE_MANIFEST_IOS_PATH = 'expo-updates/scripts/create-manifest-ios.sh';

export enum Config {
  ENABLED = 'EXUpdatesEnabled',
  CHECK_ON_LAUNCH = 'EXUpdatesCheckOnLaunch',
  LAUNCH_WAIT_MS = 'EXUpdatesLaunchWaitMs',
  RUNTIME_VERSION = 'EXUpdatesRuntimeVersion',
  UPDATE_URL = 'EXUpdatesURL',
  RELEASE_CHANNEL = 'EXUpdatesReleaseChannel',
  UPDATES_CONFIGURATION_REQUEST_HEADERS_KEY = 'EXUpdatesRequestHeaders',
  CODE_SIGNING_CERTIFICATE = 'EXUpdatesCodeSigningCertificate',
  CODE_SIGNING_METADATA = 'EXUpdatesCodeSigningMetadata',
}

// when making changes to this config plugin, ensure the same changes are also made in eas-cli and build-tools
// Also ensure the docs are up-to-date: https://docs.expo.dev/bare/installing-updates/

export const withUpdates: ConfigPlugin = (config) => {
  return withExpoPlist(config, async (config) => {
    const projectRoot = config.modRequest.projectRoot;
    const expoUpdatesPackageVersion = getExpoUpdatesPackageVersion(projectRoot);
    config.modResults = await setUpdatesConfigAsync(
      projectRoot,
      config,
      config.modResults,
      expoUpdatesPackageVersion
    );
    return config;
  });
};

export async function setUpdatesConfigAsync(
  projectRoot: string,
  config: ExpoConfigUpdates,
  expoPlist: ExpoPlist,
  expoUpdatesPackageVersion?: string | null
): Promise<ExpoPlist> {
  const newExpoPlist = {
    ...expoPlist,
    [Config.ENABLED]: getUpdatesEnabled(config),
    [Config.CHECK_ON_LAUNCH]: getUpdatesCheckOnLaunch(config, expoUpdatesPackageVersion),
    [Config.LAUNCH_WAIT_MS]: getUpdatesTimeout(config),
  };

  const updateUrl = getUpdateUrl(config);
  if (updateUrl) {
    newExpoPlist[Config.UPDATE_URL] = updateUrl;
  } else {
    delete newExpoPlist[Config.UPDATE_URL];
  }

  const codeSigningCertificate = getUpdatesCodeSigningCertificate(projectRoot, config);
  if (codeSigningCertificate) {
    newExpoPlist[Config.CODE_SIGNING_CERTIFICATE] = codeSigningCertificate;
  } else {
    delete newExpoPlist[Config.CODE_SIGNING_CERTIFICATE];
  }

  const codeSigningMetadata = getUpdatesCodeSigningMetadata(config);
  if (codeSigningMetadata) {
    newExpoPlist[Config.CODE_SIGNING_METADATA] = codeSigningMetadata;
  } else {
    delete newExpoPlist[Config.CODE_SIGNING_METADATA];
  }

  const requestHeaders = getUpdatesRequestHeaders(config);
  if (requestHeaders) {
    newExpoPlist[Config.UPDATES_CONFIGURATION_REQUEST_HEADERS_KEY] = requestHeaders;
  } else {
    delete newExpoPlist[Config.UPDATES_CONFIGURATION_REQUEST_HEADERS_KEY];
  }

  return await setVersionsConfigAsync(projectRoot, config, newExpoPlist);
}

export async function setVersionsConfigAsync(
  projectRoot: string,
  config: ExpoConfigUpdates,
  expoPlist: ExpoPlist
): Promise<ExpoPlist> {
  const newExpoPlist = { ...expoPlist };

  const runtimeVersion = await getRuntimeVersionNullableAsync(projectRoot, config, 'ios');
  if (!runtimeVersion && expoPlist[Config.RUNTIME_VERSION]) {
    throw new Error(
      'A runtime version is set in your Expo.plist, but is missing from your app.json/app.config.js. Please either set runtimeVersion in your app.json/app.config.js or remove EXUpdatesRuntimeVersion from your Expo.plist.'
    );
  }

  if (runtimeVersion) {
    delete newExpoPlist['EXUpdatesSDKVersion'];
    newExpoPlist[Config.RUNTIME_VERSION] = runtimeVersion;
  } else {
    delete newExpoPlist['EXUpdatesSDKVersion'];
    delete newExpoPlist[Config.RUNTIME_VERSION];
  }

  return newExpoPlist;
}

function formatConfigurationScriptPath(projectRoot: string): string {
  const buildScriptPath = resolveFrom.silent(projectRoot, CREATE_MANIFEST_IOS_PATH);

  if (!buildScriptPath) {
    throw new Error(
      "Could not find the build script for iOS. This could happen in case of outdated 'node_modules'. Run 'npm install' to make sure that it's up-to-date."
    );
  }

  const relativePath = path.relative(path.join(projectRoot, 'ios'), buildScriptPath);
  return process.platform === 'win32' ? relativePath.replace(/\\/g, '/') : relativePath;
}

interface ShellScriptBuildPhase {
  isa: 'PBXShellScriptBuildPhase';
  name: string;
  shellScript: string;
  [key: string]: any;
}

export function getBundleReactNativePhase(project: xcode.XcodeProject): ShellScriptBuildPhase {
  const shellScriptBuildPhase = project.hash.project.objects.PBXShellScriptBuildPhase as Record<
    string,
    ShellScriptBuildPhase
  >;
  const bundleReactNative = Object.values(shellScriptBuildPhase).find(
    (buildPhase) => buildPhase.name === '"Bundle React Native code and images"'
  );

  if (!bundleReactNative) {
    throw new Error(`Couldn't find a build phase "Bundle React Native code and images"`);
  }

  return bundleReactNative;
}

export function ensureBundleReactNativePhaseContainsConfigurationScript(
  projectRoot: string,
  project: xcode.XcodeProject
): xcode.XcodeProject {
  const bundleReactNative = getBundleReactNativePhase(project);
  const buildPhaseShellScriptPath = formatConfigurationScriptPath(projectRoot);

  if (!isShellScriptBuildPhaseConfigured(projectRoot, project)) {
    // check if there's already another path to create-manifest-ios.sh
    // this might be the case for monorepos
    if (bundleReactNative.shellScript.includes(CREATE_MANIFEST_IOS_PATH)) {
      bundleReactNative.shellScript = bundleReactNative.shellScript.replace(
        new RegExp(`(\\\\n)(\\.\\.)+/node_modules/${CREATE_MANIFEST_IOS_PATH}`),
        ''
      );
    }
    bundleReactNative.shellScript = `${bundleReactNative.shellScript.replace(
      /"$/,
      ''
    )}${buildPhaseShellScriptPath}\\n"`;
  }
  return project;
}

export function isShellScriptBuildPhaseConfigured(
  projectRoot: string,
  project: xcode.XcodeProject
): boolean {
  const bundleReactNative = getBundleReactNativePhase(project);
  const buildPhaseShellScriptPath = formatConfigurationScriptPath(projectRoot);
  return bundleReactNative.shellScript.includes(buildPhaseShellScriptPath);
}

export function isPlistConfigurationSet(expoPlist: ExpoPlist): boolean {
  return Boolean(expoPlist.EXUpdatesURL && expoPlist.EXUpdatesRuntimeVersion);
}

export async function isPlistConfigurationSyncedAsync(
  projectRoot: string,
  config: ExpoConfigUpdates,
  expoPlist: ExpoPlist
): Promise<boolean> {
  return (
    getUpdateUrl(config) === expoPlist.EXUpdatesURL &&
    getUpdatesEnabled(config) === expoPlist.EXUpdatesEnabled &&
    getUpdatesTimeout(config) === expoPlist.EXUpdatesLaunchWaitMs &&
    getUpdatesCheckOnLaunch(config) === expoPlist.EXUpdatesCheckOnLaunch &&
    getUpdatesCodeSigningCertificate(projectRoot, config) ===
      expoPlist.EXUpdatesCodeSigningCertificate &&
    getUpdatesCodeSigningMetadata(config) === expoPlist.EXUpdatesCodeSigningMetadata &&
    (await isPlistVersionConfigurationSyncedAsync(projectRoot, config, expoPlist))
  );
}

export async function isPlistVersionConfigurationSyncedAsync(
  projectRoot: string,
  config: Pick<ExpoConfigUpdates, 'sdkVersion' | 'runtimeVersion'>,
  expoPlist: ExpoPlist
): Promise<boolean> {
  const expectedRuntimeVersion = await getRuntimeVersionNullableAsync(projectRoot, config, 'ios');

  const currentRuntimeVersion = expoPlist.EXUpdatesRuntimeVersion ?? null;
  const currentSdkVersion = expoPlist.EXUpdatesSDKVersion ?? null;

  if (expectedRuntimeVersion !== null) {
    return currentRuntimeVersion === expectedRuntimeVersion && currentSdkVersion === null;
  } else {
    return true;
  }
}
