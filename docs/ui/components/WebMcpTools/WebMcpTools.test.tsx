import { jest } from '@jest/globals';
import { render } from '@testing-library/react';

import type { WebMcpTool } from './tools';

const routerPush = jest.fn(async (_url: string) => true);
const askKapaAsync = jest.fn(async (_question: string, _signal: AbortSignal) => ({
  answer: 'Run npx expo install expo-camera.',
  sources: [{ title: 'Camera', url: 'https://docs.expo.dev/versions/latest/sdk/camera/' }],
}));
jest.unstable_mockModule('next/router', () => ({ default: { push: routerPush } }));
jest.unstable_mockModule('~/ui/components/WebMcpTools/askDocs', () => ({ askKapaAsync }));
const reportWebMcpToolCall = jest.fn();
jest.unstable_mockModule('~/providers/Analytics', () => ({ reportWebMcpToolCall }));

const { WebMcpTools } = await import('./WebMcpTools');

type FetchCall = [url: string, init?: { method?: string; body?: string }];

const registerTool =
  jest.fn<(tool: WebMcpTool, options: { signal: AbortSignal }) => Promise<void>>();
const responses = new Map<string, unknown>();
const fetchMock = jest.fn(async (...[url]: FetchCall) => {
  const body = responses.get(url) ?? `# ${url}`;
  return {
    ok: true,
    status: 200,
    text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
    json: async () => body,
  };
});
const signal = new AbortController().signal;

function setModelContext(value?: { registerTool: typeof registerTool }) {
  Object.defineProperty(document, 'modelContext', { configurable: true, value });
}

function renderTools() {
  setModelContext({ registerTool });
  const { unmount } = render(<WebMcpTools />);
  const tools = Object.fromEntries(registerTool.mock.calls.map(([tool]) => [tool.name, tool]));
  return { unmount, tools, options: registerTool.mock.calls.map(([, options]) => options) };
}

beforeEach(() => {
  registerTool.mockReset();
  registerTool.mockResolvedValue(undefined);
  fetchMock.mockClear();
  responses.clear();
  global.fetch = fetchMock as unknown as typeof fetch;
  routerPush.mockClear();
  reportWebMcpToolCall.mockClear();
});

afterEach(() => {
  setModelContext(undefined);
  window.history.pushState({}, '', '/');
});

