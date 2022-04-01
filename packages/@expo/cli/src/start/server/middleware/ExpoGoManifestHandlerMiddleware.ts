import { ExpoUpdatesManifest } from '@expo/config';
import { Updates } from '@expo/config-plugins';
import accepts from 'accepts';
import assert from 'assert';
import FormData from 'form-data';
import { v4 as uuidv4 } from 'uuid';

import { getProjectAsync } from '../../../api/getProject';
import { APISettings } from '../../../api/settings';
import { signExpoGoManifestAsync } from '../../../api/signManifest';
import UserSettings from '../../../api/user/UserSettings';
import { ANONYMOUS_USERNAME, getUserAsync } from '../../../api/user/user';
import { logEvent } from '../../../utils/analytics/rudderstackClient';
import { CommandError } from '../../../utils/errors';
import { memoize } from '../../../utils/fn';
import { stripPort } from '../../../utils/url';
import { ManifestMiddleware, ManifestRequestInfo } from './ManifestMiddleware';
import {
  assertMissingRuntimePlatform,
  assertRuntimePlatform,
  parsePlatformHeader,
} from './resolvePlatform';
import { ServerHeaders, ServerRequest } from './server.types';

interface ExpoGoManifestRequestInfo extends ManifestRequestInfo {
  explicitlyPrefersMultipartMixed: boolean;
}

export class ExpoGoManifestHandlerMiddleware extends ManifestMiddleware<ExpoGoManifestRequestInfo> {
  public getParsedHeaders(req: ServerRequest): ExpoGoManifestRequestInfo {
    const platform = parsePlatformHeader(req);
    assertMissingRuntimePlatform(platform);
    assertRuntimePlatform(platform);

    // Expo Updates clients explicitly accept "multipart/mixed" responses while browsers implicitly
    // accept them with "accept: */*". To make it easier to debug manifest responses by visiting their
    // URLs in a browser, we denote the response as "text/plain" if the user agent appears not to be
    // an Expo Updates client.
    const accept = accepts(req);
    const explicitlyPrefersMultipartMixed =
      accept.types(['unknown/unknown', 'multipart/mixed']) === 'multipart/mixed';

    return {
      explicitlyPrefersMultipartMixed,
      platform,
      acceptSignature: !!req.headers['expo-accept-signature'],
      hostname: stripPort(req.headers['host']),
    };
  }

  private getDefaultResponseHeaders(): ServerHeaders {
    const headers = new Map<string, number | string | readonly string[]>();
    // set required headers for Expo Updates manifest specification
    headers.set('expo-protocol-version', 0);
    headers.set('expo-sfv-version', 0);
    headers.set('cache-control', 'private, max-age=0');
    return headers;
  }

  public async _getManifestResponseAsync(requestOptions: ExpoGoManifestRequestInfo): Promise<{
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
    if (!runtimeVersion) {
      throw new CommandError(
        'MANIFEST_MIDDLEWARE',
        `Unable to determine runtime version for platform '${requestOptions.platform}'`
      );
    }

    const easProjectId = exp.extra?.eas?.projectId;
    const shouldUseAnonymousManifest = await shouldUseAnonymousManifestAsync(easProjectId);
    const userAnonymousIdentifier = await UserSettings.getAnonymousIdentifierAsync();
    if (!shouldUseAnonymousManifest) {
      assert(easProjectId);
    }
    const scopeKey = shouldUseAnonymousManifest
      ? `@${ANONYMOUS_USERNAME}/${exp.slug}-${userAnonymousIdentifier}`
      : await this.getScopeKeyForProjectIdAsync(easProjectId);

    const expoUpdatesManifest: ExpoUpdatesManifest = {
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
      const manifestSignature = await this.getSignedManifestStringAsync(expoUpdatesManifest);
      headers.set('expo-manifest-signature', manifestSignature);
    }

    const form = this.getFormData({
      stringifiedManifest: JSON.stringify(expoUpdatesManifest),
    });

    headers.set(
      'content-type',
      requestOptions.explicitlyPrefersMultipartMixed
        ? `multipart/mixed; boundary=${form.getBoundary()}`
        : 'text/plain'
    );

    return {
      body: form.getBuffer().toString(),
      version: runtimeVersion,
      headers,
    };
  }

  private getFormData({ stringifiedManifest }: { stringifiedManifest: string }): FormData {
    const form = new FormData();
    form.append('manifest', stringifiedManifest, {
      contentType: 'application/json',
    });
    return form;
  }

  protected trackManifest(version?: string) {
    logEvent('Serve Expo Updates Manifest', {
      runtimeVersion: version,
    });
  }

  private getSignedManifestStringAsync = memoize(signExpoGoManifestAsync);

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
