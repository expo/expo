import { ExpoAppManifest, ExpoConfig } from '@expo/config';
import chalk from 'chalk';
import os from 'os';

import { signClassicExpoGoManifestAsync } from '../../../api/signManifest';
import { ANONYMOUS_USERNAME, getUserAsync } from '../../../api/user/user';
import UserSettings from '../../../api/user/UserSettings';
import * as Log from '../../../log';
import { logEvent } from '../../../utils/analytics/rudderstackClient';
import { memoize } from '../../../utils/fn';
import { learnMore } from '../../../utils/link';
import { stripPort } from '../../../utils/url';
import { ProcessSettings } from '../../ProcessSettings';
import {
  assertRuntimePlatform,
  DEVELOPER_TOOL,
  HostInfo,
  ManifestHandlerMiddleware,
  ParsedHeaders,
  parsePlatformHeader,
  ServerHeaders,
  ServerRequest,
} from './ManifestMiddleware';

export class ClassicManifestMiddleware extends ManifestHandlerMiddleware {
  public getParsedHeaders(req: ServerRequest): ParsedHeaders {
    const platform = parsePlatformHeader(req) || 'ios';
    assertRuntimePlatform(platform);
    return {
      platform,
      acceptSignature: Boolean(req.headers['exponent-accept-signature']),
      hostname: stripPort(req.headers['host']),
    };
  }

  protected async getManifestResponseAsync(req: ServerRequest): Promise<{
    body: string;
    version: string;
    headers: ServerHeaders;
  }> {
    // Read from headers
    const { acceptSignature, ...requestOptions } = this.getParsedHeaders(req);

    const { exp, hostUri, expoGoConfig, bundleUrl } = await this.resolveProjectSettingsAsync(
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

    const headers = this.getDefaultResponseHeaders();
    headers.set('Exponent-Server', hostInfo);

    // Create the final string
    const body = await this.fetchComputedManifestStringAsync({
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

  private async getManifestStringAsync(
    manifest: ExpoAppManifest,
    hostUUID: string,
    acceptSignature?: boolean
  ): Promise<string> {
    const currentSession = await getUserAsync();
    if (!currentSession || ProcessSettings.isOffline) {
      manifest.id = `@${ANONYMOUS_USERNAME}/${manifest.slug}-${hostUUID}`;
    }
    if (!acceptSignature) {
      return JSON.stringify(manifest);
    } else if (!currentSession || ProcessSettings.isOffline) {
      return getUnsignedManifestString(manifest);
    } else {
      return await this.getSignedManifestStringAsync(manifest);
    }
  }

  private getSignedManifestStringAsync = memoize(signClassicExpoGoManifestAsync);

  private async fetchComputedManifestStringAsync({
    manifest,
    hostId,
    acceptSignature,
  }: {
    manifest: ExpoAppManifest;
    hostId: string;
    acceptSignature: boolean;
  }): Promise<string> {
    try {
      return await this.getManifestStringAsync(manifest, hostId, acceptSignature);
    } catch (error) {
      if (error.code === 'UNAUTHORIZED_ERROR' && manifest.owner) {
        // Don't have permissions for siging, warn and enable offline mode.
        this.addSigningDisabledWarning(
          `This project belongs to ${chalk.bold(
            `@${manifest.owner}`
          )} and you have not been granted the appropriate permissions.\n` +
            `Please request access from an admin of @${manifest.owner} or change the "owner" field to an account you belong to.\n` +
            learnMore('https://docs.expo.dev/versions/latest/config/app/#owner')
        );
        ProcessSettings.isOffline = true;
        return await this.getManifestStringAsync(manifest, hostId, acceptSignature);
      } else if (error.code === 'ENOTFOUND') {
        // Got a DNS error, i.e. can't access exp.host, warn and enable offline mode.
        this.addSigningDisabledWarning(
          `Could not reach Expo servers, please check if you can access ${
            error.hostname || 'exp.host'
          }.`
        );
        ProcessSettings.isOffline = true;
        return await this.getManifestStringAsync(manifest, hostId, acceptSignature);
      } else {
        throw error;
      }
    }
  }

  private addSigningDisabledWarning = memoize((reason: string) =>
    Log.warn(`${reason}\nFalling back to offline mode.`, 'signing-disabled')
  );
}

// Passed to Expo Go and registered as telemetry.
// TODO: it's unclear why we don't just send it from the CLI.
async function createHostInfoAsync(): Promise<HostInfo> {
  return {
    host: await UserSettings.getAnonymousIdentifierAsync(),
    server: 'expo',
    serverVersion: process.env.__EXPO_VERSION,
    serverDriver: DEVELOPER_TOOL,
    serverOS: os.platform(),
    serverOSVersion: os.release(),
  };
}

export function getUnsignedManifestString(manifest: ExpoConfig) {
  const unsignedManifest = {
    manifestString: JSON.stringify(manifest),
    signature: 'UNSIGNED',
  };
  return JSON.stringify(unsignedManifest);
}
