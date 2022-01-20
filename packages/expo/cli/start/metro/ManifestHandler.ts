import { ExpoAppManifest, ExpoConfig, ExpoGoConfig, getConfig } from '@expo/config';
import { JSONObject } from '@expo/json-file';
import chalk from 'chalk';
import express from 'express';
import http from 'http';
import os from 'os';
import { parse, resolve, URL } from 'url';

import * as Log from '../../log';
import { learnMore } from '../../utils/link';
import ProcessSettings from '../api/ProcessSettings';
import * as ProjectSettings from '../api/ProjectSettings';
import {
  constructBundleQueryParams,
  constructBundleUrlAsync,
  constructDebuggerHostAsync,
  constructHostUriAsync,
  constructLogUrlAsync,
  stripJSExtension,
} from '../serverUrl';
import * as Webpack from '../webpack/Webpack';
import { resolveGoogleServicesFile, resolveManifestAssets } from './ProjectAssets';
import { resolveEntryPoint } from './resolveEntryPoint';
import UserSettings from '../api/UserSettings';

interface HostInfo {
  host: string;
  server: 'xdl';
  serverVersion: string;
  serverDriver: string | null;
  serverOS: NodeJS.Platform;
  serverOSVersion: string;
}

type PackagerOptions = ProjectSettings.ProjectSettings;

type CachedSignedManifest =
  | {
      manifestString: null;
      signedManifest: null;
    }
  | {
      manifestString: string;
      signedManifest: string;
    };

const _cachedSignedManifest: CachedSignedManifest = {
  manifestString: null,
  signedManifest: null,
};

const blacklistedEnvironmentVariables = new Set([
  'EXPO_APPLE_PASSWORD',
  'EXPO_ANDROID_KEY_PASSWORD',
  'EXPO_ANDROID_KEYSTORE_PASSWORD',
  'EXPO_IOS_DIST_P12_PASSWORD',
  'EXPO_IOS_PUSH_P12_PASSWORD',
  'EXPO_CLI_PASSWORD',
]);

function shouldExposeEnvironmentVariableInManifest(key: string) {
  if (blacklistedEnvironmentVariables.has(key.toUpperCase())) {
    return false;
  }
  return key.startsWith('REACT_NATIVE_') || key.startsWith('EXPO_');
}

export function stripPort(host: string | undefined): string | undefined {
  if (!host) {
    return host;
  }
  return new URL('/', `http://${host}`).hostname;
}

export async function getPackagerOptionsAsync(
  projectRoot: string
): Promise<[ProjectSettings.ProjectSettings, PackagerOptions]> {
  // Get packager opts and then copy into bundleUrlPackagerOpts
  const projectSettings = await ProjectSettings.readAsync(projectRoot);
  const bundleUrlPackagerOpts = JSON.parse(JSON.stringify(projectSettings));
  bundleUrlPackagerOpts.urlType = 'http';
  if (bundleUrlPackagerOpts.hostType === 'redirect') {
    bundleUrlPackagerOpts.hostType = 'tunnel';
  }
  return [projectSettings, bundleUrlPackagerOpts];
}

export async function getBundleUrlAsync({
  projectRoot,
  platform,
  projectSettings,
  bundleUrlPackagerOpts,
  mainModuleName,
  hostname,
}: {
  platform: string;
  hostname?: string;
  mainModuleName: string;
  projectRoot: string;
  projectSettings: PackagerOptions;
  bundleUrlPackagerOpts: PackagerOptions;
}): Promise<string> {
  const queryParams = constructBundleQueryParams(projectSettings);

  const path = `/${encodeURI(mainModuleName)}.bundle?platform=${encodeURIComponent(
    platform
  )}&${queryParams}`;

  return (await constructBundleUrlAsync(projectRoot, bundleUrlPackagerOpts, hostname)) + path;
}

function getPlatformFromRequest(headers: http.IncomingHttpHeaders): string {
  return (headers['exponent-platform'] || 'ios').toString();
}

