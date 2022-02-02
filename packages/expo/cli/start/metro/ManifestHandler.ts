import { ExpoAppManifest, ExpoConfig, ExpoGoConfig, getConfig } from '@expo/config';
import { JSONObject } from '@expo/json-file';
import chalk from 'chalk';
import express from 'express';
import http from 'http';
import os from 'os';
import { parse, resolve } from 'url';

import * as Log from '../../log';
import { logEvent } from '../../utils/analytics/rudderstackClient';
import { fetch } from '../../utils/fetch-api';
import { learnMore } from '../../utils/link';
import { stripPort } from '../../utils/url';
import { ensureLoggedInAsync } from '../../utils/user/actions';
import { ANONYMOUS_USERNAME, getActorDisplayName, getUserAsync } from '../../utils/user/user';
import ProcessSettings from '../api/ProcessSettings';
import * as ProjectDevices from '../api/ProjectDevices';
import UserSettings from '../api/UserSettings';
import {
  constructBundleQueryParams,
  constructBundleUrl,
  constructDebuggerHost,
  constructHostUri,
  constructLogUrl,
  stripJSExtension,
} from '../serverUrl';
import * as WebpackDevServer from '../webpack/WebpackDevServer';
import { getPlatformFromLegacyRequest } from './middleware';
import { resolveGoogleServicesFile, resolveManifestAssets } from './resolveAssets';
import { resolveEntryPoint } from './resolveEntryPoint';

interface HostInfo {
  host: string;
  server: 'expo';
  serverVersion: string;
  serverDriver: string | null;
  serverOS: NodeJS.Platform;
  serverOSVersion: string;
}

type CachedSignedManifest =
  | {
      manifestString: null;
      signedManifest: null;
    }
  | {
      manifestString: string;
      signedManifest: string;
    };

const cachedSignedManifest: CachedSignedManifest = {
  manifestString: null,
  signedManifest: null,
};

export function getBundleUrl({
  platform,
  mainModuleName,
  hostname,
}: {
  platform: string;
  hostname?: string;
  mainModuleName: string;
}): string {
  const queryParams = constructBundleQueryParams({
    dev: ProcessSettings.isDevMode,
    minify: ProcessSettings.minify,
  });

  const path = `/${encodeURI(mainModuleName)}.bundle?platform=${encodeURIComponent(
    platform
  )}&${queryParams}`;

  return (
    constructBundleUrl(
      {
        hostType: ProcessSettings.hostType,
        // hostType: ProcessSettings.hostType === 'redirect' ? 'tunnel' : ProcessSettings.hostType,
        scheme: ProcessSettings.scheme,
        lanType: ProcessSettings.lanType,
        minify: ProcessSettings.minify,
        dev: ProcessSettings.isDevMode,
        urlType: 'http',

        // urlType: ??
      },
      hostname
    ) + path
  );
}

function shouldContinue(req: express.Request | http.IncomingMessage) {
  return (
    !req.url ||
    !['/', '/manifest', '/index.exp'].includes(
      // Strip the query params
      parse(req.url).pathname || req.url
    )
  );
}

