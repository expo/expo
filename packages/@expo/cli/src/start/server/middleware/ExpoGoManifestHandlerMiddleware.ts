import { ExpoUpdatesManifest } from '@expo/config';
import { Updates } from '@expo/config-plugins';
import accepts from 'accepts';
import assert from 'assert';
import crypto from 'crypto';
import FormData from 'form-data';
import { serializeDictionary, Dictionary } from 'structured-headers';

import { getProjectAsync } from '../../../api/getProject';
import { APISettings } from '../../../api/settings';
import { signExpoGoManifestAsync } from '../../../api/signManifest';
import UserSettings from '../../../api/user/UserSettings';
import { ANONYMOUS_USERNAME, getUserAsync } from '../../../api/user/user';
import { logEventAsync } from '../../../utils/analytics/rudderstackClient';
import {
  CodeSigningInfo,
  getCodeSigningInfoAsync,
  signManifestString,
} from '../../../utils/codesigning';
import { CommandError } from '../../../utils/errors';
import { memoize } from '../../../utils/fn';
import { stripPort } from '../../../utils/url';
import { ManifestMiddleware, ManifestRequestInfo } from './ManifestMiddleware';
import { assertRuntimePlatform, parsePlatformHeader } from './resolvePlatform';
import { ServerHeaders, ServerRequest } from './server.types';

const debug = require('debug')('expo:start:server:middleware:ExpoGoManifestHandlerMiddleware');

interface ExpoGoManifestRequestInfo extends ManifestRequestInfo {
  explicitlyPrefersMultipartMixed: boolean;
  expectSignature: string | null;
}

export class ExpoGoManifestHandlerMiddleware extends ManifestMiddleware<ExpoGoManifestRequestInfo> {
  public getParsedHeaders(req: ServerRequest): ExpoGoManifestRequestInfo {
    let platform = parsePlatformHeader(req);

    if (!platform) {
      debug(
        `No "expo-platform" header or "platform" query parameter specified. Falling back to "none".`
      );
      platform = 'none';
    }

    assertRuntimePlatform(platform);

    // Expo Updates clients explicitly accept "multipart/mixed" responses while browsers implicitly
    // accept them with "accept: */*". To make it easier to debug manifest responses by visiting their
    // URLs in a browser, we denote the response as "text/plain" if the user agent appears not to be
    // an Expo Updates client.
    const accept = accepts(req);
    const explicitlyPrefersMultipartMixed =
      accept.types(['unknown/unknown', 'multipart/mixed']) === 'multipart/mixed';

    const expectSignature = req.headers['expo-expect-signature'];

    return {
      explicitlyPrefersMultipartMixed,
      platform,
      acceptSignature: !!req.headers['expo-accept-signature'],
      expectSignature: expectSignature ? String(expectSignature) : null,
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

    const codeSigningInfo = await getCodeSigningInfoAsync(
      exp,
      requestOptions.expectSignature,
      this.options.privateKeyPath
    );

    const easProjectId = exp.extra?.eas?.projectId;
    const shouldUseAnonymousManifest = await shouldUseAnonymousManifestAsync(
      easProjectId,
      codeSigningInfo
    );
    const userAnonymousIdentifier = await UserSettings.getAnonymousIdentifierAsync();
    if (!shouldUseAnonymousManifest) {
      assert(easProjectId);
    }
    const scopeKey = shouldUseAnonymousManifest
      ? `@${ANONYMOUS_USERNAME}/${exp.slug}-${userAnonymousIdentifier}`
      : await this.getScopeKeyForProjectIdAsync(easProjectId);

    const expoUpdatesManifest: ExpoUpdatesManifest = {
      id: crypto.randomUUID(),
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

    const stringifiedManifest = JSON.stringify(expoUpdatesManifest);

    let manifestPartHeaders: { 'expo-signature': string } | null = null;
    let certificateChainBody: string | null = null;
    if (codeSigningInfo) {
      const signature = signManifestString(stringifiedManifest, codeSigningInfo);
      manifestPartHeaders = {
        'expo-signature': serializeDictionary(
          convertToDictionaryItemsRepresentation({
            keyid: codeSigningInfo.keyId,
            sig: signature,
            alg: 'rsa-v1_5-sha256',
          })
        ),
      };
      certificateChainBody = codeSigningInfo.certificateChainForResponse.join('\n');
    }

    const form = this.getFormData({
      stringifiedManifest,
      manifestPartHeaders,
      certificateChainBody,
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

  private getFormData({
    stringifiedManifest,
    manifestPartHeaders,
    certificateChainBody,
  }: {
    stringifiedManifest: string;
    manifestPartHeaders: { 'expo-signature': string } | null;
    certificateChainBody: string | null;
  }): FormData {
    const form = new FormData();
    form.append('manifest', stringifiedManifest, {
      contentType: 'application/json',
      header: {
        ...manifestPartHeaders,
      },
    });
    if (certificateChainBody && certificateChainBody.length > 0) {
      form.append('certificate_chain', certificateChainBody, {
        contentType: 'application/x-pem-file',
      });
    }
    return form;
  }

  protected trackManifest(version?: string) {
    logEventAsync('Serve Expo Updates Manifest', {
      runtimeVersion: version,
    });
  }

  private getSignedManifestStringAsync = memoize(signExpoGoManifestAsync);

  private getScopeKeyForProjectIdAsync = memoize(getScopeKeyForProjectIdAsync);
}

/**
 * 1. No EAS project ID in config, then use anonymous scope key
 * 2. When offline or not logged in
 *   a. If code signing not accepted by client (only legacy manifest signing is supported), then use anonymous scope key
 *   b. If code signing accepted by client and no development code signing certificate is cached, then use anonymous scope key
 */
async function shouldUseAnonymousManifestAsync(
  easProjectId: string | undefined | null,
  codeSigningInfo: CodeSigningInfo | null
): Promise<boolean> {
  if (!easProjectId || (APISettings.isOffline && codeSigningInfo === null)) {
    return true;
  }

  return !(await getUserAsync());
}

async function getScopeKeyForProjectIdAsync(projectId: string): Promise<string> {
  const project = await getProjectAsync(projectId);
  return project.scopeKey;
}

function convertToDictionaryItemsRepresentation(obj: { [key: string]: string }): Dictionary {
  return new Map(
    Object.entries(obj).map(([k, v]) => {
      return [k, [v, new Map()]];
    })
  );
}