export function getManifestHandler(projectRoot: string) {
  return async (
    req: express.Request | http.IncomingMessage,
    res: express.Response | http.ServerResponse,
    next: (err?: Error) => void
  ) => {
    // Only support `/`, `/manifest`, `/index.exp` for the manifest middleware.
    if (
      !req.url ||
      !['/', '/manifest', '/index.exp'].includes(
        // Strip the query params
        parse(req.url).pathname || req.url
      )
    ) {
      next();
      return;
    }

    try {
      const { manifestString, exp, hostInfo } = await getManifestResponseFromHeadersAsync({
        projectRoot,
        headers: req.headers,
      });
      const sdkVersion = exp.sdkVersion ?? null;

      // Send the response
      res.setHeader('Exponent-Server', JSON.stringify(hostInfo));
      // End the request
      res.end(manifestString);

      // Log analytics
      Analytics.logEvent('Serve Manifest', {
        developerTool: ProcessSettings.developerTool,
        sdkVersion,
      });
    } catch (e) {
      Log.error(e.stack);
      // 5xx = Server Error HTTP code
      res.statusCode = 520;
      res.end(
        JSON.stringify({
          error: e.toString(),
        })
      );
    }

    try {
      const deviceIds = req.headers['expo-dev-client-id'];
      if (deviceIds) {
        await ProjectSettings.saveDevicesAsync(projectRoot, deviceIds);
      }
    } catch (e) {
      Log.error(e.stack);
    }
  };
}

async function getManifestResponseFromHeadersAsync({
  projectRoot,
  headers,
}: {
  projectRoot: string;
  headers: http.IncomingHttpHeaders;
}): Promise<{ exp: ExpoConfig; manifestString: string; hostInfo: HostInfo }> {
  // Read from headers
  const platform = getPlatformFromRequest(headers);
  const acceptSignature = headers['exponent-accept-signature'];
  return getManifestResponseAsync({ projectRoot, host: headers.host, platform, acceptSignature });
}

export async function getExpoGoConfig({
  projectRoot,
  projectSettings,
  mainModuleName,
  hostname,
}: {
  projectRoot: string;
  projectSettings: ProjectSettings.ProjectSettings;
  mainModuleName: string;
  hostname: string | undefined;
}): Promise<ExpoGoConfig> {
  const [debuggerHost, logUrl] = await Promise.all([
    constructDebuggerHostAsync(projectRoot, hostname),
    constructLogUrlAsync(projectRoot, hostname),
  ]);
  return {
    developer: {
      tool: ProcessSettings.developerTool,
      projectRoot,
    },
    packagerOpts: projectSettings,
    mainModuleName,
    // Add this string to make Flipper register React Native / Metro as "running".
    // Can be tested by running:
    // `METRO_SERVER_PORT=19000 open -a flipper.app`
    // Where 19000 is the port where the Expo project is being hosted.
    __flipperHack: 'React Native packager is running',
    debuggerHost,
    logUrl,
  };
}

