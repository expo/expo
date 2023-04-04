import { ExpoUpdatesManifest } from '@expo/config';
import { Updates } from '@expo/config-plugins';
import accepts from 'accepts';
import chalk from 'chalk';
import crypto from 'crypto';
import FormData from 'form-data';
import { serializeDictionary, Dictionary } from 'structured-headers';

import { AppQuery } from '../../../api/graphql/queries/AppQuery';
import { APISettings } from '../../../api/settings';
import { signExpoGoManifestAsync } from '../../../api/signManifest';
import UserSettings from '../../../api/user/UserSettings';
import { ANONYMOUS_USERNAME, getUserAsync } from '../../../api/user/user';
import { Permission } from '../../../graphql/generated';
import * as Log from '../../../log';
import { logEventAsync } from '../../../utils/analytics/rudderstackClient';
import {
  CodeSigningInfo,
  getCodeSigningInfoAsync,
  signManifestString,
} from '../../../utils/codesigning';
import { CommandError } from '../../../utils/errors';
import { memoize } from '../../../utils/fn';
import { learnMore } from '../../../utils/link';
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
      acceptSignature: this.getLegacyAcceptSignatureHeader(req),
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
    const scopeKeyToServeResult = await this.getResponseSignatureInfoAndScopeKeyAsync({
      easProjectId,
      slug: exp.slug,
      codeSigningInfo,
    });

    if (requestOptions.acceptSignature && scopeKeyToServeResult.shouldOmitLegacySignature) {
      Log.warn(
        `\n${scopeKeyToServeResult.omittanceReason}. ${chalk.dim(
          learnMore('https://expo.fyi/development-manifest-signing')
        )}`
      );
    }

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
        scopeKey: scopeKeyToServeResult.scopeKey,
      },
    };

    const headers = this.getDefaultResponseHeaders();
    if (requestOptions.acceptSignature && !scopeKeyToServeResult.shouldOmitLegacySignature) {
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

  private getAppByIdAsync = memoize(AppQuery.byIdAsync);

  private async getResponseSignatureInfoAndScopeKeyAsync({
    easProjectId,
    slug,
    codeSigningInfo,
  }: {
    easProjectId: string | undefined | null;
    slug: string;
    codeSigningInfo: CodeSigningInfo | null;
  }): Promise<
    | {
        shouldOmitLegacySignature: true;
        omittanceReason: string;
        scopeKey: string;
      }
    | {
        shouldOmitLegacySignature: false;
        scopeKey: string;
      }
  > {
    // if there isn't an EAS project, we couldn't have ever fetched codeSigningInfo with a scope key (implicit assumption)
    // and we won't be able to sign or fetch a scope key
    if (!easProjectId) {
      return {
        shouldOmitLegacySignature: true,
        omittanceReason:
          'This app is not associated with an EAS project so it may run with limited permissions',
        scopeKey: await getAnonymousScopeKeyAsync(slug),
      };
    }

    // if offline but we have code signing info with a scope key, we can use that scope key
    if (APISettings.isOffline && codeSigningInfo && codeSigningInfo.scopeKey) {
      return {
        shouldOmitLegacySignature: true,
        omittanceReason: 'Using saved code signing info to sign manifest while offline',
        scopeKey: codeSigningInfo.scopeKey,
      };
    }

    // if offline and don't have code signing info, we can't sign or fetch a scope key
    if (APISettings.isOffline) {
      return {
        shouldOmitLegacySignature: true,
        omittanceReason: 'This app may run with limited permissions while in offline mode',
        scopeKey: await getAnonymousScopeKeyAsync(slug),
      };
    }

    const user = await getUserAsync();

    // if not logged in but we have code signing info with a scope key, we can use that scope key
    if (!user && codeSigningInfo && codeSigningInfo.scopeKey) {
      return {
        shouldOmitLegacySignature: true,
        omittanceReason: 'Using saved code signing info to sign manifest while not logged in',
        scopeKey: codeSigningInfo.scopeKey,
      };
    }

    // if not logged in and don't have code signing info, we can't sign or fetch a scope key
    if (!user) {
      return {
        shouldOmitLegacySignature: true,
        omittanceReason: 'This app may run with limited permissions when not logged in',
        scopeKey: await getAnonymousScopeKeyAsync(slug),
      };
    }

    const app = await this.getAppByIdAsync(easProjectId);
    const owningAccountId = app.ownerAccount.id;

    const owningAccountIsUserPrimaryAccount =
      user.__typename === 'User' || user.__typename === 'SSOUser'
        ? user.primaryAccount.id === owningAccountId
        : false;
    const userHasPublishPermissionForOwningAccount = !!user.accounts
      .find((account) => account.id === owningAccountId)
      ?.users?.find((userPermission) => userPermission.actor.id === user.id)
      ?.permissions?.includes(Permission.Publish);
    const userCanSignManifest =
      owningAccountIsUserPrimaryAccount || userHasPublishPermissionForOwningAccount;

    // if the user can't sign the manifest but we have code signing info with a scope key, we can use that scope key
    if (!userCanSignManifest && codeSigningInfo && codeSigningInfo.scopeKey) {
      if (app.scopeKey !== codeSigningInfo.scopeKey) {
        throw new Error(`scopeKey mismatch: ${app.scopeKey} !== ${codeSigningInfo.scopeKey}`);
      }
      return {
        shouldOmitLegacySignature: true,
        omittanceReason:
          'Using saved code signing info to sign manifest because you do not have a developer role on the account that owns this project',
        scopeKey: app.scopeKey,
      };
    }

    // if the user can't sign the manifest and we don't have code signing info, we can't sign the manifest and an anonymous
    // scope key should be used as an extra precaution
    if (!userCanSignManifest) {
      return {
        shouldOmitLegacySignature: true,
        omittanceReason:
          'This app may run with limited permissions because you do not have a developer role on the account that owns this project',
        scopeKey: await getAnonymousScopeKeyAsync(slug),
      };
    }

    return { shouldOmitLegacySignature: false, scopeKey: app.scopeKey };
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
