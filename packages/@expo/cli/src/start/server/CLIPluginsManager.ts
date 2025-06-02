import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import express, { Request, Response } from 'express';
import path from 'path';
import resolveFrom from 'resolve-from';
import { Server } from 'ws';
import { z } from 'zod';

const debug = require('debug')('expo:start:server:config');

interface CLIExtensionPlugin {
  packageName: string;
  packageRoot: string;
  description: string;
  commands: {
    cmd: string;
    caption: string;
  }[];
  mcpEnabled: boolean;
  main: string;
  executor: (cmd: string) => Promise<string>;
}

export class CLIPluginsManager {
  private plugins: CLIExtensionPlugin[] | null = null;
  private mcpServer: McpServer;

  constructor(private projectRoot: string) {
    this.mcpServer = new McpServer({
      name: 'EXPO CLI MCP Server',
      version: '0.0.1',
    });

    // Add tools
    this.queryPluginsAsync().then((plugins) => {
      plugins
        .filter((plugin) => plugin.mcpEnabled)
        .forEach((plugin) => {
          console.log('Adding mcp tool for plugin:', plugin.packageName);
          console.log(plugin.description);
          console.log(
            'Commands:',
            plugin.commands.map((c) => c.cmd)
          );

          this.mcpServer.tool(
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
              const result = await plugin.executor(cmd);
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
              };
            }
          );
        });

      this.startMCPServer();
    });
  }

  async startMCPServer() {
    console.log('Starting MCP Stateless Streamable HTTP Server...');
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
          console.log('Request closed');
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
      console.log('Received GET MCP request');
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
      console.log('Received DELETE MCP request');
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
      console.log(`MCP Stateless Streamable HTTP Server listening on port ${PORT}`);
    });

    // Handle server shutdown
    process.on('SIGINT', async () => {
      console.log('Shutting down server...');
      process.exit(0);
    });
  }

  public async queryPluginsAsync(): Promise<CLIExtensionPlugin[]> {
    if (this.plugins) {
      return this.plugins;
    }
    const plugins = (await this.queryAutolinkedPluginsAsync(this.projectRoot)).map((plugin) => ({
      ...plugin,
      executor: require(path.join(plugin.packageRoot, plugin.main))
        .default as () => Promise<string>,
    }));

    this.plugins = plugins;
    return this.plugins;
  }

  private async queryAutolinkedPluginsAsync(projectRoot: string): Promise<CLIExtensionPlugin[]> {
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
    })) as CLIExtensionPlugin[];
    debug('Found autolinked plugins', plugins);
    return plugins;
  }
}
