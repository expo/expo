import { ExpoUpdatesManifest, getConfig } from '@expo/config';
import { Updates } from '@expo/config-plugins';
import { JSONObject } from '@expo/json-file';
import express from 'express';
import http from 'http';
import nullthrows from 'nullthrows';
import { parse } from 'url';
import { v4 as uuidv4 } from 'uuid';
import * as Log from '../../log';

import { constructHostUriAsync, stripJSExtension } from '../serverUrl';
import {
  getBundleUrlAsync,
  getExpoGoConfig,
  getPackagerOptionsAsync,
  stripPort,
} from './ManifestHandler';
import { resolveManifestAssets } from './ProjectAssets';
import { resolveEntryPoint } from './resolveEntryPoint';
import UserSettings from '../api/UserSettings';
import ProcessSettings from '../api/ProcessSettings';

function getPlatformFromRequest(req: express.Request | http.IncomingMessage): 'android' | 'ios' {
  const url = req.url ? parse(req.url, /* parseQueryString */ true) : null;
  const platform = url?.query.platform || req.headers['expo-platform'];
  if (!platform) {
    throw new Error('Must specify expo-platform header or query parameter');
  }

  const stringifiedPlatform = String(platform);
  if (!['android', 'ios'].includes(stringifiedPlatform)) {
    throw new Error(`platform must be "android" or "ios". Recieved: "${platform}"`);
  }
  return stringifiedPlatform as 'android' | 'ios';
}

/**
 * Whether an anonymous scope key should be used. It should be used when:
 * 1. Offline
 * 2. Not logged-in
 * 3. No EAS project ID in config
 */
async function shouldUseAnonymousManifestAsync(
  easProjectId: string | undefined | null
): Promise<boolean> {
  if (!easProjectId || ProcessSettings.isOffline) {
    return true;
  }

  const currentSession = await UserManager.getSessionAsync();
  if (!currentSession) {
    return true;
  }

  return false;
}

async function getScopeKeyForProjectIdAsync(projectId: string): Promise<string> {
  const user = await UserManager.ensureLoggedInAsync();
  const project = await ApiV2.clientForUser(user).getAsync(
    `projects/${encodeURIComponent(projectId)}`
  );
  return project.scopeKey;
}

async function signManifestAsync(manifest: ExpoUpdatesManifest): Promise<string> {
  const user = await UserManager.ensureLoggedInAsync();
  const { signature } = await ApiV2.clientForUser(user).postAsync('manifest/eas/sign', {
    manifest: manifest as any as JSONObject,
  });
  return signature;
}

export async function getManifestResponseAsync({
  projectRoot,
  platform,
  host,
  acceptSignature,
}: {
  projectRoot: string;
  platform: 'android' | 'ios';
  host?: string;
  acceptSignature: boolean;
}): Promise<{
  body: ExpoUpdatesManifest;
  headers: Map<string, number | string | readonly string[]>;
}> {
  const headers = new Map<string, any>();
  // set required headers for Expo Updates manifest specification
  headers.set('expo-protocol-version', 0);
  headers.set('expo-sfv-version', 0);
  headers.set('cache-control', 'private, max-age=0');
  headers.set('content-type', 'application/json');

  const hostname = stripPort(host);
  const [projectSettings, bundleUrlPackagerOpts] = await getPackagerOptionsAsync(projectRoot);
  const projectConfig = getConfig(projectRoot);
  const entryPoint = resolveEntryPoint(projectRoot, platform, projectConfig);
  const mainModuleName = stripJSExtension(entryPoint);
  const expoConfig = projectConfig.exp;
  const expoGoConfig = await getExpoGoConfig({
    projectRoot,
    projectSettings,
    mainModuleName,
    hostname,
  });

  const hostUri = await constructHostUriAsync(projectRoot, hostname);

  const runtimeVersion = Updates.getRuntimeVersion(
    { ...expoConfig, runtimeVersion: expoConfig.runtimeVersion ?? { policy: 'sdkVersion' } },
    platform
  );

  const bundleUrl = await getBundleUrlAsync({
    projectRoot,
    platform,
    projectSettings,
    bundleUrlPackagerOpts,
    mainModuleName,
    hostname,
  });

  await resolveManifestAssets({
    projectRoot,
    manifest: expoConfig,
    async resolver(path) {
      return bundleUrl!.match(/^https?:\/\/.*?\//)![0] + 'assets/' + path;
    },
  });

  const easProjectId = expoConfig.extra?.eas?.projectId;
  const shouldUseAnonymousManifest = await shouldUseAnonymousManifestAsync(easProjectId);
  const userAnonymousIdentifier = await UserSettings.getAnonymousIdentifierAsync();
  const scopeKey = shouldUseAnonymousManifest
    ? `@${ANONYMOUS_USERNAME}/${expoConfig.slug}-${userAnonymousIdentifier}`
    : await getScopeKeyForProjectIdAsync(nullthrows(easProjectId));

  const expoUpdatesManifest = {
    id: uuidv4(),
    createdAt: new Date().toISOString(),
    runtimeVersion,
    launchAsset: {
      key: 'bundle',
      contentType: 'application/javascript',
      url: bundleUrl,
    },
    assets: [], // assets are not used in development
    metadata: {}, // required for the client to detect that this is an expo-updates manifest
    extra: {
      eas: {
        projectId: easProjectId ?? undefined,
      },
      expoClient: {
        ...expoConfig,
        hostUri,
      },
      expoGo: expoGoConfig,
      scopeKey,
    },
  };

  if (acceptSignature && !shouldUseAnonymousManifest) {
    const manifestSignature = await signManifestAsync(expoUpdatesManifest);
    headers.set('expo-manifest-signature', manifestSignature);
  }

  return {
    body: expoUpdatesManifest,
    headers,
  };
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
      const { body, headers } = await getManifestResponseAsync({
        projectRoot,
        host: req.headers.host,
        platform: getPlatformFromRequest(req),
        acceptSignature: !!req.headers['expo-accept-signature'],
      });
      for (const [headerName, headerValue] of headers) {
        res.setHeader(headerName, headerValue);
      }
      res.end(JSON.stringify(body));

      Analytics.logEvent('Serve Expo Updates Manifest', {
        developerTool: ProcessSettings.developerTool,
        runtimeVersion: (body as any).runtimeVersion,
      });
    } catch (e) {
      Log.error(e.stack);
      res.statusCode = 520;
      res.end(
        JSON.stringify({
          error: e.toString(),
        })
      );
    }
  };
}
