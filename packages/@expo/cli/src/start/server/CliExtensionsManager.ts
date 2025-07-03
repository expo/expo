import { spawn } from 'child_process';
import path from 'path';
import resolveFrom from 'resolve-from';

import { DevMCPServer } from './DevMCPServer';
import { DevServerManager } from './DevServerManager';
import { queryAllInspectorAppsAsync } from './middleware/inspector/JsInspector';
import { CliCommandExecutorArguments, CliExtensionDescriptor } from './types';

const debug = require('debug')('expo:start:server:config');

export class CliExtensionsManager {
  private plugins: CliExtensionDescriptor[] | null = null;
  private mcpServer: DevMCPServer;
  private devServerManagerRef: WeakRef<DevServerManager>;
  constructor(
    private projectRoot: string,
    devServerManager: DevServerManager
  ) {
    this.devServerManagerRef = new WeakRef(devServerManager);
    this.mcpServer = this.setupMCPServer();
    this.startMCPServer().catch((error) => {
      console.error('Failed to start MCP server:', error);
    });
  }

  private setupMCPServer() {
    const mcpServer = new DevMCPServer();

    // Add tools
    this.queryPluginsAsync().then((plugins) => {
      plugins
        .filter((plugin) => plugin.mcpEnabled)
        .forEach((plugin) =>
          mcpServer.addTool(plugin, async (command, args) => {
            // Verify that we have apps connected to the dev server.
            const devServerManager = this.devServerManagerRef.deref();
            if (!devServerManager) {
              throw new Error('DevServerManager has been garbage collected');
            }
            const metroServerOrigin = devServerManager
              .getDefaultDevServer()
              .getJsInspectorBaseUrl();

            const apps = await queryAllInspectorAppsAsync(metroServerOrigin);
            return await plugin.executor({
              command,
              args,
              apps,
            });
          })
        );
    });

    return mcpServer;
  }

  async startMCPServer() {
    this.mcpServer.start();
    // Handle server shutdown
    process.on('SIGINT', async () => {
      console.log('Shutting down server...');
      await this.mcpServer.stop();
      process.exit(0);
    });
  }

  public async queryPluginsAsync(): Promise<CliExtensionDescriptor[]> {
    if (this.plugins) {
      return this.plugins;
    }
    const plugins = (await this.queryAutolinkedPluginsAsync(this.projectRoot)).map((plugin) => ({
      ...plugin,
      executor: async ({ command, args, apps }: CliCommandExecutorArguments) => {
        return new Promise<string>(async (resolve, reject) => {
          // Set up the command and its arguments
          const tool = path.join(plugin.packageRoot, plugin.main);
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
      },
    }));

    this.plugins = plugins;
    return this.plugins;
  }

  private async queryAutolinkedPluginsAsync(
    projectRoot: string
  ): Promise<CliExtensionDescriptor[]> {
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
      platform: 'cli',
      onlyProjectDeps: false,
    })) as CliExtensionDescriptor[];
    debug('Found autolinked plugins', plugins);
    return plugins;
  }
}
