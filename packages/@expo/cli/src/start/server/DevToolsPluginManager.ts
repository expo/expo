import { events } from '2g';
import type { ModuleDescriptorDevTools } from 'expo-modules-autolinking/exports';

import { Log } from '../../log';
import { DevToolsPlugin } from './DevToolsPlugin';

const debug = require('debug')('expo:start:server:devtools');

export const DevToolsPluginEndpoint = '/_expo/plugins';

declare module '2g' {
  interface EventRegistry {
    'expo:dev-tools-plugin:load': {
      plugins: {
        packageName: string;
        bannerTitle: string;
        cliBanner: boolean;
        webpageEndpoint: string | undefined;
      }[];
    };
  }
}

export const event = events('expo');

export default class DevToolsPluginManager {
  private plugins: DevToolsPlugin[] | null = null;

  constructor(private projectRoot: string) {}

  public async queryPluginsAsync(): Promise<DevToolsPlugin[]> {
    if (!this.plugins) {
      this.plugins = await this.queryAutolinkedPluginsAsync(this.projectRoot);
      event('dev-tools-plugin:load', {
        plugins: this.plugins.map((plugin) => ({
          packageName: plugin.packageName,
          bannerTitle: plugin.bannerTitle,
          cliBanner: plugin.cliBanner,
          webpageEndpoint: plugin.webpageEndpoint,
        })),
      });
    }
    return this.plugins;
  }

  public async queryPluginAsync(pluginName: string): Promise<DevToolsPlugin | null> {
    const plugins = await this.queryPluginsAsync();
    return plugins.find((p) => p.packageName === pluginName) ?? null;
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
      .map((pluginInfo) => {
        try {
          return new DevToolsPlugin(pluginInfo, this.projectRoot);
        } catch (error: any) {
          Log.warn(
            `Skipping plugin "${pluginInfo.packageName}": ${error.message ?? 'invalid configuration'}`
          );
          debug('Plugin validation error for %s: %O', pluginInfo.packageName, error);
          return null;
        }
      })
      .filter((p) => p != null) as DevToolsPlugin[];
  }
}