export async function getManifestResponseAsync({
  projectRoot,
  host,
  platform,
  acceptSignature,
}: {
  projectRoot: string;
  platform: string;
  host?: string;
  acceptSignature?: string | string[];
}): Promise<{ exp: ExpoAppManifest; manifestString: string; hostInfo: HostInfo }> {
  // Read the config
  const projectConfig = getConfig(projectRoot, { skipSDKVersionRequirement: true });
  // Opt towards newest functionality when expo isn't installed.
  if (!projectConfig.exp.sdkVersion) {
    projectConfig.exp.sdkVersion = 'UNVERSIONED';
  }
  // Read from headers
  const hostname = stripPort(host);

  // Get project entry point and initial module
  let entryPoint = resolveEntryPoint(projectRoot, platform, projectConfig);

  // NOTE(Bacon): Webpack is currently hardcoded to index.bundle on native
  // in the future (TODO) we should move this logic into a Webpack plugin and use
  // a generated file name like we do on web.
  if (Webpack.isTargetingNative()) {
    entryPoint = 'index.js';
  }
  const mainModuleName = stripJSExtension(entryPoint);
  // Gather packager and host info
  const hostInfo = await createHostInfoAsync();
  const [projectSettings, bundleUrlPackagerOpts] = await getPackagerOptionsAsync(projectRoot);
  // Create the manifest and set fields within it
  const expoGoConfig = await getExpoGoConfig({
    projectRoot,
    projectSettings,
    mainModuleName,
    hostname,
  });
  const hostUri = await constructHostUriAsync(projectRoot, hostname);
  const manifest: ExpoAppManifest = {
    ...(projectConfig.exp as ExpoAppManifest),
    ...expoGoConfig,
    hostUri,
  };
  // Adding the env variables to the Expo manifest is unsafe.
  // This feature is deprecated in SDK 41 forward.
  if (manifest.sdkVersion) {
    manifest.env = getManifestEnvironment();
  }

  // Add URLs to the manifest
  manifest.bundleUrl = await getBundleUrlAsync({
    projectRoot,
    platform,
    projectSettings,
    bundleUrlPackagerOpts,
    mainModuleName,
    hostname,
  });

  // Resolve all assets and set them on the manifest as URLs
  await resolveManifestAssets({
    projectRoot,
    manifest,
    async resolver(path) {
      if (Webpack.isTargetingNative()) {
        // When using our custom dev server, just do assets normally
        // without the `assets/` subpath redirect.
        return resolve(manifest.bundleUrl!.match(/^https?:\/\/.*?\//)![0], path);
      }
      return manifest.bundleUrl!.match(/^https?:\/\/.*?\//)![0] + 'assets/' + path;
    },
  });
  // The server normally inserts this but if we're offline we'll do it here
  await resolveGoogleServicesFile(projectRoot, manifest);

  // Create the final string
  let manifestString;
  try {
    manifestString = await getManifestStringAsync(manifest, hostInfo.host, acceptSignature);
  } catch (error) {
    if (error.code === 'UNAUTHORIZED_ERROR' && manifest.owner) {
      // Don't have permissions for siging, warn and enable offline mode.
      addSigningDisabledWarning(
        projectRoot,
        `This project belongs to ${chalk.bold(
          `@${manifest.owner}`
        )} and you have not been granted the appropriate permissions.\n` +
          `Please request access from an admin of @${manifest.owner} or change the "owner" field to an account you belong to.\n` +
          learnMore('https://docs.expo.dev/versions/latest/config/app/#owner')
      );
      ProcessSettings.isOffline = true;
      manifestString = await getManifestStringAsync(manifest, hostInfo.host, acceptSignature);
    } else if (error.code === 'ENOTFOUND') {
      // Got a DNS error, i.e. can't access exp.host, warn and enable offline mode.
      addSigningDisabledWarning(
        projectRoot,
        `Could not reach Expo servers, please check if you can access ${
          error.hostname || 'exp.host'
        }.`
      );
      ProcessSettings.isOffline = true;
      manifestString = await getManifestStringAsync(manifest, hostInfo.host, acceptSignature);
    } else {
      throw error;
    }
  }

  return {
    manifestString,
    exp: manifest,
    hostInfo,
  };
}

const addSigningDisabledWarning = (() => {
  let seen = false;
  return (projectRoot: string, reason: string) => {
    if (!seen) {
      seen = true;
      Log.warn(`${reason}\nFalling back to offline mode.`, 'signing-disabled');
    }
  };
})();

function getManifestEnvironment(): Record<string, any> {
  return Object.keys(process.env).reduce<Record<string, any>>((prev, key) => {
    if (shouldExposeEnvironmentVariableInManifest(key)) {
      prev[key] = process.env[key];
    }
    return prev;
  }, {});
}

async function getManifestStringAsync(
  manifest: ExpoAppManifest,
  hostUUID: string,
  acceptSignature?: string | string[]
): Promise<string> {
  const currentSession = await UserManager.getSessionAsync();
  if (!currentSession || ProcessSettings.isOffline) {
    manifest.id = `@${ANONYMOUS_USERNAME}/${manifest.slug}-${hostUUID}`;
  }
  if (!acceptSignature) {
    return JSON.stringify(manifest);
  } else if (!currentSession || ProcessSettings.isOffline) {
    return getUnsignedManifestString(manifest);
  } else {
    return await getSignedManifestStringAsync(manifest, currentSession);
  }
}

async function createHostInfoAsync(): Promise<HostInfo> {
  const host = await UserSettings.getAnonymousIdentifierAsync();

  return {
    host,
    // TODO: Do we keep this?
    server: 'xdl',
    serverVersion: process.env.__EXPO_VERSION,
    serverDriver: ProcessSettings.developerTool,
    serverOS: os.platform(),
    serverOSVersion: os.release(),
  };
}

export async function getSignedManifestStringAsync(
  manifest: Partial<ExpoAppManifest>,
  // NOTE: we currently ignore the currentSession that is passed in, see the note below about analytics.
  currentSession: { sessionSecret?: string; accessToken?: string }
) {
  const manifestString = JSON.stringify(manifest);
  if (_cachedSignedManifest.manifestString === manifestString) {
    return _cachedSignedManifest.signedManifest;
  }
  // WARNING: Removing the following line will regress analytics, see: https://github.com/expo/expo-cli/pull/2357
  // TODO: make this more obvious from code
  const user = await UserManager.ensureLoggedInAsync();
  const { response } = await ApiV2.clientForUser(user).postAsync('manifest/sign', {
    args: {
      remoteUsername: manifest.owner ?? (await UserManager.getCurrentUsernameAsync()),
      remotePackageName: manifest.slug,
    },
    manifest: manifest as JSONObject,
  });
  _cachedSignedManifest.manifestString = manifestString;
  _cachedSignedManifest.signedManifest = response;
  return response;
}

export function getUnsignedManifestString(manifest: ExpoConfig) {
  const unsignedManifest = {
    manifestString: JSON.stringify(manifest),
    signature: 'UNSIGNED',
  };
  return JSON.stringify(unsignedManifest);
}
