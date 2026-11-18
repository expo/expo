import Router from 'next/router';

import { getVersionFromPath } from '~/providers/page-api-version';
import { FEEDBACK_URL } from '~/ui/components/Footer/feedbackUrl';
import { getMarkdownFilePath } from '~/ui/components/MarkdownActions/paths';

type ToolInput = Record<string, unknown>;

export type WebMcpTool = {
  name: string;
  title: string;
  description: string;
  inputSchema: object;
  annotations: { readOnlyHint: boolean; consequentialHint?: boolean };
  execute: (input: ToolInput, options: { signal: AbortSignal }) => Promise<string>;
};

const SEARCH = {
  url: 'https://QEX7PB7D46-dsn.algolia.net/1/indexes/expo/query',
  applicationId: 'QEX7PB7D46',
  searchOnlyApiKey: '6652d26570e8628af4601e1d78ad456b',
};

const SKILLS_INDEX_URL = '/.well-known/agent-skills/index.json';

type SearchHit = { url: string; hierarchy: Record<string, string | null> };
type SkillsIndex = { skills: { name: string; url: string }[] };

function toSiteUrl(path: unknown) {
  if (typeof path !== 'string' || !path.startsWith('/')) {
    throw new TypeError('path must be a docs.expo.dev path that starts with "/".');
  }

  const url = new URL(path, window.location.origin);
  if (url.origin !== window.location.origin) {
    throw new TypeError('path must stay on docs.expo.dev.');
  }

  return url;
}

function requireText(value: unknown, field: string) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new TypeError(`${field} must be a non-empty string.`);
  }
  return value.trim();
}

async function fetchTextAsync(url: string, signal: AbortSignal) {
  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(`Could not read ${url} (HTTP ${response.status}).`);
  }
  return await response.text();
}

async function getPageMarkdownAsync(
  { path = window.location.pathname }: ToolInput,
  { signal }: { signal: AbortSignal }
) {
  const url = toSiteUrl(path);
  return await fetchTextAsync(
    getMarkdownFilePath(`${url.pathname}${url.search}`) ?? '/index.md',
    signal
  );
}

async function searchDocsAsync(
  { query, limit = 5 }: ToolInput,
  { signal }: { signal: AbortSignal }
) {
  const hitsPerPage = typeof limit === 'number' ? Math.min(Math.max(Math.trunc(limit), 1), 20) : 5;
  const version = getVersionFromPath(window.location.pathname) ?? 'latest';
  const params = new URLSearchParams({
    query: requireText(query, 'query'),
    hitsPerPage: `${hitsPerPage}`,
  });

  const response = await fetch(SEARCH.url, {
    method: 'POST',
    signal,
    headers: {
      'X-Algolia-Application-Id': SEARCH.applicationId,
      'X-Algolia-API-Key': SEARCH.searchOnlyApiKey,
    },
    body: JSON.stringify({
      params: params.toString(),
      facetFilters: [['version:none', `version:${version}`]],
    }),
  });
  if (!response.ok) {
    throw new Error(`Search failed (HTTP ${response.status}).`);
  }

  const { hits } = (await response.json()) as { hits: SearchHit[] };
  const results = hits.map(hit => {
    const url = new URL(hit.url);
    return {
      title: Object.values(hit.hierarchy).filter(Boolean).join(' > '),
      path: `${url.pathname}${url.hash}`,
    };
  });
  return JSON.stringify(results);
}

async function getSiteOverviewAsync(_input: ToolInput, { signal }: { signal: AbortSignal }) {
  return await fetchTextAsync('/llms.txt', signal);
}

async function readSkillAsync({ skill_name }: ToolInput, { signal }: { signal: AbortSignal }) {
  const name = requireText(skill_name, 'skill_name');
  const index = JSON.parse(await fetchTextAsync(SKILLS_INDEX_URL, signal)) as SkillsIndex;
  const skill = index.skills.find(entry => entry.name === name);
  if (!skill) {
    const available = index.skills.map(entry => entry.name).join(', ');
    throw new Error(`No skill named "${name}". Available skills: ${available}.`);
  }
  return await fetchTextAsync(toSiteUrl(skill.url).pathname, signal);
}

async function navigatePageAsync({ path }: ToolInput) {
  const url = toSiteUrl(path);
  const target = `${url.pathname}${url.search}${url.hash}`;
  await Router.push(target);
  return `Opened ${target}.`;
}

async function sendFeedbackAsync(
  { feedback, path = window.location.pathname }: ToolInput,
  { signal }: { signal: AbortSignal }
) {
  const response = await fetch(FEEDBACK_URL, {
    method: 'POST',
    signal,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      feedback: requireText(feedback, 'feedback'),
      url: toSiteUrl(path).pathname,
    }),
  });
  const result = (await response.json()) as { errors?: unknown[] };
  if (!response.ok || result.errors) {
    throw new Error(`Feedback was not sent: ${JSON.stringify(result.errors ?? response.status)}.`);
  }
  return 'Feedback sent to the Expo documentation team.';
}

const pathProperty = {
  type: 'string',
  description: 'A docs.expo.dev path that starts with "/". Defaults to the current page.',
};

export const webMcpTools: WebMcpTool[] = [
  {
    name: 'search_docs',
    title: 'Search Expo docs',
    description:
      'Searches the Expo documentation and returns matching sections as JSON with a title and ' +
      'a path. Pass a path to get_page_markdown to read a result.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'What to search for.' },
        limit: { type: 'integer', minimum: 1, maximum: 20, description: 'Defaults to 5.' },
      },
      required: ['query'],
    },
    annotations: { readOnlyHint: true },
    execute: searchDocsAsync,
  },
  {
    name: 'get_page_markdown',
    title: 'Get Expo docs page as Markdown',
    description:
      'Returns an Expo documentation page as Markdown. Pass a path such as ' +
      '/get-started/create-a-project/, or omit it to read the current page.',
    inputSchema: { type: 'object', properties: { path: pathProperty } },
    annotations: { readOnlyHint: true },
    execute: getPageMarkdownAsync,
  },
  {
    name: 'get_site_overview',
    title: 'Get Expo docs overview',
    description:
      'Returns llms.txt: an index of every Expo documentation page with a short summary.',
    inputSchema: { type: 'object', properties: {} },
    annotations: { readOnlyHint: true },
    execute: getSiteOverviewAsync,
  },
  {
    name: 'read_skill',
    title: 'Read an Expo agent skill',
    description:
      'Returns the SKILL.md of an Expo agent skill listed in /.well-known/agent-skills/index.json, ' +
      'such as "expo".',
    inputSchema: {
      type: 'object',
      properties: {
        skill_name: { type: 'string', description: 'The skill name, such as "expo".' },
      },
      required: ['skill_name'],
    },
    annotations: { readOnlyHint: true },
    execute: readSkillAsync,
  },
  {
    name: 'navigate_page',
    title: 'Open an Expo docs page',
    description: 'Opens an Expo documentation page in this tab.',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'A docs.expo.dev path that starts with "/".' },
      },
      required: ['path'],
    },
    annotations: { readOnlyHint: false },
    execute: navigatePageAsync,
  },
  {
    name: 'send_feedback',
    title: 'Send feedback on an Expo docs page',
    description:
      'Sends written feedback about a documentation page to the Expo documentation team. ' +
      'Only send feedback that the user asked you to send.',
    inputSchema: {
      type: 'object',
      properties: {
        feedback: { type: 'string', description: 'The feedback text.' },
        path: pathProperty,
      },
      required: ['feedback'],
    },
    annotations: { readOnlyHint: false, consequentialHint: true },
    execute: sendFeedbackAsync,
  },
];
