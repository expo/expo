import { addModelContextMcpCapabilities } from '../MCPModelContextTools';
import { ModelContextRegistry } from '../ModelContextRegistry';

jest.mock('../../../../log');

type ToolHandler = (args: any) => Promise<any>;

function createMockMcpServer() {
  const tools = new Map<string, { config: any; handler: ToolHandler }>();
  const server = {
    registerTool: jest.fn((name: string, config: any, handler: ToolHandler) => {
      tools.set(name, { config, handler });
    }),
  } as any;
  return { tools, server };
}

async function createRegistryWithTools() {
  const registry = new ModelContextRegistry('/app');
  registry.configure({
    resolveOwner: async ({ stack }) =>
      stack === 'pkg' ? { kind: 'package', name: 'expo-sqlite' } : { kind: 'project' },
  });
  const send = jest.fn((message: Record<string, any>) => {
    // The app echoes the argument back through the registry, like a real tool would.
    registry.handleResponse('c1', {
      id: message.id,
      result: { content: [{ type: 'text', text: `echo:${message.params.arguments.text}` }] },
    });
  });
  registry.addConnection({ id: 'c1', trusted: true, send });
  registry.markHello('c1');
  await registry.registerToolAsync('c1', {
    name: 'echo',
    description: 'Echo text',
    inputSchema: { type: 'object' },
  });
  await registry.registerToolAsync('c1', {
    name: 'query',
    description: 'Run SQL',
    inputSchema: { type: 'object' },
    stack: 'pkg',
  });
  return registry;
}

describe(addModelContextMcpCapabilities, () => {
  it('registers app_list_tools and app_call_tool', () => {
    const { server, tools } = createMockMcpServer();
    addModelContextMcpCapabilities(server, new ModelContextRegistry('/app'));
    expect([...tools.keys()]).toEqual(['app_list_tools', 'app_call_tool']);
  });

  it('reports when no app is connected', async () => {
    const { server, tools } = createMockMcpServer();
    addModelContextMcpCapabilities(server, new ModelContextRegistry('/app'));
    const result = await tools.get('app_list_tools')!.handler({});
    expect(result.content[0].text).toMatch(/No app is connected/);
  });

  it('lists allowed tools with attribution and blocked tools with reasons', async () => {
    const { server, tools } = createMockMcpServer();
    addModelContextMcpCapabilities(server, await createRegistryWithTools());
    const result = await tools.get('app_list_tools')!.handler({});
    expect(JSON.parse(result.content[0].text)).toEqual({
      tools: [
        {
          name: 'app__echo',
          description: '[Registered at runtime by the app] Echo text',
          inputSchema: { type: 'object' },
          owner: 'project',
        },
      ],
      blocked: [
        {
          name: 'pkg_expo-sqlite__query',
          owner: 'package "expo-sqlite"',
          reason: expect.stringContaining('allowedPackages'),
        },
      ],
    });
  });

  it('forwards app_call_tool to the app and passes the result through', async () => {
    const { server, tools } = createMockMcpServer();
    addModelContextMcpCapabilities(server, await createRegistryWithTools());
    const call = tools.get('app_call_tool')!.handler;

    await expect(call({ name: 'app__echo', arguments: { text: 'hi' } })).resolves.toEqual({
      content: [{ type: 'text', text: 'echo:hi' }],
      isError: undefined,
    });

    const blocked = await call({ name: 'pkg_expo-sqlite__query', arguments: {} });
    expect(blocked.isError).toBe(true);
    expect(blocked.content[0].text).toMatch(/blocked/);

    const missing = await call({ name: 'app__missing', arguments: {} });
    expect(missing.isError).toBe(true);
    expect(missing.content[0].text).toMatch(/Unknown tool/);
  });
});
