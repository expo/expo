import { ExpoUpdatesManifest } from '@expo/config';
import { Updates } from '@expo/config-plugins';
import accepts from 'accepts';
import crypto from 'crypto';
import FormData from 'form-data';
import { serializeDictionary, Dictionary } from 'structured-headers';

import { APISettings } from '../../../api/settings';
import UserSettings from '../../../api/user/UserSettings';
import { ANONYMOUS_USERNAME } from '../../../api/user/user';
import * as Log from '../../../log';
import { logEventAsync } from '../../../utils/analytics/rudderstackClient';
import {
  CodeSigningInfo,
  getCodeSigningInfoAsync,
  signManifestString,
} from '../../../utils/codesigning';
import { CommandError } from '../../../utils/errors';
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

    const easProjectId = exp.extra?.eas?.projectId as string | undefined | null;
    const scopeKey = await ExpoGoManifestHandlerMiddleware.getScopeKeyAsync({
      slug: exp.slug,
      codeSigningInfo,
    });

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

    const headers = this.getDefaultResponseHeaders();
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

  private static async getScopeKeyAsync({
    slug,
    codeSigningInfo,
  }: {
    slug: string;
    codeSigningInfo: CodeSigningInfo | null;
  }): Promise<string> {
    const scopeKeyFromCodeSigningInfo = codeSigningInfo?.scopeKey;
    if (scopeKeyFromCodeSigningInfo) {
      return scopeKeyFromCodeSigningInfo;
    }

    Log.warn(
      APISettings.isOffline
        ? 'Using anonymous scope key in manifest for offline mode with no cached development code signing info.'
        : 'Using anonymous scope key in manifest.'
    );
    return await getAnonymousScopeKeyAsync(slug);
  }
}

async function getAnonymousScopeKeyAsync(slug: string): Promise<string> {
  const userAnonymousIdentifier = await UserSettings.getAnonymousIdentifierAsync();
  return `@${ANONYMOUS_USERNAME}/${slug}-${userAnonymousIdentifier}`;
}

function convertToDictionaryItemsRepresentation(obj: { [key: string]: string }): Dictionary {
  return new Map(
    Object.entries(obj).map(([k, v]) => {
      return [k, [v, new Map()]];
    })
  );
}
