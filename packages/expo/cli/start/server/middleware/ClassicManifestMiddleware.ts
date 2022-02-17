import { ExpoAppManifest, ExpoConfig, getConfig } from '@expo/config';
import chalk from 'chalk';
import express from 'express';
import http from 'http';
import os from 'os';
import { parse, resolve } from 'url';

import { signExpoGoManifestAsync } from '../../../api/signManifest';
import { ANONYMOUS_USERNAME, getUserAsync } from '../../../api/user/user';
import UserSettings from '../../../api/user/UserSettings';
import * as Log from '../../../log';
import { logEvent } from '../../../utils/analytics/rudderstackClient';
import { learnMore } from '../../../utils/link';
import { stripExtension, stripPort } from '../../../utils/url';
import { ProcessSettings } from '../../ProcessSettings';
import * as ProjectDevices from '../../project/ProjectDevices';
import { getPlatformFromLegacyRequest } from './getPlatformFromRequest';
import { DEVELOPER_TOOL, ManifestHandlerMiddleware } from './ManifestMiddleware';
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

function shouldContinue(req: express.Request | http.IncomingMessage) {
  return (
    !req.url ||
    !['/', '/manifest', '/index.exp'].includes(
      // Strip the query params
      parse(req.url).pathname || req.url
    )
  );
}

export class ClassicManifestMiddleware extends ManifestHandlerMiddleware {
  async getManifestResponseAsync(
    projectRoot: string,
    {
      host,
      platform,
      acceptSignature,
      isNativeWebpack,
    }: {
      isNativeWebpack?: boolean;
      platform: string;
      host?: string;
      acceptSignature?: string | string[];
    }
  ): Promise<{ manifest: ExpoAppManifest; manifestString: string; hostInfo: HostInfo }> {
    // Read the config
    const projectConfig = getConfig(projectRoot);

    // Read from headers
    const hostname = stripPort(host);

    // Get project entry point and initial module
    let entryPoint = resolveEntryPoint(projectRoot, platform, projectConfig);

    // NOTE(Bacon): Webpack is currently hardcoded to index.bundle on native
    // in the future (TODO) we should move this logic into a Webpack plugin and use
    // a generated file name like we do on web.
    // const server = getDefaultDevServer();
    // // TODO: Move this into BundlerDevServer and read this info from self.
    // const isNativeWebpack = server instanceof WebpackBundlerDevServer && server.isTargetingNative();
    if (isNativeWebpack) {
      entryPoint = 'index.js';
    }
    const mainModuleName = stripExtension(entryPoint, 'js');
    // Gather packager and host info
    const hostInfo = await createHostInfoAsync();
    // Create the manifest and set fields within it
    const expoGoConfig = this.getExpoGoConfig({
      projectRoot,
      packagerOpts: {
        dev: this.options.mode === 'development',
      },
      mainModuleName,
      hostname,
    });
    const hostUri = this.options.constructUrl({ scheme: '', hostname });
    const manifest: ExpoAppManifest = {
      ...(projectConfig.exp as ExpoAppManifest),
      ...expoGoConfig,
      hostUri,
    };

    // Add URLs to the manifest
    manifest.bundleUrl = this.getBundleUrl({
      platform,
      mainModuleName,
      hostname,
    });

    // Resolve all assets and set them on the manifest as URLs
    await resolveManifestAssets(projectRoot, {
      manifest,
      async resolver(path) {
        if (isNativeWebpack) {
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

  private getManifestResponseFromHeadersAsync = async (
    req: express.Request | http.IncomingMessage
  ): Promise<{ manifest: ExpoConfig; manifestString: string; hostInfo: HostInfo }> => {
    // Read from headers
    const platform = getPlatformFromLegacyRequest(req);
    const acceptSignature = req.headers['exponent-accept-signature'];
    return this.getManifestResponseAsync(this.projectRoot, {
      host: req.headers.host,
      platform,
      acceptSignature,
      isNativeWebpack: this.options.isNativeWebpack,
    });
  };

  getHandler(): (
    req: express.Request | http.IncomingMessage,
    res: express.Response | http.ServerResponse,
    next: (err?: Error) => void
  ) => Promise<void> {
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
        const { manifestString, manifest, hostInfo } =
          await this.getManifestResponseFromHeadersAsync(req);
        const sdkVersion = manifest.sdkVersion ?? null;

        // Send the response
        res.setHeader('Exponent-Server', JSON.stringify(hostInfo));
        // End the request
        res.end(manifestString);

        // Log analytics
        logEvent('Serve Manifest', {
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
        await ProjectDevices.saveDevicesAsync(this.projectRoot, deviceIds).catch((e) =>
          Log.error(e.stack)
        );
      }
    };
  }
}

async function fetchComputedManifestStringAsync(
  projectRoot: string,
  {
    manifest,
    hostInfo,
    acceptSignature,
  }: { manifest: ExpoAppManifest; hostInfo: HostInfo; acceptSignature: string | string[] }
): Promise<string> {
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
    serverDriver: DEVELOPER_TOOL,
    serverOS: os.platform(),
    serverOSVersion: os.release(),
  };
}

export async function getSignedManifestStringAsync(manifest: Partial<ExpoAppManifest>) {
  const manifestString = JSON.stringify(manifest);
  if (cachedSignedManifest.manifestString === manifestString) {
    return cachedSignedManifest.signedManifest;
  }
  const response = await signExpoGoManifestAsync(manifest);

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
