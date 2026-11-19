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
    await expect(tools.read_skill.execute({ skill_name: 'nope' }, { signal })).rejects.toThrow(
      'Available skills: expo.'
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

    const results = await tools.search_docs.execute({ query: 'camera', limit: 50 }, { signal });

    expect(JSON.parse(results)).toEqual([
      { title: 'Expo Camera > Permissions', path: '/versions/latest/sdk/camera/#permissions' },
    ]);
    const [, init] = fetchMock.mock.calls[0];
    expect(JSON.parse(init?.body ?? '')).toEqual({
      params: 'query=camera&hitsPerPage=20',
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

  it('asks the Kapa assistant and returns its answer with sources', async () => {
    askKapaAsync.mockClear();
    const { tools } = renderTools();

    const answer = await tools.ask_docs.execute({ query: 'How do I add a camera?' }, { signal });

    expect(askKapaAsync).toHaveBeenCalledWith('How do I add a camera?', signal);
    expect(JSON.parse(answer).sources[0].title).toBe('Camera');
    await expect(tools.ask_docs.execute({ query: ' ' }, { signal })).rejects.toThrow(
      'query must be a non-empty string.'
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
    await expect(tools.list_sections.execute({ area: 'nope' }, { signal })).rejects.toThrow(
      'area must be one of'
    );
    await expect(
      tools.list_sections.execute({ area: 'eas', section: 'Nope' }, { signal })
    ).rejects.toThrow('Sections: ');
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
      await expect(tools.get_page_markdown.execute({ path }, { signal })).rejects.toThrow(
        TypeError
      );
      await expect(tools.navigate_page.execute({ path }, { signal })).rejects.toThrow(TypeError);
      await expect(
        tools.send_feedback.execute({ feedback: 'x', path }, { signal })
      ).rejects.toThrow(TypeError);
    }
    expect(fetchMock).not.toHaveBeenCalled();
    expect(routerPush).not.toHaveBeenCalled();
  });

  it('rejects a search query or feedback over its length limit before any request', async () => {
    const { tools } = renderTools();

    await expect(tools.search_docs.execute({ query: 'a'.repeat(201) }, { signal })).rejects.toThrow(
      'query must be at most 200 characters.'
    );
    await expect(
      tools.send_feedback.execute({ feedback: 'a'.repeat(1001) }, { signal })
    ).rejects.toThrow('feedback must be at most 1000 characters.');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
