import { events } from '2g';
import type { ExpoUpdatesManifest } from '@expo/config';
import { Updates } from '@expo/config-plugins';
import accepts from 'accepts';
import crypto from 'crypto';
import type { FormEntry } from 'multitars';
import { iterableToStream, streamMultipart, multipartContentType, MultipartPart } from 'multitars';
import type { Dictionary } from 'structured-headers';
import { serializeDictionary } from 'structured-headers';

import { getAnonymousIdAsync } from '../../../api/user/UserSettings';
import { ANONYMOUS_USERNAME } from '../../../api/user/user';
import type { CodeSigningInfo } from '../../../utils/codesigning';
import { getCodeSigningInfoAsync, signManifestString } from '../../../utils/codesigning';
import { CommandError } from '../../../utils/errors';
import { stripPort } from '../../../utils/url';
import type { ManifestRequestInfo } from './ManifestMiddleware';
import { ManifestMiddleware } from './ManifestMiddleware';
import { manifestDebugEvent } from './events';
import { parseForwardedRequestInfo } from './resolveForwarded';
import type { RuntimePlatform } from './resolvePlatform';
import { assertRuntimePlatform, parsePlatformHeader } from './resolvePlatform';
import { resolveRuntimeVersionWithExpoUpdatesAsync } from './resolveRuntimeVersionWithExpoUpdatesAsync';
import type { ServerRequest } from './server.types';

const MULTIPART_TYPE = 'multipart/form-data';

declare module '2g' {
  interface EventRegistry {
    'manifest:served': {
      type: 'expo-go' | 'dev-client';
      runtimeVersion: string;
      sdkVersion: string | null;
    };
  }
}

const event = events('manifest');

let multipartMixedContentType = multipartContentType;
if (multipartMixedContentType.startsWith(MULTIPART_TYPE)) {
  multipartMixedContentType =
    'multipart/mixed' + multipartMixedContentType.slice(MULTIPART_TYPE.length);
}

export enum ResponseContentType {
  TEXT_PLAIN,
  APPLICATION_JSON,
  APPLICATION_EXPO_JSON,
  MULTIPART_MIXED,
}

interface ExpoGoManifestRequestInfo extends ManifestRequestInfo {
  responseContentType: ResponseContentType;
  expectSignature: string | null;
}

export class ExpoGoManifestHandlerMiddleware extends ManifestMiddleware<ExpoGoManifestRequestInfo> {
  /**
   * Runtime versions resolved by the `expo-updates` CLI, keyed by platform.
   *
   * Resolving a `{ policy: 'fingerprint' }` runtime version spawns an `expo-updates
   * runtimeversion:resolve` subprocess that re-hashes the whole project, which takes
   * seconds on a real app. Because it runs in a subprocess, nothing survives between
   * requests, so every manifest request used to pay the full cost. Dev clients fetch the
   * manifest before the bundle, and the iOS launcher times out well before a large
   * project finishes fingerprinting.
   *
   * The pending promise is cached rather than the resolved value, so concurrent requests
   * share a single subprocess instead of racing several of them.
   *
   * This is cleared by `invalidateRuntimeVersionCache` whenever the file watcher observes
   * a change, so a cached value never outlives its inputs.
   */
  private runtimeVersionCache = new Map<RuntimePlatform, Promise<string | null>>();

  public getParsedHeaders(req: ServerRequest): ExpoGoManifestRequestInfo {
    let platform = parsePlatformHeader(req);

    if (!platform) {
      manifestDebugEvent('no_platform_header', {});
      platform = 'ios';
    }

    assertRuntimePlatform(platform);

    // Expo Updates clients explicitly accept "multipart/mixed" responses while browsers implicitly
    // accept them with "accept: */*". To make it easier to debug manifest responses by visiting their
    // URLs in a browser, we denote the response as "text/plain" if the user agent appears not to be
    // an Expo Updates client.
    const accept = accepts(req);
    const acceptedType = accept.types([
      'unknown/unknown',
      'multipart/mixed',
      'application/json',
      'application/expo+json',
      'text/plain',
    ]);

    let responseContentType;
    switch (acceptedType) {
      case 'multipart/mixed':
        responseContentType = ResponseContentType.MULTIPART_MIXED;
        break;
      case 'application/json':
        responseContentType = ResponseContentType.APPLICATION_JSON;
        break;
      case 'application/expo+json':
        responseContentType = ResponseContentType.APPLICATION_EXPO_JSON;
        break;
      default:
        responseContentType = ResponseContentType.TEXT_PLAIN;
        break;
    }

    const expectSignature = req.headers['expo-expect-signature'];
    const forwarded = parseForwardedRequestInfo(req);

    return {
      responseContentType,
      platform,
      expectSignature: expectSignature ? String(expectSignature) : null,
      hostname: stripPort(req.headers['host']),
      protocol: forwarded?.protocol,
      forwarded,
    };
  }

  private getDefaultResponseHeaders(): Headers {
    const headers = new Headers();
    // set required headers for Expo Updates manifest specification
    headers.set('expo-protocol-version', '0');
    headers.set('expo-sfv-version', '0');
    headers.set('cache-control', 'private, max-age=0');
    return headers;
  }

