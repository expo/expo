import { execAsync } from '@expo/osascript';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import chalk from 'chalk';
import { exec, execSync, spawn } from 'child_process';
import express, { Request, Response } from 'express';
import path from 'path';
import resolveFrom from 'resolve-from';
import { z } from 'zod';

import { DevServerManager } from './DevServerManager';
import {
  MetroInspectorProxyApp,
  queryAllInspectorAppsAsync,
} from './middleware/inspector/JsInspector';
import { learnMore } from '../../utils/link';

const debug = require('debug')('expo:start:server:config');

export interface CliCommand {
  cmd: string;
  caption: string;
}
export interface CliCommandPlugin {
  packageName: string;
  packageRoot: string;
  description: string;
  commands: CliCommand[];
  mcpEnabled: boolean;
  cliEnabled?: boolean;
  main: string;
  executor: (cmd: string, apps: MetroInspectorProxyApp[]) => Promise<string>;
}

export class CliCommandsManager {
  private plugins: CliCommandPlugin[] | null = null;
  private mcpServer: McpServer;
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
    const mcpServer = new McpServer({
      name: 'EXPO CLI MCP Server',
      version: '0.0.1',
    });

    // Add tools
    this.queryPluginsAsync().then((plugins) => {
      plugins
        .filter((plugin) => plugin.mcpEnabled)
        .forEach((plugin) => {
          mcpServer.tool(
            plugin.packageName,
            plugin.description,
            {
              cmd: z
                .string()
                .describe(
                  plugin.description +
                    '\nCommands:\n' +
                    plugin.commands.map((c) => c.cmd + ': ' + c.caption).join('\n')
                ),
            },
            async ({ cmd }) => {
              try {
                // Verify that we have apps connected to the dev server.
                const devServerManager = this.devServerManagerRef.deref();
                if (!devServerManager) {
                  throw new Error('DevServerManager has been garbage collected');
                }
                const metroServerOrigin = devServerManager
                  .getDefaultDevServer()
                  .getJsInspectorBaseUrl();

                const apps = await queryAllInspectorAppsAsync(metroServerOrigin);
                if (!apps.length) {
                  throw Error(
                    chalk`{bold Debug:} No compatible apps connected, React Native DevTools can only be used with Hermes. ${learnMore(
                      'https://docs.expo.dev/guides/using-hermes/'
                    )}`
                  );
                }

                const result = await plugin.executor(cmd, apps);
                return {
                  content: [
                    {
                      type: 'text',
                      text: `Executed command: ${cmd}`,
                    },
                    {
                      type: 'text',
                      text: `${result}`,
                    },
                  ],
                  isError: false,
                };
              } catch (error: any) {
                return {
                  content: [
                    {
                      type: 'text',
                      text: `Executed command: ${cmd}`,
                    },
                    {
                      type: 'text',
                      text: `${error.toString()}`,
                    },
                  ],
                  isError: true,
                };
              }
            }
          );
        });
    });

    return mcpServer;
  }

  async startMCPServer() {
    const app = express();
    app.use(express.json());

    app.post('/mcp', async (req: Request, res: Response) => {
      const server = this.mcpServer;
      try {
        const transport: StreamableHTTPServerTransport = new StreamableHTTPServerTransport({
          sessionIdGenerator: undefined,
        });
        await server.connect(transport);
        await transport.handleRequest(req, res, req.body);
        res.on('close', () => {
          transport.close();
          server.close();
        });
      } catch (error) {
        console.error('Error handling MCP request:', error);
        if (!res.headersSent) {
          res.status(500).json({
            jsonrpc: '2.0',
            error: {
              code: -32603,
              message: 'Internal server error',
            },
            id: null,
          });
        }
      }
    });

    app.get('/mcp', async (req: Request, res: Response) => {
      res.writeHead(405).end(
        JSON.stringify({
          jsonrpc: '2.0',
          error: {
            code: -32000,
            message: 'Method not allowed.',
          },
          id: null,
        })
      );
    });

    app.delete('/mcp', async (req: Request, res: Response) => {
      res.writeHead(405).end(
        JSON.stringify({
          jsonrpc: '2.0',
          error: {
            code: -32000,
            message: 'Method not allowed.',
          },
          id: null,
        })
      );
    });

    // Start the server
    const PORT = 3000;
    app.listen(PORT, () => {
      //console.log(`MCP Stateless Streamable HTTP Server listening on port ${PORT}`);
    });

    // Handle server shutdown
    process.on('SIGINT', async () => {
      console.log('Shutting down server...');
      process.exit(0);
    });
  }

  public async queryPluginsAsync(): Promise<CliCommandPlugin[]> {
    if (this.plugins) {
      return this.plugins;
    }
    const plugins = (await this.queryAutolinkedPluginsAsync(this.projectRoot)).map((plugin) => ({
      ...plugin,
      executor: async (cmd: string, apps: MetroInspectorProxyApp[]) => {
        return new Promise<string>(async (resolve, reject) => {
          // Set up the command and its arguments
          const appsArg = `'${JSON.stringify(apps)}'`;
          const cwd = plugin.packageRoot;
          const child = spawn('node', [plugin.main, cmd, appsArg], {
            cwd,
            shell: true,
            env: { ...process.env, FORCE_COLOR: '1' },
          });
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

  private async queryAutolinkedPluginsAsync(projectRoot: string): Promise<CliCommandPlugin[]> {
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
    })) as CliCommandPlugin[];
    debug('Found autolinked plugins', plugins);
    return plugins;
  }
}