describe(WebMcpTools, () => {
  it('renders nothing and registers nothing without WebMCP', () => {
    const { container } = render(<WebMcpTools />);

    expect(container).toBeEmptyDOMElement();
    expect(registerTool).not.toHaveBeenCalled();
  });

  it('registers each tool once and unregisters all of them on unmount', () => {
    const { tools, options, unmount } = renderTools();

    expect(Object.keys(tools)).toEqual([
      'search_docs',
      'get_page_markdown',
      'get_page_info',
      'get_site_overview',
      'list_sections',
      'read_skill',
      'ask_docs',
      'navigate_page',
      'send_feedback',
    ]);
    expect(tools.navigate_page.annotations.readOnlyHint).toBe(false);
    expect(tools.send_feedback.annotations).toEqual({
      readOnlyHint: false,
      consequentialHint: true,
    });
    expect(tools.ask_docs.annotations).toEqual({
      readOnlyHint: true,
      untrustedContentHint: true,
    });

    unmount();

    expect(options.every(({ signal: toolSignal }) => toolSignal.aborted)).toBe(true);
  });

  it('reads page Markdown, the site overview, and a skill', async () => {
    responses.set('/.well-known/agent-skills/index.json', {
      skills: [{ name: 'expo', url: '/.well-known/agent-skills/expo/SKILL.md' }],
    });
    const { tools } = renderTools();

    await tools.get_page_markdown.execute({ path: '/get-started/create-a-project/' }, { signal });
    await tools.get_page_markdown.execute({}, { signal });
    await tools.get_site_overview.execute({}, { signal });
    await tools.read_skill.execute({ skill_name: 'expo' }, { signal });

    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      '/get-started/create-a-project/index.md',
      '/index.md',
      '/llms.txt',
      '/.well-known/agent-skills/index.json',
      '/.well-known/agent-skills/expo/SKILL.md',
    ]);
    await expect(tools.read_skill.execute({ skill_name: 'nope' }, { signal })).resolves.toBe(
      'Error: No skill named "nope". Available skills: expo.'
    );
  });

  it('searches the docs index for the current version and returns titles with paths', async () => {
    responses.set('https://QEX7PB7D46-dsn.algolia.net/1/indexes/expo/query', {
      hits: [
        {
          url: 'https://docs.expo.dev/versions/latest/sdk/camera/#permissions',
          hierarchy: { lvl0: 'Expo Camera', lvl1: 'Permissions', lvl2: null },
        },
      ],
    });
    const { tools } = renderTools();

    const results = await tools.search_docs.execute({ query: 'camera', limit: 3 }, { signal });

    expect(JSON.parse(results)).toEqual([
      { title: 'Expo Camera > Permissions', path: '/versions/latest/sdk/camera/#permissions' },
    ]);
    const [, init] = fetchMock.mock.calls[0];
    expect(JSON.parse(init?.body ?? '')).toEqual({
      params: 'query=camera&hitsPerPage=3',
      facetFilters: [['version:none', 'version:latest']],
    });
  });

  it('opens a docs page and sends feedback for a page', async () => {
    responses.set('https://api.expo.dev/v2/feedback/docs-send', {});
    const { tools } = renderTools();

    await tools.navigate_page.execute({ path: '/guides/overview/#top' }, { signal });
    await tools.send_feedback.execute(
      { feedback: 'Typo in step 2', path: '/guides/overview/' },
      { signal }
    );

    expect(routerPush).toHaveBeenCalledWith('/guides/overview/#top');
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.expo.dev/v2/feedback/docs-send');
    expect(JSON.parse(init?.body ?? '')).toEqual({
      feedback: 'Typo in step 2',
      url: '/guides/overview/',
    });
  });

  it('reports the HTTP status when the feedback service returns a page that is not JSON', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 502,
      text: async () => '<html>Bad Gateway</html>',
      json: async () => JSON.parse('<html>Bad Gateway</html>'),
    });
    const { tools } = renderTools();

    await expect(tools.send_feedback.execute({ feedback: 'Typo' }, { signal })).resolves.toBe(
      'Error: Feedback was not sent (HTTP 502).'
    );
  });

  it('accepts full docs.expo.dev links and keeps them on the current site', async () => {
    responses.set('https://api.expo.dev/v2/feedback/docs-send', {});
    const { tools } = renderTools();

    await tools.get_page_markdown.execute(
      { path: 'https://docs.expo.dev/get-started/create-a-project/' },
      { signal }
    );
    await tools.get_page_markdown.execute(
      { path: `${window.location.origin}/guides/overview/` },
      { signal }
    );
    await tools.navigate_page.execute(
      { path: 'https://docs.expo.dev/guides/overview/#top' },
      { signal }
    );
    await tools.send_feedback.execute(
      { feedback: 'Typo', path: 'https://docs.expo.dev/guides/overview/' },
      { signal }
    );

    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      '/get-started/create-a-project/index.md',
      '/guides/overview/index.md',
      'https://api.expo.dev/v2/feedback/docs-send',
    ]);
    expect(routerPush).toHaveBeenCalledWith('/guides/overview/#top');
    expect(JSON.parse(fetchMock.mock.calls[2][1]?.body ?? '').url).toBe('/guides/overview/');
  });

  it('returns page details without the code block lines that look like headings', async () => {
    responses.set(
      '/versions/latest/sdk/camera/index.md',
      [
        '---',
        'title: Camera',
        "packageName: 'expo-camera'",
        '---',
        '',
        '# Expo Camera',
        '## Installation',
        '```sh',
        '# npm',
        '```',
        '### Usage',
      ].join('\n')
    );
    const { tools } = renderTools();

    const info = await tools.get_page_info.execute(
      { path: 'https://docs.expo.dev/versions/latest/sdk/camera/' },
      { signal }
    );

    expect(JSON.parse(info)).toEqual({
      path: '/versions/latest/sdk/camera/',
      title: 'Camera',
      packageName: 'expo-camera',
      headings: [
        { level: 1, text: 'Expo Camera' },
        { level: 2, text: 'Installation' },
        { level: 3, text: 'Usage' },
      ],
    });
  });

  it('returns each section that matches a heading, with its parent headings', async () => {
    responses.set(
      '/versions/latest/sdk/camera/index.md',
      [
        '---',
        'title: Camera',
        '---',
        '',
        '# Expo Camera',
        '## Installation',
        'Run the install command.',
        '```sh',
        '# npm',
        '```',
        '### Usage',
        'Usage text.',
        '## CameraView',
        '### Props',
        '#### `children`',
        'Camera children.',
        '## CameraPreview',
        '### Props',
        '#### `children`',
        'Preview children.',
      ].join('\n')
    );
    const { tools } = renderTools();
    const path = '/versions/latest/sdk/camera/';

    const installation = await tools.get_page_markdown.execute(
      { path, section: 'installation' },
      { signal }
    );
    const children = await tools.get_page_markdown.execute(
      { path, section: 'children' },
      { signal }
    );

    expect(installation).toBe(
      [
        '# Expo Camera',
        '## Installation',
        'Run the install command.',
        '```sh',
        '# npm',
        '```',
        '### Usage',
        'Usage text.',
      ].join('\n')
    );
    expect(children).toBe(
      [
        '# Expo Camera',
        '## CameraView',
        '### Props',
        '#### `children`',
        'Camera children.',
        '',
        '# Expo Camera',
        '## CameraPreview',
        '### Props',
        '#### `children`',
        'Preview children.',
      ].join('\n')
    );
    await expect(
      tools.get_page_markdown.execute({ path, section: 'Permissions' }, { signal })
    ).resolves.toBe(
      'Error: No heading on /versions/latest/sdk/camera/ matches "Permissions". Pass a heading that get_page_info returns for this page.'
    );
  });

  it('asks the Kapa assistant and returns its answer with sources', async () => {
    askKapaAsync.mockClear();
    const { tools } = renderTools();

    const answer = await tools.ask_docs.execute({ query: 'How do I add a camera?' }, { signal });

    expect(askKapaAsync).toHaveBeenCalledWith('How do I add a camera?', signal);
    expect(JSON.parse(answer).sources[0].title).toBe('Camera');
    await expect(tools.ask_docs.execute({ query: ' ' }, { signal })).resolves.toBe(
      'Error: query must be a non-empty string.'
    );
    expect(askKapaAsync).toHaveBeenCalledTimes(1);
  });

  it('lists the sidebar areas, then the pages of one section', async () => {
    const { tools } = renderTools();

    const areas = JSON.parse(await tools.list_sections.execute({}, { signal }));
    const pages = JSON.parse(
      await tools.list_sections.execute({ area: 'eas', section: 'Expo Build' }, { signal })
    );

    expect(areas.map(({ area }: { area: string }) => area)).toEqual([
      'home',
      'general',
      'eas',
      'learn',
      'reference',
      'preview',
      'archive',
    ]);
    expect(areas.find(({ area }: { area: string }) => area === 'eas').sections).toContain(
      'Expo Build'
    );
    expect(pages[0]).toEqual({
      section: 'Expo Build',
      title: 'Introduction',
      path: '/build/introduction',
    });
    await expect(tools.list_sections.execute({ area: 'nope' }, { signal })).resolves.toBe(
      'Error: area must be one of: home, general, eas, learn, reference, preview, archive.'
    );
    await expect(
      tools.list_sections.execute({ area: 'eas', section: 'Nope' }, { signal })
    ).resolves.toMatch(/^Error: No section named "Nope" in eas\. Sections: /);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects paths that leave the docs site before any request or navigation', async () => {
    const { tools } = renderTools();
    const offSitePaths = [
      'https://example.com/',
      'https://docs.expo.dev.example.com/',
      'http://docs.expo.dev/',
      '//example.com/',
      '/\\example.com/',
      'get-started/',
      42,
    ];

    for (const path of offSitePaths) {
      await expect(tools.get_page_markdown.execute({ path }, { signal })).resolves.toMatch(
        /^Error: path must /
      );
      await expect(tools.navigate_page.execute({ path }, { signal })).resolves.toMatch(
        /^Error: path must /
      );
      await expect(
        tools.send_feedback.execute({ feedback: 'x', path }, { signal })
      ).resolves.toMatch(/^Error: path must /);
    }
    expect(fetchMock).not.toHaveBeenCalled();
    expect(routerPush).not.toHaveBeenCalled();
  });

  it('returns an error for input that does not match the schema, before any request', async () => {
    const { tools } = renderTools();
    const cases: [WebMcpTool, Record<string, unknown>, string][] = [
      [
        tools.search_docs,
        { query: 'camera', foo: 1 },
        'Unknown argument "foo". Arguments: query, limit.',
      ],
      [tools.get_site_overview, { foo: 1 }, 'Unknown argument "foo". Arguments: none.'],
      [tools.search_docs, {}, 'Missing argument "query".'],
      [tools.search_docs, { query: 7 }, 'query must be a string.'],
      [tools.search_docs, { query: 'camera', limit: 2.5 }, 'limit must be an integer.'],
      [tools.search_docs, { query: 'camera', limit: 50 }, 'limit must be at most 20.'],
      [tools.search_docs, { query: 'camera', limit: 0 }, 'limit must be at least 1.'],
      [tools.search_docs, { query: 'a'.repeat(201) }, 'query must be at most 200 characters.'],
      [
        tools.read_skill,
        { skill_name: 'a'.repeat(101) },
        'skill_name must be at most 100 characters.',
      ],
      [
        tools.send_feedback,
        { feedback: 'a'.repeat(1001) },
        'feedback must be at most 1000 characters.',
      ],
    ];

    for (const [tool, input, message] of cases) {
      await expect(tool.execute(input, { signal })).resolves.toBe(`Error: ${message}`);
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('reports each call with its tool, its outcome, and the page it started on', async () => {
    window.history.pushState({}, '', '/get-started/create-a-project/');
    routerPush.mockImplementationOnce(async (url: string) => {
      window.history.pushState({}, '', url);
      return true;
    });
    responses.set('/.well-known/agent-skills/index.json', { skills: [] });
    askKapaAsync.mockRejectedValueOnce(new DOMException('The call was cancelled.', 'AbortError'));
    const cancelled = new AbortController();
    cancelled.abort();
    const { tools } = renderTools();

    await tools.navigate_page.execute({ path: '/versions/latest/sdk/camera/' }, { signal });
    await tools.search_docs.execute({ query: 'camera', foo: 1 }, { signal });
    await tools.read_skill.execute({ skill_name: 'nope' }, { signal });
    await expect(
      tools.ask_docs.execute({ query: 'camera' }, { signal: cancelled.signal })
    ).rejects.toThrow('The call was cancelled.');

    const cameraPage = '/versions/latest/sdk/camera/';
    expect(reportWebMcpToolCall.mock.calls.map(([params]) => params)).toEqual([
      {
        webmcp_tool_name: 'navigate_page',
        webmcp_outcome: 'success',
        webmcp_tool_page: '/get-started/create-a-project/',
      },
      {
        webmcp_tool_name: 'search_docs',
        webmcp_outcome: 'invalid_input',
        webmcp_tool_page: cameraPage,
      },
      { webmcp_tool_name: 'read_skill', webmcp_outcome: 'not_found', webmcp_tool_page: cameraPage },
      { webmcp_tool_name: 'ask_docs', webmcp_outcome: 'cancelled', webmcp_tool_page: cameraPage },
    ]);
  });

  it('reports an input error, a missing target, and a failed request as different outcomes', async () => {
    responses.set('/.well-known/agent-skills/index.json', { skills: [] });
    const failNextRequest = (status: number) =>
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status,
        text: async () => '',
        json: async () => ({}),
      });
    const { tools } = renderTools();

    await tools.search_docs.execute({ query: '   ' }, { signal });
    await tools.get_page_markdown.execute({ path: 'https://evil.example/' }, { signal });
    await tools.get_page_markdown.execute({ path: 'get-started/' }, { signal });
    await tools.get_page_markdown.execute({ section: 'Nope' }, { signal });
    await tools.list_sections.execute({ area: 'eas', section: 'Nope' }, { signal });
    await tools.read_skill.execute({ skill_name: 'nope' }, { signal });
    failNextRequest(404);
    await tools.get_page_markdown.execute({ path: '/nope/' }, { signal });
    failNextRequest(500);
    await tools.search_docs.execute({ query: 'camera' }, { signal });

    expect(reportWebMcpToolCall.mock.calls.map(([params]) => params)).toEqual(
      [
        ['search_docs', 'invalid_input'],
        ['get_page_markdown', 'invalid_input'],
        ['get_page_markdown', 'invalid_input'],
        ['get_page_markdown', 'not_found'],
        ['list_sections', 'not_found'],
        ['read_skill', 'not_found'],
        ['get_page_markdown', 'not_found'],
        ['search_docs', 'error'],
      ].map(([tool, outcome]) => ({
        webmcp_tool_name: tool,
        webmcp_outcome: outcome,
        webmcp_tool_page: '/',
      }))
    );
  });
});
