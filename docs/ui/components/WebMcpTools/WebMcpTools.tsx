import { useEffect } from 'react';

import { getMarkdownPath } from '~/ui/components/MarkdownActions/paths';

type PageMarkdownInput = { path?: unknown };

type ModelContextTool = {
  name: string;
  title: string;
  description: string;
  inputSchema: object;
  annotations: { readOnlyHint: boolean };
  execute: (input: PageMarkdownInput, options: { signal: AbortSignal }) => Promise<string>;
};

type ModelContext = {
  registerTool: (tool: ModelContextTool, options: { signal: AbortSignal }) => Promise<void>;
};

function resolveMarkdownUrl(path: unknown) {
  if (typeof path !== 'string' || !path.startsWith('/')) {
    throw new TypeError('path must be a docs.expo.dev path that starts with "/".');
  }

  const url = new URL(path, window.location.origin);
  if (url.origin !== window.location.origin) {
    throw new TypeError('path must stay on docs.expo.dev.');
  }

  return getMarkdownPath(`${url.pathname}${url.search}`) ?? '/index.md';
}

async function getPageMarkdownAsync(
  { path = window.location.pathname }: PageMarkdownInput,
  { signal }: { signal: AbortSignal }
) {
  const markdownUrl = resolveMarkdownUrl(path);
  const response = await fetch(markdownUrl, { signal });
  if (!response.ok) {
    throw new Error(`No Markdown found at ${markdownUrl} (HTTP ${response.status}).`);
  }
  return await response.text();
}

const pageMarkdownTool: ModelContextTool = {
  name: 'get_page_markdown',
  title: 'Get Expo docs page as Markdown',
  description:
    'Returns an Expo documentation page as Markdown. Pass a path such as ' +
    '/get-started/create-a-project/, or omit it to read the current page.',
  inputSchema: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'A docs.expo.dev path that starts with "/". Defaults to the current page.',
      },
    },
  },
  annotations: { readOnlyHint: true },
  execute: getPageMarkdownAsync,
};

export function WebMcpTools() {
  useEffect(() => {
    const modelContext = (document as Document & { modelContext?: ModelContext }).modelContext;
    if (!modelContext) {
      return;
    }

    const controller = new AbortController();
    modelContext.registerTool(pageMarkdownTool, { signal: controller.signal }).catch(error => {
      if (!controller.signal.aborted) {
        console.error('Unable to register the WebMCP tools', error);
      }
    });
    return () => {
      controller.abort();
    };
  }, []);

  return null;
}
