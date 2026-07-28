import { getConfig, getNameFromConfig } from '@expo/config';
import { getRuntimeVersionNullableAsync } from '@expo/config-plugins/build/utils/Updates';
import { readFile } from 'fs/promises';
import path from 'path';
import resolveFrom from 'resolve-from';

import { disableResponseCache, ExpoMiddleware } from './ExpoMiddleware';
import type { RuntimePlatform } from './resolvePlatform';
import {
  assertMissingRuntimePlatform,
  assertRuntimePlatform,
  parsePlatformHeader,
  resolvePlatformFromUserAgentHeader,
} from './resolvePlatform';
import type { ServerRequest, ServerResponse } from './server.types';

type ProjectVersion = {
  type: 'sdk' | 'runtime';
  version: string | null;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

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

    content = content.replace(/{{\s*AppName\s*}}/, escapeHtml(appName));
    content = content.replace(/{{\s*Path\s*}}/, escapeHtml(this.projectRoot));
    content = content.replace(/{{\s*Scheme\s*}}/, escapeHtml(this.options.scheme ?? 'Unknown'));
    content = content.replace(
      /{{\s*ProjectVersionType\s*}}/,
      `${projectVersion.type === 'sdk' ? 'SDK' : 'Runtime'} version`
    );
    content = content.replace(
      /{{\s*ProjectVersion\s*}}/,
      escapeHtml(projectVersion.version ?? 'Undetected')
    );

    return content;
  }

  /** Get settings for the page from the project config. */
  async _getProjectOptionsAsync(platform: RuntimePlatform): Promise<{
    appName: string;
    projectVersion: ProjectVersion;
  }> {
    assertRuntimePlatform(platform);

    const { exp } = getConfig(this.projectRoot);
    const { appName } = getNameFromConfig(exp);
    const runtimeVersion = await getRuntimeVersionNullableAsync(
      this.projectRoot,
      exp,
      // TODO(@kitten): Runtime-version resolution only reads ios/android config
      // tvos/macos fall back to the shared `runtimeVersion` until they get explicit support
      platform as 'android' | 'ios'
    );
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

    const { appName, projectVersion } = await this._getProjectOptionsAsync(platform);
    const content = await this._getPageAsync({ appName, projectVersion });
    res.end(content);
  }
}
