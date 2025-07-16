import { spawn } from 'child_process';
import type { ModuleDescriptorDevTools } from 'expo-modules-autolinking/exports';
import path from 'path';
import resolveFrom from 'resolve-from';

import { MetroInspectorProxyApp } from './middleware/inspector/JsInspector';

const debug = require('debug')('expo:start:server:devtools');

export const DevToolsPluginEndpoint = '/_expo/plugins';

interface AutolinkingPlugin {
  packageName: string;
  packageRoot: string;
  webpageRoot?: string;
  cli?: {
    description: string;
    commands: DevToolsPluginCliCommand[];
    main: string;
  };
}
export interface DevToolsPluginCliCommandParameter {
  name: string;
  type: 'text' | 'number' | 'confirm';
  description?: string;
}

export interface DevToolsPluginCliCommand {
  name: string;
  caption: string;
  disabled?: ('cli' | 'mcp')[];
  parameters?: DevToolsPluginCliCommandParameter[];
}

export interface DevToolsPluginCliExecutorArguments {
  command: string;
  args?: Record<string, string | number | boolean>; // Parameters for the command
  apps?: MetroInspectorProxyApp[]; // Optional apps to communicate with
}

export interface DevToolsPlugin extends AutolinkingPlugin {
  webpageEndpoint?: string;
  description?: string;
  executor?: (args: DevToolsPluginCliExecutorArguments) => Promise<string | undefined | null>;
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
      webpageEndpoint: plugin.webpageRoot
        ? `${DevToolsPluginEndpoint}/${plugin.packageName}`
        : undefined,
      decsription: plugin.cli?.description ?? '',
      executor: plugin.cli?.main
        ? async ({ command, args, apps }: DevToolsPluginCliExecutorArguments) => {
            return new Promise<string>(async (resolve, reject) => {
              // Set up the command and its arguments
              const tool = path.join(plugin.packageRoot, plugin.cli!.main);
              const child = spawn(
                'node',
                [tool, command, `'${JSON.stringify(args)}'`, `'${JSON.stringify(apps)}'`],
                {
                  cwd: this.projectRoot,
                  shell: true,
                  env: { ...process.env, FORCE_COLOR: '1' },
                }
              );
              let stdout = '';
              let stderr = '';
              let finished = false;

              // Collect output/error data
              child.stdout.on('data', (data) => (stdout += data.toString()));
              child.stderr.on('data', (data) => (stderr += data.toString()));

              // Setup timeout
              const timeoutMs = 10_000; // 10 seconds
              const timeout = setTimeout(() => {
                if (!finished) {
                  finished = true;
                  child.kill('SIGKILL');
                  reject(new Error(`Command execution timed out after ${timeoutMs}ms`));
                }
              }, timeoutMs);

              child.on('close', (code: number) => {
                if (finished) return;
                finished = true;
                clearTimeout(timeout);
                if (code !== 0) {
                  reject(stderr || `Process exited with code ${code}`);
                } else {
                  resolve(stdout);
                }
              });
              child.on('error', (err: Error) => {
                if (finished) return;
                finished = true;
                clearTimeout(timeout);
                reject(err.message);
              });
            });
          }
        : undefined,
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
