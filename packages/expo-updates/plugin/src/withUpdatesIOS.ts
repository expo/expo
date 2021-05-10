import { ConfigPlugin, withExpoPlist, ExpoPlist } from '@expo/config-plugins';
import { ExpoConfig } from '@expo/config-types';
import * as path from 'path';
import resolveFrom from 'resolve-from';

type XcodeProject = any;

const CREATE_MANIFEST_IOS_PATH = 'expo-updates/scripts/create-manifest-ios.sh';

type ExpoConfigUpdates = Pick<
  ExpoConfig,
  'sdkVersion' | 'owner' | 'runtimeVersion' | 'updates' | 'slug'
>;

export enum Config {
  ENABLED = 'EXUpdatesEnabled',
  CHECK_ON_LAUNCH = 'EXUpdatesCheckOnLaunch',
  LAUNCH_WAIT_MS = 'EXUpdatesLaunchWaitMs',
  RUNTIME_VERSION = 'EXUpdatesRuntimeVersion',
  SDK_VERSION = 'EXUpdatesSDKVersion',
  UPDATE_URL = 'EXUpdatesURL',
}

export function getUpdateUrl(
  config: Pick<ExpoConfigUpdates, 'owner' | 'slug'>,
  username: string | null
): string | null {
  const user = typeof config.owner === 'string' ? config.owner : username;
  if (!user) {
    return null;
  }
  return `https://exp.host/@${user}/${config.slug}`;
}

export function getRuntimeVersion(
  config: Pick<ExpoConfigUpdates, 'runtimeVersion'>
): string | null {
  return typeof config.runtimeVersion === 'string' ? config.runtimeVersion : null;
}

export function getSDKVersion(config: Pick<ExpoConfigUpdates, 'sdkVersion'>): string | null {
  return typeof config.sdkVersion === 'string' ? config.sdkVersion : null;
}

export function getUpdatesEnabled(config: Pick<ExpoConfigUpdates, 'updates'>): boolean {
  return config.updates?.enabled !== false;
}

export function getUpdatesTimeout(config: Pick<ExpoConfigUpdates, 'updates'>) {
  return config.updates?.fallbackToCacheTimeout ?? 0;
}

export function getUpdatesCheckOnLaunch(
  config: Pick<ExpoConfigUpdates, 'updates'>
): 'NEVER' | 'ALWAYS' {
  if (config.updates?.checkAutomatically === 'ON_ERROR_RECOVERY') {
    return 'NEVER';
  } else if (config.updates?.checkAutomatically === 'ON_LOAD') {
    return 'ALWAYS';
  }
  return 'ALWAYS';
}

export const withUpdatesIOS: ConfigPlugin<{ expoUsername: string | null }> = (
  config,
  { expoUsername }
) => {
  return withExpoPlist(config, config => {
    config.modResults = setUpdatesConfig(config, config.modResults, expoUsername);
    return config;
  });
};

export function setUpdatesConfig(
  config: ExpoConfigUpdates,
  expoPlist: ExpoPlist,
  username: string | null
): ExpoPlist {
  const newExpoPlist = {
    ...expoPlist,
    [Config.ENABLED]: getUpdatesEnabled(config),
    [Config.CHECK_ON_LAUNCH]: getUpdatesCheckOnLaunch(config),
    [Config.LAUNCH_WAIT_MS]: getUpdatesTimeout(config),
  };

  const updateUrl = getUpdateUrl(config, username);
  if (updateUrl) {
    newExpoPlist[Config.UPDATE_URL] = updateUrl;
  } else {
    delete newExpoPlist[Config.UPDATE_URL];
  }

  return setVersionsConfig(config, newExpoPlist);
}

export function setVersionsConfig(config: ExpoConfigUpdates, expoPlist: ExpoPlist): ExpoPlist {
  const newExpoPlist = { ...expoPlist };

  const runtimeVersion = getRuntimeVersion(config);
  const sdkVersion = getSDKVersion(config);
  if (runtimeVersion) {
    delete newExpoPlist[Config.SDK_VERSION];
    newExpoPlist[Config.RUNTIME_VERSION] = runtimeVersion;
  } else if (sdkVersion) {
    delete newExpoPlist[Config.RUNTIME_VERSION];
    newExpoPlist[Config.SDK_VERSION] = sdkVersion;
  } else {
    delete newExpoPlist[Config.SDK_VERSION];
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

  return path.relative(path.join(projectRoot, 'ios'), buildScriptPath);
}

interface ShellScriptBuildPhase {
  isa: 'PBXShellScriptBuildPhase';
  name: string;
  shellScript: string;
  [key: string]: any;
}

export function getBundleReactNativePhase(project: XcodeProject): ShellScriptBuildPhase {
  const shellScriptBuildPhase = project.hash.project.objects.PBXShellScriptBuildPhase as Record<
    string,
    ShellScriptBuildPhase
  >;
  const bundleReactNative = Object.values(shellScriptBuildPhase).find(
    buildPhase => buildPhase.name === '"Bundle React Native code and images"'
  );

  if (!bundleReactNative) {
    throw new Error(`Couldn't find a build phase "Bundle React Native code and images"`);
  }

  return bundleReactNative;
}

export function ensureBundleReactNativePhaseContainsConfigurationScript(
  projectRoot: string,
  project: XcodeProject
): XcodeProject {
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
  project: XcodeProject
): boolean {
  const bundleReactNative = getBundleReactNativePhase(project);
  const buildPhaseShellScriptPath = formatConfigurationScriptPath(projectRoot);
  return bundleReactNative.shellScript.includes(buildPhaseShellScriptPath);
}

export function isPlistConfigurationSet(expoPlist: ExpoPlist): boolean {
  return Boolean(
    expoPlist.EXUpdatesURL && (expoPlist.EXUpdatesSDKVersion || expoPlist.EXUpdatesRuntimeVersion)
  );
}

export function isPlistConfigurationSynced(
  config: ExpoConfigUpdates,
  expoPlist: ExpoPlist,
  username: string | null
): boolean {
  return (
    getUpdateUrl(config, username) === expoPlist.EXUpdatesURL &&
    getUpdatesEnabled(config) === expoPlist.EXUpdatesEnabled &&
    getUpdatesTimeout(config) === expoPlist.EXUpdatesLaunchWaitMs &&
    getUpdatesCheckOnLaunch(config) === expoPlist.EXUpdatesCheckOnLaunch &&
    isPlistVersionConfigurationSynced(config, expoPlist)
  );
}

export function isPlistVersionConfigurationSynced(
  config: Pick<ExpoConfigUpdates, 'sdkVersion' | 'runtimeVersion'>,
  expoPlist: ExpoPlist
): boolean {
  const expectedRuntimeVersion = getRuntimeVersion(config);
  const expectedSdkVersion = getSDKVersion(config);
  const currentRuntimeVersion = expoPlist.EXUpdatesRuntimeVersion ?? null;
  const currentSdkVersion = expoPlist.EXUpdatesSDKVersion ?? null;

  return (
    currentSdkVersion === expectedSdkVersion && currentRuntimeVersion === expectedRuntimeVersion
  );
}
