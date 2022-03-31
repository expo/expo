import { ExpoAppManifest, ExpoConfig } from '@expo/config';
import chalk from 'chalk';
import os from 'os';

import { APISettings } from '../../../api/settings';
import { signClassicExpoGoManifestAsync } from '../../../api/signManifest';
import UserSettings from '../../../api/user/UserSettings';
import { ANONYMOUS_USERNAME, getUserAsync } from '../../../api/user/user';
import * as Log from '../../../log';
import { logEvent } from '../../../utils/analytics/rudderstackClient';
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

interface ClassicManifestRequestInfo extends ManifestRequestInfo {}

export class ClassicManifestMiddleware extends ManifestMiddleware<ClassicManifestRequestInfo> {
  public getParsedHeaders(req: ServerRequest): ClassicManifestRequestInfo {
    const platform = parsePlatformHeader(req) || 'ios';
    assertRuntimePlatform(platform);
    return {
      platform,
      acceptSignature: Boolean(req.headers['exponent-accept-signature']),
      hostname: stripPort(req.headers['host']),
    };
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
    headers.set('Exponent-Server', hostInfo);

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
    logEvent('Serve Manifest', {
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
    if (!currentSession || APISettings.isOffline) {
      manifest.id = `@${ANONYMOUS_USERNAME}/${manifest.slug}-${hostId}`;
    }
    if (!acceptSignature) {
      return JSON.stringify(manifest);
    } else if (!currentSession || APISettings.isOffline) {
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
      if (error.code === 'UNAUTHORIZED_ERROR' && props.manifest.owner) {
        // Don't have permissions for siging, warn and enable offline mode.
        this.addSigningDisabledWarning(
          `This project belongs to ${chalk.bold(
            `@${props.manifest.owner}`
          )} and you have not been granted the appropriate permissions.\n` +
            `Please request access from an admin of @${props.manifest.owner} or change the "owner" field to an account you belong to.\n` +
            learnMore('https://docs.expo.dev/versions/latest/config/app/#owner')
        );
        APISettings.isOffline = true;
        return await this._getManifestStringAsync(props);
      } else if (error.code === 'ENOTFOUND') {
        // Got a DNS error, i.e. can't access exp.host, warn and enable offline mode.
        this.addSigningDisabledWarning(
          `Could not reach Expo servers, please check if you can access ${
            error.hostname || 'exp.host'
          }.`
        );
        APISettings.isOffline = true;
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
