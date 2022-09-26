import { getConfig, getNameFromConfig } from '@expo/config';
import { getRuntimeVersionNullable } from '@expo/config-plugins/build/utils/Updates';
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

type ProjectVersion = {
  type: 'sdk' | 'runtime';
  version: string | null;
};

const debug = require('debug')(
  'expo:start:server:middleware:interstitialPage'
) as typeof console.log;

export const LoadingEndpoint = '/_expo/loading';

export class InterstitialPageMiddleware extends ExpoMiddleware {
  constructor(
    projectRoot: string,
    protected options: { scheme: string | null } = { scheme: null }
  ) {
    super(projectRoot, [LoadingEndpoint]);
  }

  /** Get the template HTML page and inject values. */
  async _getPageAsync({
    appName,
    projectVersion,
  }: {
    appName: string;
    projectVersion: ProjectVersion;
  }): Promise<string> {
    const templatePath =
      // Production: This will resolve when installed in the project.
      resolveFrom.silent(this.projectRoot, 'expo/static/loading-page/index.html') ??
      // Development: This will resolve when testing locally.
      path.resolve(__dirname, '../../../../../static/loading-page/index.html');
    let content = (await readFile(templatePath)).toString('utf-8');

    content = content.replace(/{{\s*AppName\s*}}/, appName);
    content = content.replace(/{{\s*Path\s*}}/, this.projectRoot);
    content = content.replace(/{{\s*Scheme\s*}}/, this.options.scheme ?? 'Unknown');
    content = content.replace(
      /{{\s*ProjectVersionType\s*}}/,
      `${projectVersion.type === 'sdk' ? 'SDK' : 'Runtime'} version`
    );
    content = content.replace(/{{\s*ProjectVersion\s*}}/, projectVersion.version ?? 'Undetected');

    return content;
  }

  /** Get settings for the page from the project config. */
  _getProjectOptions(platform: RuntimePlatform): {
    appName: string;
    projectVersion: ProjectVersion;
  } {
    assertRuntimePlatform(platform);

    const { exp } = getConfig(this.projectRoot);
    const { appName } = getNameFromConfig(exp);
    const runtimeVersion = getRuntimeVersionNullable(exp, platform);
    const sdkVersion = exp.sdkVersion ?? null;

    return {
      appName: appName ?? 'App',
      projectVersion:
        sdkVersion && !runtimeVersion
          ? { type: 'sdk', version: sdkVersion }
          : { type: 'runtime', version: runtimeVersion },
    };
  }

  async handleRequestAsync(req: ServerRequest, res: ServerResponse): Promise<void> {
    res = disableResponseCache(res);
    res.setHeader('Content-Type', 'text/html');

    const platform = parsePlatformHeader(req) ?? resolvePlatformFromUserAgentHeader(req);
    assertMissingRuntimePlatform(platform);
    assertRuntimePlatform(platform);

    const { appName, projectVersion } = this._getProjectOptions(platform);
    debug(
      `Create loading page. (platform: ${platform}, appName: ${appName}, projectVersion: ${projectVersion.version}, type: ${projectVersion.type})`
    );
    const content = await this._getPageAsync({ appName, projectVersion });
    res.end(content);
  }
}
