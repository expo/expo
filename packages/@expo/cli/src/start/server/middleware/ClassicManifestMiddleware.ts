import { ExpoAppManifest, ExpoConfig } from '@expo/config';
import chalk from 'chalk';
import os from 'os';

import { disableNetwork } from '../../../api/settings';
import { signClassicExpoGoManifestAsync } from '../../../api/signManifest';
import UserSettings from '../../../api/user/UserSettings';
import { ANONYMOUS_USERNAME, getUserAsync } from '../../../api/user/user';
import * as Log from '../../../log';
import { logEventAsync } from '../../../utils/analytics/rudderstackClient';
import { env } from '../../../utils/env';
import { memoize } from '../../../utils/fn';
import { learnMore } from '../../../utils/link';
import { stripPort } from '../../../utils/url';
import {
  DEVELOPER_TOOL,
  HostInfo,
  ManifestMiddleware,
  ManifestRequestInfo,
} from './ManifestMiddleware';
import { assertRuntimePlatform, parsePlatformHeader } from './resolvePlatform';
import { ServerHeaders, ServerRequest } from './server.types';

type SignManifestProps = {
  manifest: ExpoAppManifest;
  hostId: string;
  acceptSignature: boolean;
};

interface ClassicManifestRequestInfo extends ManifestRequestInfo {
  /** Should return the signed manifest. */
  acceptSignature: boolean;
}

const debug = require('debug')(
  'expo:start:server:middleware:ClassicManifestMiddleware'
) as typeof console.log;

export class ClassicManifestMiddleware extends ManifestMiddleware<ClassicManifestRequestInfo> {
  public getParsedHeaders(req: ServerRequest): ClassicManifestRequestInfo {
    const platform = parsePlatformHeader(req) || 'ios';
    assertRuntimePlatform(platform);
    return {
      platform,
      acceptSignature: this.getLegacyAcceptSignatureHeader(req),
      hostname: stripPort(req.headers['host']),
    };
  }

  /**
   * This header is specified as a string "true" or "false", in one of two headers:
   * - exponent-accept-signature
   * - expo-accept-signature
   */
  private getLegacyAcceptSignatureHeader(req: ServerRequest): boolean {
    return (
      req.headers['exponent-accept-signature'] === 'true' ||
      req.headers['expo-accept-signature'] === 'true'
    );
  }

  public async _getManifestResponseAsync({
    acceptSignature,
    ...requestOptions
  }: ClassicManifestRequestInfo): Promise<{
    body: string;
    version: string;
    headers: ServerHeaders;
  }> {
    const { exp, hostUri, expoGoConfig, bundleUrl } = await this._resolveProjectSettingsAsync(
      requestOptions
    );

    const manifest: ExpoAppManifest = {
      ...(exp as ExpoAppManifest),
      ...expoGoConfig,
      hostUri,
      bundleUrl,
    };

    // Gather packager and host info
    const hostInfo = await createHostInfoAsync();

    const headers = new Map<string, any>();
    headers.set('Exponent-Server', JSON.stringify(hostInfo));

    // Create the final string
    const body = await this._fetchComputedManifestStringAsync({
      manifest,
      hostId: hostInfo.host,
      acceptSignature,
    });

    return {
      body,
      version: manifest.sdkVersion,
      headers,
    };
  }

  protected trackManifest(version?: string) {
    // Log analytics
    logEventAsync('Serve Manifest', {
      sdkVersion: version ?? null,
    });
  }

  /** Exposed for testing. */
  async _getManifestStringAsync({
    manifest,
    hostId,
    acceptSignature,
  }: SignManifestProps): Promise<string> {
    const currentSession = await getUserAsync();
    if (!currentSession || env.EXPO_OFFLINE) {
      manifest.id = `@${ANONYMOUS_USERNAME}/${manifest.slug}-${hostId}`;
    }
    if (!acceptSignature) {
      return JSON.stringify(manifest);
    } else if (!currentSession || env.EXPO_OFFLINE) {
      return getUnsignedManifestString(manifest);
    } else {
      return this.getSignedManifestStringAsync(manifest);
    }
  }

  private getSignedManifestStringAsync = memoize(signClassicExpoGoManifestAsync);

  /** Exposed for testing. */
  async _fetchComputedManifestStringAsync(props: SignManifestProps): Promise<string> {
    try {
      return await this._getManifestStringAsync(props);
    } catch (error: any) {
      debug(`Error getting manifest:`, error);
      if (error.code === 'UNAUTHORIZED' && props.manifest.owner) {
        // Don't have permissions for signing, warn and enable offline mode.
        this.addSigningDisabledWarning(
          `This project belongs to ${chalk.bold(
            `@${props.manifest.owner}`
          )} and you have not been granted the appropriate permissions.\n` +
            `Please request access from an admin of @${props.manifest.owner} or change the "owner" field to an account you belong to.\n` +
            learnMore('https://docs.expo.dev/versions/latest/config/app/#owner')
        );
        disableNetwork();
        return await this._getManifestStringAsync(props);
      } else if (error.code === 'ENOTFOUND') {
        // Got a DNS error, i.e. can't access exp.host, warn and enable offline mode.
        this.addSigningDisabledWarning(
          `Could not reach Expo servers, please check if you can access ${
            error.hostname || 'exp.host'
          }.`
        );

        disableNetwork();
        return await this._getManifestStringAsync(props);
      } else {
        throw error;
      }
    }
  }

  private addSigningDisabledWarning = memoize((reason: string) => {
    Log.warn(`${reason}\nFalling back to offline mode.`);
    // For the memo
    return reason;
  });
}

// Passed to Expo Go and registered as telemetry.
// TODO: it's unclear why we don't just send it from the CLI.
async function createHostInfoAsync(): Promise<HostInfo> {
  return {
    host: await UserSettings.getAnonymousIdentifierAsync(),
    server: 'expo',
    // Defined in the build step
    serverVersion: process.env.__EXPO_VERSION!,
    serverDriver: DEVELOPER_TOOL,
    serverOS: os.platform(),
    serverOSVersion: os.release(),
  };
}

function getUnsignedManifestString(manifest: ExpoConfig) {
  const unsignedManifest = {
    manifestString: JSON.stringify(manifest),
    signature: 'UNSIGNED',
  };
  return JSON.stringify(unsignedManifest);
}