export function getManifestHandler(projectRoot: string) {
  return async (
    req: express.Request | http.IncomingMessage,
    res: express.Response | http.ServerResponse,
    next: (err?: Error) => void
  ) => {
    // Only support `/`, `/manifest`, `/index.exp` for the manifest middleware.
    if (shouldContinue(req)) {
      return next();
    }

    try {
      const { manifestString, manifest, hostInfo } = await getManifestResponseFromHeadersAsync(
        projectRoot,
        req
      );
      const sdkVersion = manifest.sdkVersion ?? null;

      // Send the response
      res.setHeader('Exponent-Server', JSON.stringify(hostInfo));
      // End the request
      res.end(manifestString);

      // Log analytics
      logEvent('Serve Manifest', {
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

    const deviceIds = req.headers['expo-dev-client-id'];
    if (deviceIds) {
      await ProjectDevices.saveDevicesAsync(projectRoot, deviceIds).catch((e) =>
        Log.error(e.stack)
      );
    }
  };
}

async function getManifestResponseFromHeadersAsync(
  projectRoot: string,
  req: express.Request | http.IncomingMessage
): Promise<{ manifest: ExpoConfig; manifestString: string; hostInfo: HostInfo }> {
  // Read from headers
  const platform = getPlatformFromLegacyRequest(req);
  const acceptSignature = req.headers['exponent-accept-signature'];
  return getManifestResponseAsync(projectRoot, {
    host: req.headers.host,
    platform,
    acceptSignature,
  });
}

export function getExpoGoConfig({
  projectRoot,
  packagerOpts,
  mainModuleName,
  hostname,
}: {
  projectRoot: string;
  packagerOpts: {
    // Required for dev client.
    dev: boolean;
  };
  mainModuleName: string;
  hostname: string | undefined;
}): ExpoGoConfig {
  const debuggerHost = constructDebuggerHost(hostname);
  const logUrl = constructLogUrl(hostname);
  return {
    // Required for Expo Go to function.
    developer: {
      tool: ProcessSettings.developerTool,
      projectRoot,
    },
    packagerOpts,
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

export async function getManifestResponseAsync(
  projectRoot: string,
  {
    host,
    platform,
    acceptSignature,
  }: {
    platform: string;
    host?: string;
    acceptSignature?: string | string[];
  }
): Promise<{ manifest: ExpoAppManifest; manifestString: string; hostInfo: HostInfo }> {
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
  if (WebpackDevServer.isTargetingNative()) {
    entryPoint = 'index.js';
  }
  const mainModuleName = stripJSExtension(entryPoint);
  // Gather packager and host info
  const hostInfo = await createHostInfoAsync();
  // Create the manifest and set fields within it
  const expoGoConfig = getExpoGoConfig({
    projectRoot,
    packagerOpts: {
      dev: ProcessSettings.isDevMode,
    },
    mainModuleName,
    hostname,
  });
  const hostUri = constructHostUri(hostname);
  const manifest: ExpoAppManifest = {
    ...(projectConfig.exp as ExpoAppManifest),
    ...expoGoConfig,
    hostUri,
  };

  // Add URLs to the manifest
  manifest.bundleUrl = getBundleUrl({
    platform,
    mainModuleName,
    hostname,
  });

  // Resolve all assets and set them on the manifest as URLs
  await resolveManifestAssets(projectRoot, {
    manifest,
    async resolver(path) {
      if (WebpackDevServer.isTargetingNative()) {
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
  const manifestString = await fetchComputedManifestStringAsync(projectRoot, {
    manifest,
    hostInfo,
    acceptSignature,
  });

  return {
    manifestString,
    manifest,
    hostInfo,
  };
}

async function fetchComputedManifestStringAsync(
  projectRoot: string,
  {
    manifest,
    hostInfo,
    acceptSignature,
  }: { manifest: ExpoAppManifest; hostInfo: HostInfo; acceptSignature: string | string[] }
) {
  try {
    return await getManifestStringAsync(manifest, hostInfo.host, acceptSignature);
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
      return await getManifestStringAsync(manifest, hostInfo.host, acceptSignature);
    } else if (error.code === 'ENOTFOUND') {
      // Got a DNS error, i.e. can't access exp.host, warn and enable offline mode.
      addSigningDisabledWarning(
        projectRoot,
        `Could not reach Expo servers, please check if you can access ${
          error.hostname || 'exp.host'
        }.`
      );
      ProcessSettings.isOffline = true;
      return await getManifestStringAsync(manifest, hostInfo.host, acceptSignature);
    } else {
      throw error;
    }
  }
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

async function getManifestStringAsync(
  manifest: ExpoAppManifest,
  hostUUID: string,
  acceptSignature?: string | string[]
): Promise<string> {
  const currentSession = await getUserAsync();
  if (!currentSession || ProcessSettings.isOffline) {
    manifest.id = `@${ANONYMOUS_USERNAME}/${manifest.slug}-${hostUUID}`;
  }
  if (!acceptSignature) {
    return JSON.stringify(manifest);
  } else if (!currentSession || ProcessSettings.isOffline) {
    return getUnsignedManifestString(manifest);
  } else {
    return await getSignedManifestStringAsync(manifest);
  }
}

// Passed to Expo Go and registered as telemetry.
// TODO: it's unclear why we don't just send it from the CLI.
async function createHostInfoAsync(): Promise<HostInfo> {
  const host = await UserSettings.getAnonymousIdentifierAsync();

  return {
    host,
    server: 'expo',
    serverVersion: process.env.__EXPO_VERSION,
    serverDriver: ProcessSettings.developerTool,
    serverOS: os.platform(),
    serverOSVersion: os.release(),
  };
}

export async function getSignedManifestStringAsync(manifest: Partial<ExpoAppManifest>) {
  const manifestString = JSON.stringify(manifest);
  if (cachedSignedManifest.manifestString === manifestString) {
    return cachedSignedManifest.signedManifest;
  }
  await ensureLoggedInAsync();
  const res = await fetch('/manifest/sign', {
    method: 'POST',
    body: JSON.stringify({
      args: {
        remoteUsername: manifest.owner ?? getActorDisplayName(await getUserAsync()),
        remotePackageName: manifest.slug,
      },
      manifest: manifest as JSONObject,
    }),
  });
  const { data } = await res.json();

  const response = data.response;
  cachedSignedManifest.manifestString = manifestString;
  cachedSignedManifest.signedManifest = response;
  return response;
}

export function getUnsignedManifestString(manifest: ExpoConfig) {
  const unsignedManifest = {
    manifestString: JSON.stringify(manifest),
    signature: 'UNSIGNED',
  };
  return JSON.stringify(unsignedManifest);
}
