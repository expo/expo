import { ExpoUpdatesManifest, getConfig } from '@expo/config';
import { Updates } from '@expo/config-plugins';
import assert from 'assert';
import express from 'express';
import http from 'http';
import { parse } from 'url';
import { v4 as uuidv4 } from 'uuid';

import { getProjectAsync } from '../../../api/getProject';
import { signEASManifestAsync } from '../../../api/signManifest';
import { ANONYMOUS_USERNAME, getUserAsync } from '../../../api/user/user';
import UserSettings from '../../../api/user/UserSettings';
import * as Log from '../../../log';
import { logEvent } from '../../../utils/analytics/rudderstackClient';
import { stripExtension, stripPort } from '../../../utils/url';
import { ProcessSettings } from '../../ProcessSettings';
import { getPlatformFromRequest } from './getPlatformFromRequest';
import { ManifestHandlerMiddleware } from './ManifestMiddleware';
import { resolveManifestAssets } from './resolveAssets';
import { resolveEntryPoint } from './resolveEntryPoint';

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

  return !(await getUserAsync());
}

async function getScopeKeyForProjectIdAsync(projectId: string): Promise<string> {
  const project = await getProjectAsync(projectId);
  return project.scopeKey;
}

export class ExpoGoManifestHandlerMiddleware extends ManifestHandlerMiddleware {
  async _getManifestResponseAsync(
    projectRoot: string,
    {
      platform,
      host,
      acceptSignature,
    }: {
      platform: 'android' | 'ios';
      host?: string;
      acceptSignature: boolean;
    }
  ): Promise<{
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
    const projectConfig = getConfig(projectRoot);
    const entryPoint = resolveEntryPoint(projectRoot, platform, projectConfig);
    const mainModuleName = stripExtension(entryPoint, 'js');
    const expoConfig = projectConfig.exp;
    const expoGoConfig = this.getExpoGoConfig({
      projectRoot,
      packagerOpts: {
        dev: this.options.mode === 'development',
      },
      mainModuleName,
      hostname,
    });

    const hostUri = this.urlCreator.constructUrl({ scheme: '', hostname });

    const runtimeVersion = Updates.getRuntimeVersion(
      { ...expoConfig, runtimeVersion: expoConfig.runtimeVersion ?? { policy: 'sdkVersion' } },
      platform
    );

    const bundleUrl = this.getBundleUrl({
      platform,
      mainModuleName,
      hostname,
    });

    await resolveManifestAssets(projectRoot, {
      manifest: expoConfig,
      async resolver(path) {
        return bundleUrl!.match(/^https?:\/\/.*?\//)![0] + 'assets/' + path;
      },
    });

    const easProjectId = expoConfig.extra?.eas?.projectId;
    const shouldUseAnonymousManifest = await shouldUseAnonymousManifestAsync(easProjectId);
    const userAnonymousIdentifier = await UserSettings.getAnonymousIdentifierAsync();
    if (!shouldUseAnonymousManifest) {
      assert(easProjectId);
    }
    const scopeKey = shouldUseAnonymousManifest
      ? `@${ANONYMOUS_USERNAME}/${expoConfig.slug}-${userAnonymousIdentifier}`
      : await getScopeKeyForProjectIdAsync(easProjectId);

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
      const manifestSignature = await signEASManifestAsync(expoUpdatesManifest);
      headers.set('expo-manifest-signature', manifestSignature);
    }

    return {
      body: expoUpdatesManifest,
      headers,
    };
  }

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
        const { body, headers } = await this._getManifestResponseAsync(this.projectRoot, {
          host: req.headers.host,
          platform: getPlatformFromRequest(req),
          acceptSignature: !!req.headers['expo-accept-signature'],
        });
        for (const [headerName, headerValue] of headers) {
          res.setHeader(headerName, headerValue);
        }
        res.end(JSON.stringify(body));

        logEvent('Serve Expo Updates Manifest', {
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
}