  /**
   * Drop all cached runtime versions, forcing the next manifest request to resolve
   * them again. Called when the file watcher observes any change in the project.
   */
  public invalidateRuntimeVersionCache(): void {
    this.runtimeVersionCache.clear();
  }

  /** Resolve the runtime version through `expo-updates`, reusing an in-flight or cached result. */
  private getRuntimeVersionWithExpoUpdatesAsync(platform: RuntimePlatform): Promise<string | null> {
    const cached = this.runtimeVersionCache.get(platform);
    if (cached) {
      return cached;
    }

    const pending = Promise.resolve(
      resolveRuntimeVersionWithExpoUpdatesAsync({ projectRoot: this.projectRoot, platform })
    );
    this.runtimeVersionCache.set(platform, pending);

    // Never leave a failure cached, otherwise a transient error would be pinned for the
    // rest of the dev server session.
    pending.catch(() => {
      if (this.runtimeVersionCache.get(platform) === pending) {
        this.runtimeVersionCache.delete(platform);
      }
    });

    return pending;
  }

  public async _getManifestResponseAsync(
    requestOptions: ExpoGoManifestRequestInfo
  ): Promise<Response> {
    const { exp, hostUri, expoGoConfig, bundleUrl } =
      await this._resolveProjectSettingsAsync(requestOptions);

    const runtimeVersion =
      (await this.getRuntimeVersionWithExpoUpdatesAsync(requestOptions.platform)) ??
      // if expo-updates can't determine runtime version, fall back to calculation from config-plugin.
      // this happens when expo-updates is installed but runtimeVersion hasn't yet been configured or when
      // expo-updates is not installed.
      (await Updates.getRuntimeVersionAsync(
        this.projectRoot,
        { ...exp, runtimeVersion: exp.runtimeVersion ?? { policy: 'sdkVersion' } },
        // TODO(@kitten): Runtime-version resolution only reads ios/android config
        // tvos/macos fall back to the shared `runtimeVersion` until they get explicit support
        requestOptions.platform as 'android' | 'ios'
      ));
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

    event('served', {
      type: 'expo-go',
      runtimeVersion,
      sdkVersion: exp.sdkVersion ?? null,
    });

    let manifestPartHeaders: { 'expo-signature': string } | undefined;
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

    switch (requestOptions.responseContentType) {
      case ResponseContentType.MULTIPART_MIXED: {
        return this.encodeFormDataAsync({
          stringifiedManifest,
          manifestPartHeaders,
          certificateChainBody,
        });
      }
      case ResponseContentType.APPLICATION_EXPO_JSON:
      case ResponseContentType.APPLICATION_JSON:
      case ResponseContentType.TEXT_PLAIN: {
        const headers = this.getDefaultResponseHeaders();
        headers.set(
          'content-type',
          ExpoGoManifestHandlerMiddleware.getContentTypeForResponseContentType(
            requestOptions.responseContentType
          )
        );
        if (manifestPartHeaders?.['expo-signature']) {
          headers.set('expo-signature', manifestPartHeaders['expo-signature']);
        }
        return new Response(stringifiedManifest, { status: 200, headers });
      }
    }
  }

  private static getContentTypeForResponseContentType(
    responseContentType: ResponseContentType
  ): string {
    switch (responseContentType) {
      case ResponseContentType.MULTIPART_MIXED:
        return 'multipart/mixed';
      case ResponseContentType.APPLICATION_EXPO_JSON:
        return 'application/expo+json';
      case ResponseContentType.APPLICATION_JSON:
        return 'application/json';
      case ResponseContentType.TEXT_PLAIN:
        return 'text/plain';
    }
  }

  private encodeFormDataAsync({
    stringifiedManifest,
    manifestPartHeaders,
    certificateChainBody,
  }: {
    stringifiedManifest: string;
    manifestPartHeaders: { 'expo-signature': string } | undefined;
    certificateChainBody: string | null;
  }): Response {
    const parts: FormEntry[] = [
      [
        'manifest',
        new MultipartPart([stringifiedManifest], 'manifest', {
          type: 'application/json',
          headers: manifestPartHeaders,
        }),
      ],
    ];
    if (certificateChainBody && certificateChainBody.length > 0) {
      parts.push([
        'certificate_chain',
        new MultipartPart([certificateChainBody], 'certificate_chain', {
          type: 'application/x-pem-file',
        }),
      ]);
    }
    const headers = this.getDefaultResponseHeaders();
    headers.set('Content-Type', multipartMixedContentType);
    return new Response(iterableToStream(streamMultipart(parts)), { status: 200, headers });
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

    // Log.warn(
    //   env.EXPO_OFFLINE
    //     ? 'Using anonymous scope key in manifest for offline mode.'
    //     : 'Using anonymous scope key in manifest.'
    // );
    return await getAnonymousScopeKeyAsync(slug);
  }
}

async function getAnonymousScopeKeyAsync(slug: string): Promise<string> {
  const userAnonymousIdentifier = await getAnonymousIdAsync();
  return `@${ANONYMOUS_USERNAME}/${slug}-${userAnonymousIdentifier}`;
}

function convertToDictionaryItemsRepresentation(obj: { [key: string]: string }): Dictionary {
  return new Map(
    Object.entries(obj).map(([k, v]) => {
      return [k, [v, new Map()]];
    })
  );
}
