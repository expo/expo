import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { ExpoCliOutput } from 'expo-cli-extensions';
import express, { Request, Response } from 'express';
import { z } from 'zod';

import { CliCommandDescriptor, CliExtensionDescriptor } from './types';

const CleanAnsiColorsRegExp =
  /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g;

export class DevMCPServer {
  private mcpServer: McpServer;
  // @ts-ignore
  private httpServer: http.Server | null = null;
  private app: express.Application | null = null;

  constructor() {
    // Initialize the MCP server
    this.log('initialized');
    this.mcpServer = new McpServer({
      name: 'EXPO CLI MCP Server',
      version: '0.0.1',
    });
  }

  addTool(
    plugin: CliExtensionDescriptor,
    cb: (command: string, args: Record<string, any>) => Promise<string | undefined | null>
  ) {
    // Add a tool to the MCP server
    this.log('Adding tool:', plugin.commands.map((c) => c.name).join(', '));

    // Create the input schema for the tool
    const inputSchema = this.createSchema(plugin);

    // Create the tool in the MCP server
    this.mcpServer.registerTool(
      plugin.packageName,
      { description: plugin.description, inputSchema },
      async ({ parameters }) => {
        let { command, ...args } = parameters;
        args = { ...args, source: 'mcp' };
        try {
          // Execute the command using the plugin's executor
          const result = await cb(command, args);
          return {
            content: [
              // Expand the output to include the result of the command and remove Ansi colors
              ...(result
                ? ((JSON.parse(result) as ExpoCliOutput) ?? []).map((r) =>
                    r.type === 'text'
                      ? { ...r, text: r.text.replace(CleanAnsiColorsRegExp, '') }
                      : r
                  )
                : []),
            ],
            isError: false,
          };
        } catch (error: any) {
          return {
            content: [
              {
                type: 'text',
                text: `Executed command: ${JSON.stringify(args)}`,
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
  }

  start() {
    if (this.httpServer) {
      this.log('already running');
      return;
    }

    this.app = express();
    this.app.use(express.json());

    this.log('started');

    this.app.post('/mcp', async (req: Request, res: Response) => {
      const server = this.mcpServer;
      try {
        const transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: undefined,
        });
        // Log the request body
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

    this.app.get('/mcp', async (req: Request, res: Response) => {
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

    this.app.delete('/mcp', async (req: Request, res: Response) => {
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

    // Start the server - TODO: Handle acting as a proxy for other MCP servers
    const PORT = 3000;
    try {
      this.httpServer = this.app.listen(PORT, () => {
        this.log(`listening on port ${PORT}`);
      });
    } catch (error: any) {
      this.err('Error starting MCP server:', error);
    }
  }

  stop() {
    if (!this.httpServer) {
      this.log('not running');
      return;
    }
    // Logic to stop the MCP server
    this.log('stopped');
    this.httpServer?.close((err: any) => {
      if (err) {
        this.log('Error stopping:', err);
      } else {
        this.log('stopped successfully');
      }
    });
    this.mcpServer.close();
    this.httpServer = null;
    this.app = null;
  }

  private log(message: any, ...optionalParams: any[]) {
    // Custom logging logic for MCP server
    console.log(`🟢 [Expo MCPServer]`, message, ...optionalParams);
  }

  private warn(message: any, ...optionalParams: any[]) {
    // Custom logging logic for MCP server
    console.log(`🟠 [Expo MCPServer]`, message, ...optionalParams);
  }

  private err(message: any, ...optionalParams: any[]) {
    // Custom logging logic for MCP server
    console.log(`🔴 [Expo MCPServer]`, message, ...optionalParams);
  }

  private createSchema(plugin: CliExtensionDescriptor) {
    if (plugin.commands.length === 0) {
      throw new Error(
        `Plugin ${plugin.packageName} has no commands defined. Please define at least one command.`
      );
    }

    // Create the schema for the input parameters in the plugin. The plugin can have multiple commands, and some of them might have parameters.
    // We have a plugin with 1-to-many commands, but none of them have parameters.

    const createCommandSchema = (c: CliCommandDescriptor) =>
      z.object({
        command: z.literal(c.name).describe(c.caption),
        ...((c.parameters?.length ?? 0) > 0
          ? {
              // If the command has parameters, extend schema for them
              ...c.parameters!.reduce(
                (acc, param) => ({
                  ...acc,
                  [param.name]: z.string().describe(param.description || ''),
                }),
                {} as Record<string, z.ZodTypeAny>
              ),
            }
          : {}),
      });

    // If we only have a single command, we can return the schema directly.
    const commandSchemas = plugin.commands.map((c) => createCommandSchema(c));
    if (commandSchemas.length === 1) {
      return {
        parameters: commandSchemas[0],
      };
    }

    // The union type expects an array with at least two elements, so we need to create the type based
    // on the actual command schemas.
    type First = (typeof commandSchemas)[0];
    type Second = (typeof commandSchemas)[1];
    type Schema = [First, Second, ...z.ZodTypeAny[]];

    return {
      parameters:
        commandSchemas.length === 1 ? commandSchemas[0] : z.union(commandSchemas as Schema),
    };
  }
}
