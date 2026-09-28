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

function createRegistryWithTool() {
  const registry = new ModelContextRegistry();
  const send = jest.fn((message: Record<string, any>) => {
    // The app echoes the argument back through the registry, like a real tool would.
    registry.handleResponse('c1', {
      id: message.id,
      result: { content: [{ type: 'text', text: `echo:${message.params.arguments.text}` }] },
    });
  });
  registry.addConnection({ id: 'c1', send });
  registry.registerTool('c1', {
    name: 'echo',
    description: 'Echo text',
    inputSchema: { type: 'object' },
  });
  return registry;
}

describe(addModelContextMcpCapabilities, () => {
  it('should register app_list_tools and app_call_tool', () => {
    const { server, tools } = createMockMcpServer();
    addModelContextMcpCapabilities(server, new ModelContextRegistry());
    expect([...tools.keys()]).toEqual(['app_list_tools', 'app_call_tool']);
  });

  it('should list the registered tools', async () => {
    const { server, tools } = createMockMcpServer();
    addModelContextMcpCapabilities(server, createRegistryWithTool());
    const result = await tools.get('app_list_tools')!.handler({});
    expect(JSON.parse(result.content[0].text)).toEqual({
      tools: [{ name: 'echo', description: 'Echo text', inputSchema: { type: 'object' } }],
    });
  });

  it('should report when no app is connected', async () => {
    const { server, tools } = createMockMcpServer();
    addModelContextMcpCapabilities(server, new ModelContextRegistry());
    const result = await tools.get('app_list_tools')!.handler({});
    expect(result.content[0].text).toMatch(/No app is connected/);
  });

  it('should forward app_call_tool to the app and pass the result through', async () => {
    const { server, tools } = createMockMcpServer();
    addModelContextMcpCapabilities(server, createRegistryWithTool());
    await expect(
      tools.get('app_call_tool')!.handler({ name: 'echo', arguments: { text: 'hi' } })
    ).resolves.toEqual({ content: [{ type: 'text', text: 'echo:hi' }], isError: undefined });
  });

  it('should return an error result for an unknown tool', async () => {
    const { server, tools } = createMockMcpServer();
    addModelContextMcpCapabilities(server, createRegistryWithTool());
    const result = await tools.get('app_call_tool')!.handler({ name: 'missing', arguments: {} });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toMatch(/Unknown tool/);
  });
});
