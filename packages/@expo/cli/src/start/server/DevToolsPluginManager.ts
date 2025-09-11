import type { ModuleDescriptorDevTools } from 'expo-modules-autolinking/exports';

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
    return plugins;
  }
}
