import { Updates } from '@expo/config-plugins';
import assert from 'assert';
import { v4 as uuidv4 } from 'uuid';

import { getProjectAsync } from '../../../api/getProject';
import { APISettings } from '../../../api/settings';
import { signExpoGoManifestAsync } from '../../../api/signManifest';
import UserSettings from '../../../api/user/UserSettings';
import { ANONYMOUS_USERNAME, getUserAsync } from '../../../api/user/user';
import { logEvent } from '../../../utils/analytics/rudderstackClient';
import { memoize } from '../../../utils/fn';
import { stripPort } from '../../../utils/url';
import { ManifestMiddleware, ParsedHeaders } from './ManifestMiddleware';
import {
  parsePlatformHeader,
  assertMissingRuntimePlatform,
  assertRuntimePlatform,
} from './resolvePlatform';
import { ServerHeaders, ServerRequest } from './server.types';

export class ExpoGoManifestHandlerMiddleware extends ManifestMiddleware {
  public getParsedHeaders(req: ServerRequest): ParsedHeaders {
    const platform = parsePlatformHeader(req);
    assertMissingRuntimePlatform(platform);
    assertRuntimePlatform(platform);

    return {
      platform,
      acceptSignature: !!req.headers['expo-accept-signature'],
      hostname: stripPort(req.headers['host']),
    };
  }

  protected getDefaultResponseHeaders(): Map<string, any> {
    const headers = new Map<string, any>();
    // set required headers for Expo Updates manifest specification
    headers.set('expo-protocol-version', 0);
    headers.set('expo-sfv-version', 0);
    headers.set('cache-control', 'private, max-age=0');
    headers.set('content-type', 'application/json');
    return headers;
  }

  public async _getManifestResponseAsync(requestOptions: ParsedHeaders): Promise<{
    body: string;
    version: string;
    headers: ServerHeaders;
  }> {
    const { exp, hostUri, expoGoConfig, bundleUrl } = await this._resolveProjectSettingsAsync(
      requestOptions
    );

    const runtimeVersion = Updates.getRuntimeVersion(
      { ...exp, runtimeVersion: exp.runtimeVersion ?? { policy: 'sdkVersion' } },
      requestOptions.platform
    );

    const easProjectId = exp.extra?.eas?.projectId;
    const shouldUseAnonymousManifest = await shouldUseAnonymousManifestAsync(easProjectId);
    const userAnonymousIdentifier = await UserSettings.getAnonymousIdentifierAsync();
    if (!shouldUseAnonymousManifest) {
      assert(easProjectId);
    }
    const scopeKey = shouldUseAnonymousManifest
      ? `@${ANONYMOUS_USERNAME}/${exp.slug}-${userAnonymousIdentifier}`
      : await this.getScopeKeyForProjectIdAsync(easProjectId);

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
          ...exp,
          hostUri,
        },
        expoGo: expoGoConfig,
        scopeKey,
      },
    };

    const headers = this.getDefaultResponseHeaders();
    if (requestOptions.acceptSignature && !shouldUseAnonymousManifest) {
      // TODO: Should this also be memoized?
      const manifestSignature = await signExpoGoManifestAsync(expoUpdatesManifest);
      headers.set('expo-manifest-signature', manifestSignature);
    }

    return {
      body: JSON.stringify(expoUpdatesManifest),
      version: runtimeVersion,
      headers,
    };
  }

  protected trackManifest(version?: string) {
    logEvent('Serve Expo Updates Manifest', {
      runtimeVersion: version,
    });
  }

  private getScopeKeyForProjectIdAsync = memoize(getScopeKeyForProjectIdAsync);
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
  if (!easProjectId || APISettings.isOffline) {
    return true;
  }

  return !(await getUserAsync());
}

async function getScopeKeyForProjectIdAsync(projectId: string): Promise<string> {
  const project = await getProjectAsync(projectId);
  return project.scopeKey;
}
