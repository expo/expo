import { DevToolsPluginInfo, PluginSchema } from './DevToolsPlugin.schema';
import { DevToolsPluginCliExtensionExecutor } from './DevToolsPluginCliExtensionExecutor';
import { DevToolsPluginEndpoint } from './DevToolsPluginManager';
import { Log } from '../../log';

const DEFAULT_TIMEOUT_MS = 10_000; // 10 seconds

/**
 * Class that represents a DevTools plugin with CLI and/or web extensions
 *
 * Responsibilities:
 * - Validates plugin configuration against schema
 * - Provides access to plugin metadata (name, description
 * , endpoints)
 * - Manages CLI command execution via DevToolsPluginExecutor
 * - Lazily initializes executor when needed
 * - Constructs web endpoint URLs based on server configuration
 */
export class DevToolsPlugin {
  constructor(
    private plugin: DevToolsPluginInfo,
    public readonly projectRoot: string
  ) {
    // Validate configuration schema
    const result = PluginSchema.safeParse(plugin);
    if (!result.success) {
      throw new Error(`Invalid plugin configuration: ${result.error.message}`, {
        cause: result.error,
      });
    }
  }

  private _executor: DevToolsPluginCliExtensionExecutor | undefined = undefined;

  get packageName(): string {
    return this.plugin.packageName;
  }

  get packageRoot(): string {
    return this.plugin.packageRoot;
  }

  get webpageEndpoint(): string | undefined {
    return this.plugin?.webpageRoot
      ? `${DevToolsPluginEndpoint}/${this.plugin?.packageName}`
      : undefined;
  }

  get webpageRoot(): string | undefined {
    return this.plugin?.webpageRoot;
  }

  get description(): string {
    return this.plugin.cliExtensions?.description ?? '';
  }

  get cliExtensions(): DevToolsPluginInfo['cliExtensions'] {
    return this.plugin.cliExtensions;
  }

  get executor(): DevToolsPluginCliExtensionExecutor | undefined {
    if (!this.plugin.cliExtensions?.entryPoint) {
      return undefined;
    }

    if (!this._executor) {
      this._executor = new DevToolsPluginCliExtensionExecutor(this.plugin, this.projectRoot);
    }

    return this._executor;
  }
}
