import type { ModuleDescriptorDevTools } from 'expo-modules-autolinking/exports';

import { DevToolsPlugin } from './DevToolsPlugin';
import { Log } from '../../log';

const debug = require('debug')('expo:start:server:devtools');

export const DevToolsPluginEndpoint = '/_expo/plugins';

export default class DevToolsPluginManager {
  private plugins: DevToolsPlugin[] | null = null;

  constructor(private projectRoot: string) {}

  public async queryPluginsAsync(): Promise<DevToolsPlugin[]> {
    if (!this.plugins) {
      this.plugins = await this.queryAutolinkedPluginsAsync(this.projectRoot);
    }
    return this.plugins;
  }

  public async queryPluginWebpageRootAsync(pluginName: string): Promise<string | null> {
    const plugins = await this.queryPluginsAsync();
    const plugin = plugins.find((p) => p.packageName === pluginName);
    return plugin?.webpageRoot ?? null;
  }

  private async queryAutolinkedPluginsAsync(projectRoot: string): Promise<DevToolsPlugin[]> {
    const autolinking: typeof import('expo/internal/unstable-autolinking-exports') = require('expo/internal/unstable-autolinking-exports');
    const linker = autolinking.makeCachedDependenciesLinker({ projectRoot });
    const revisions = await autolinking.scanExpoModuleResolutionsForPlatform(linker, 'devtools');
    const { resolveModuleAsync } = autolinking.getLinkingImplementationForPlatform('devtools');
    const plugins: ModuleDescriptorDevTools[] = (
      await Promise.all(
        Object.values(revisions).map((revision) => resolveModuleAsync(revision.name, revision))
      )
    ).filter((maybePlugin) => maybePlugin != null);
    debug('Found autolinked plugins', plugins);
    return plugins
      .map((pluginInfo) => new DevToolsPlugin(pluginInfo, this.projectRoot))
      .filter((p) => p != null) as DevToolsPlugin[];
  }
}
