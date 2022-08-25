import { getConfig, getNameFromConfig } from '@expo/config';
import { getRuntimeVersionNullable, getSDKVersion } from '@expo/config-plugins/build/utils/Updates';
import { readFile } from 'fs/promises';
import path from 'path';
import resolveFrom from 'resolve-from';

import { disableResponseCache, ExpoMiddleware } from './ExpoMiddleware';
import {
  assertMissingRuntimePlatform,
  assertRuntimePlatform,
  parsePlatformHeader,
  resolvePlatformFromUserAgentHeader,
  RuntimePlatform,
} from './resolvePlatform';
import { ServerRequest, ServerResponse } from './server.types';

const debug = require('debug')(
  'expo:start:server:middleware:interstitialPage'
) as typeof console.log;

export const LoadingEndpoint = '/_expo/loading';

export class InterstitialPageMiddleware extends ExpoMiddleware {
  private scheme: string | null;

  constructor(projectRoot: string, scheme?: string | null) {
    super(projectRoot, [LoadingEndpoint]);
    this.scheme = scheme ?? null;
  }

  /** Get the template HTML page and inject values. */
  async _getPageAsync({
    appName,
    runtimeVersion,
    sdkVersion,
  }: {
    appName: string;
    runtimeVersion: string | null;
    sdkVersion: string | null;
  }): Promise<string> {
    const templatePath =
      // Production: This will resolve when installed in the project.
      resolveFrom.silent(this.projectRoot, 'expo/static/loading-page/index.html') ??
      // Development: This will resolve when testing locally.
      path.resolve(__dirname, '../../../../../static/loading-page/index.html');
    let content = (await readFile(templatePath)).toString('utf-8');

    content = content.replace(/{{\s*AppName\s*}}/, appName);
    content = content.replace(/{{\s*Path\s*}}/, this.projectRoot);
    content = content.replace(/{{\s*Scheme\s*}}/, this.scheme ?? 'Unknown');

    if (!runtimeVersion && sdkVersion) {
      content = content.replace(/{{\s*ProjectVersionType\s*}}/, 'SDK version');
      content = content.replace(/{{\s*ProjectVersion\s*}}/, sdkVersion);
    } else {
      content = content.replace(/{{\s*ProjectVersionType\s*}}/, 'Runtime version');
      content = content.replace(/{{\s*ProjectVersion\s*}}/, runtimeVersion ?? 'Undetected');
    }

    return content;
  }

  /** Get settings for the page from the project config. */
  _getProjectOptions(platform: RuntimePlatform): {
    appName: string;
    runtimeVersion: string | null;
    sdkVersion: string | null;
  } {
    assertRuntimePlatform(platform);

    const { exp } = getConfig(this.projectRoot);
    const { appName } = getNameFromConfig(exp);
    const runtimeVersion = getRuntimeVersionNullable(exp, platform);
    const sdkVersion = getSDKVersion(exp);

    return {
      appName: appName ?? 'App',
      runtimeVersion,
      sdkVersion,
    };
  }

  async handleRequestAsync(req: ServerRequest, res: ServerResponse): Promise<void> {
    res = disableResponseCache(res);
    res.setHeader('Content-Type', 'text/html');

    const platform = parsePlatformHeader(req) ?? resolvePlatformFromUserAgentHeader(req);
    assertMissingRuntimePlatform(platform);
    assertRuntimePlatform(platform);

    const { appName, runtimeVersion, sdkVersion } = this._getProjectOptions(platform);
    debug(
      `Create loading page. (platform: ${platform}, appName: ${appName}, runtimeVersion: ${runtimeVersion})`
    );
    const content = await this._getPageAsync({ appName, runtimeVersion, sdkVersion });
    res.end(content);
  }
}
