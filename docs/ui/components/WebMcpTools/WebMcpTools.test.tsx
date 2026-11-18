import { jest } from '@jest/globals';
import { render } from '@testing-library/react';

import { WebMcpTools } from './WebMcpTools';

type RegisteredTool = {
  name: string;
  annotations: { readOnlyHint: boolean };
  execute: (input: { path?: unknown }, options: { signal: AbortSignal }) => Promise<string>;
};

const registerTool =
  jest.fn<(tool: RegisteredTool, options: { signal: AbortSignal }) => Promise<void>>();
const fetchMock = jest.fn(async (_url: string) => ({ ok: true, text: async () => '# Page' }));

function setModelContext(value?: { registerTool: typeof registerTool }) {
  Object.defineProperty(document, 'modelContext', { configurable: true, value });
}

function renderAndGetTool() {
  const { unmount } = render(<WebMcpTools />);
  const [tool, options] = registerTool.mock.calls[0];
  return { unmount, tool, options, signal: new AbortController().signal };
}

beforeEach(() => {
  registerTool.mockReset();
  registerTool.mockResolvedValue(undefined);
  fetchMock.mockClear();
  global.fetch = fetchMock as unknown as typeof fetch;
});

afterEach(() => {
  setModelContext(undefined);
});

describe(WebMcpTools, () => {
  it('renders nothing and registers nothing without WebMCP', () => {
    const { container } = render(<WebMcpTools />);

    expect(container).toBeEmptyDOMElement();
    expect(registerTool).not.toHaveBeenCalled();
  });

  it('registers one read-only tool and unregisters it on unmount', () => {
    setModelContext({ registerTool });
    const { tool, options, unmount } = renderAndGetTool();

    expect(registerTool).toHaveBeenCalledTimes(1);
    expect(tool.name).toBe('get_page_markdown');
    expect(tool.annotations.readOnlyHint).toBe(true);
    expect(options.signal.aborted).toBe(false);

    unmount();

    expect(options.signal.aborted).toBe(true);
  });

  it('returns the Markdown of the requested page and of the current page', async () => {
    setModelContext({ registerTool });
    const { tool, signal } = renderAndGetTool();

    await expect(
      tool.execute({ path: '/get-started/create-a-project/' }, { signal })
    ).resolves.toBe('# Page');
    await expect(tool.execute({}, { signal })).resolves.toBe('# Page');

    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      '/get-started/create-a-project/index.md',
      '/index.md',
    ]);
  });

  it('rejects paths that leave the docs site without fetching them', async () => {
    setModelContext({ registerTool });
    const { tool, signal } = renderAndGetTool();

    for (const path of ['https://example.com/', '//example.com/', '/\\example.com/', 42]) {
      await expect(tool.execute({ path }, { signal })).rejects.toThrow(TypeError);
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
