import type { ModuleDescriptorDevTools } from 'expo-modules-autolinking/exports';
import path from 'path';
import resolveFrom from 'resolve-from';

const debug = require('debug')('expo:start:server:devtools');

export const DevToolsPluginEndpoint = '/_expo/plugins';

interface AutolinkingPlugin {
  packageName: string;
  packageRoot: string;
  webpageRoot: string;
}

export interface DevToolsPlugin extends AutolinkingPlugin {
  webpageEndpoint: string;
}

export default class DevToolsPluginManager {
  private plugins: DevToolsPlugin[] | null = null;

  constructor(private projectRoot: string) {}

  public async queryPluginsAsync(): Promise<DevToolsPlugin[]> {
    if (this.plugins) {
      return this.plugins;
    }
    const plugins = (await this.queryAutolinkedPluginsAsync(this.projectRoot)).map((plugin) => ({
      ...plugin,
      webpageEndpoint: `${DevToolsPluginEndpoint}/${plugin.packageName}`,
    }));
    this.plugins = plugins;
    return this.plugins;
  }

  public async queryPluginWebpageRootAsync(pluginName: string): Promise<string | null> {
    const plugins = await this.queryPluginsAsync();
    const plugin = plugins.find((p) => p.packageName === pluginName);
    return plugin?.webpageRoot ?? null;
  }

  private async queryAutolinkedPluginsAsync(projectRoot: string): Promise<AutolinkingPlugin[]> {
    const expoPackagePath = resolveFrom.silent(projectRoot, 'expo/package.json');
    if (!expoPackagePath) {
      return [];
    }
    const resolvedPath = resolveFrom.silent(
      path.dirname(expoPackagePath),
      'expo-modules-autolinking/exports'
    );
    if (!resolvedPath) {
      return [];
    }
    const autolinkingModule = require(
      resolvedPath
    ) as typeof import('expo-modules-autolinking/exports');
    if (!autolinkingModule.queryAutolinkingModulesFromProjectAsync) {
      throw new Error(
        'Missing exported `queryAutolinkingModulesFromProjectAsync()` function from `expo-modules-autolinking`'
      );
    }
    const plugins = (await autolinkingModule.queryAutolinkingModulesFromProjectAsync(projectRoot, {
      platform: 'devtools',
      onlyProjectDeps: false,
    })) as ModuleDescriptorDevTools[];
    debug('Found autolinked plugins', this.plugins);
    return plugins;
  }
}
