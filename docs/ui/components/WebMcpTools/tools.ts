import Router from 'next/router';

import { getVersionFromPath } from '~/providers/page-api-version';
import navigation from '~/public/static/constants/navigation.json';
import { NavigationRoute } from '~/types/common';
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
const DOCS_ORIGIN = 'https://docs.expo.dev';

const NAVIGATION_AREAS = [
  'home',
  'general',
  'eas',
  'learn',
  'reference',
  'preview',
  'archive',
] as const;

type SearchHit = { url: string; hierarchy: Record<string, string | null> };
type SkillsIndex = { skills: { name: string; url: string }[] };
type NavigationArea = (typeof NAVIGATION_AREAS)[number];
type PageEntry = { section: string; group?: string; title: string; path: string };

function toSiteUrl(path: unknown) {
  if (typeof path !== 'string' || !(path.startsWith('/') || /^https?:\/\//.test(path))) {
    throw new TypeError('path must be a docs.expo.dev URL or a path that starts with "/".');
  }

  const url = new URL(path, window.location.origin);
  if (url.origin !== window.location.origin && url.origin !== DOCS_ORIGIN) {
    throw new TypeError('path must stay on docs.expo.dev.');
  }

  return new URL(`${url.pathname}${url.search}${url.hash}`, window.location.origin);
}

const SEARCH_QUERY_MAX_LENGTH = 200;
const FEEDBACK_MAX_LENGTH = 1000;

function requireText(value: unknown, field: string, maxLength = Infinity) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new TypeError(`${field} must be a non-empty string.`);
  }
  if (value.trim().length > maxLength) {
    throw new TypeError(`${field} must be at most ${maxLength} characters.`);
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

async function readPageMarkdownAsync(path: unknown, signal: AbortSignal) {
  const url = toSiteUrl(path);
  return await fetchTextAsync(
    getMarkdownFilePath(`${url.pathname}${url.search}`) ?? '/index.md',
    signal
  );
}

async function getPageMarkdownAsync(
  { path = window.location.pathname }: ToolInput,
  { signal }: { signal: AbortSignal }
) {
  return await readPageMarkdownAsync(path, signal);
}

function parsePageInfo(markdown: string) {
  const frontmatter = /^---\n([\S\s]*?)\n---\n/.exec(markdown);
  const details: Record<string, string> = {};
  for (const line of frontmatter?.[1].split('\n') ?? []) {
    const field = /^([A-Za-z]\w*):\s*(.*)$/.exec(line);
    if (field) {
      details[field[1]] = field[2].replace(/^(["'])(.*)\1$/, '$2');
    }
  }

  const headings: { level: number; text: string }[] = [];
  let inCodeBlock = false;
  for (const line of markdown.slice(frontmatter?.[0].length ?? 0).split('\n')) {
    if (/^\s*(```|~~~)/.test(line)) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    const heading = inCodeBlock ? null : /^(#{1,6})\s+(.+?)\s*#*$/.exec(line);
    if (heading) {
      headings.push({ level: heading[1].length, text: heading[2] });
    }
  }
  return { ...details, headings };
}

async function getPageInfoAsync(
  { path = window.location.pathname }: ToolInput,
  { signal }: { signal: AbortSignal }
) {
  const info = parsePageInfo(await readPageMarkdownAsync(path, signal));
  return JSON.stringify({ path: toSiteUrl(path).pathname, ...info });
}

function sectionName(section: NavigationRoute) {
  return section.name || 'Top level';
}

function sectionsOf(area: NavigationArea) {
  const version = getVersionFromPath(window.location.pathname) ?? 'latest';
  const routes =
    area === 'reference'
      ? (navigation.reference as Record<string, unknown>)[version]
      : navigation[area];
  return ((routes ?? []) as NavigationRoute[]).filter(route => !route.hidden);
}

function listPages(route: NavigationRoute, section: string, group?: string): PageEntry[] {
  if (route.hidden) {
    return [];
  }
  if (route.type === 'page') {
    return [
      {
        section,
        ...(group && { group }),
        title: route.sidebarTitle ?? route.name,
        path: route.href,
      },
    ];
  }
  return (route.children ?? []).flatMap(child => listPages(child, section, route.name));
}

async function listSectionsAsync({ area, section }: ToolInput) {
  if (area === undefined) {
    return JSON.stringify(
      NAVIGATION_AREAS.map(name => ({ area: name, sections: sectionsOf(name).map(sectionName) }))
    );
  }
  if (!NAVIGATION_AREAS.includes(area as NavigationArea)) {
    throw new TypeError(`area must be one of: ${NAVIGATION_AREAS.join(', ')}.`);
  }

  const sections = sectionsOf(area as NavigationArea);
  const matches = sections.filter(node => section === undefined || sectionName(node) === section);
  if (!matches.length) {
    throw new Error(
      `No section named "${String(section)}" in ${String(area)}. Sections: ${sections.map(sectionName).join(', ')}.`
    );
  }
  return JSON.stringify(
    matches.flatMap(node =>
      (node.children ?? []).flatMap(child => listPages(child, sectionName(node)))
    )
  );
}

async function searchDocsAsync(
  { query, limit = 5 }: ToolInput,
  { signal }: { signal: AbortSignal }
) {
  const hitsPerPage = typeof limit === 'number' ? Math.min(Math.max(Math.trunc(limit), 1), 20) : 5;
  const version = getVersionFromPath(window.location.pathname) ?? 'latest';
  const params = new URLSearchParams({
    query: requireText(query, 'query', SEARCH_QUERY_MAX_LENGTH),
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

async function askDocsAsync({ query }: ToolInput, { signal }: { signal: AbortSignal }) {
  const question = requireText(query, 'query');
  const { askKapaAsync } = await import('./askDocs');
  return JSON.stringify(await askKapaAsync(question, signal));
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
      feedback: requireText(feedback, 'feedback', FEEDBACK_MAX_LENGTH),
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
  maxLength: 500,
  description: 'A docs.expo.dev URL or a path that starts with "/". Defaults to the current page.',
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
        query: {
          type: 'string',
          maxLength: SEARCH_QUERY_MAX_LENGTH,
          description: 'What to search for.',
        },
        limit: { type: 'integer', minimum: 1, maximum: 20, description: 'Defaults to 5.' },
      },
      required: ['query'],
      additionalProperties: false,
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
    inputSchema: {
      type: 'object',
      properties: { path: pathProperty },
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true },
    execute: getPageMarkdownAsync,
  },
  {
    name: 'get_page_info',
    title: 'Get Expo docs page details',
    description:
      'Returns the title, description, other frontmatter fields, and headings of an Expo ' +
      'documentation page as JSON, without the page text. Use it to find a section before ' +
      'reading the page with get_page_markdown.',
    inputSchema: {
      type: 'object',
      properties: { path: pathProperty },
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true },
    execute: getPageInfoAsync,
  },
  {
    name: 'get_site_overview',
    title: 'Get Expo docs overview',
    description:
      'Returns llms.txt: an index of every Expo documentation page with a short summary.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true },
    execute: getSiteOverviewAsync,
  },
  {
    name: 'list_sections',
    title: 'List Expo docs sections',
    description:
      'Without input, returns each area of the Expo docs sidebar with its section names as JSON. ' +
      'With an area, returns the pages of that area, or of one section when you also pass ' +
      'section, with a title and a path for each page.',
    inputSchema: {
      type: 'object',
      properties: {
        area: {
          type: 'string',
          enum: [...NAVIGATION_AREAS],
          description: 'A sidebar area. reference lists the SDK version of the current page.',
        },
        section: {
          type: 'string',
          maxLength: 100,
          description: 'A section name returned without input.',
        },
      },
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true },
    execute: listSectionsAsync,
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
        skill_name: {
          type: 'string',
          maxLength: 100,
          description: 'The skill name, such as "expo".',
        },
      },
      required: ['skill_name'],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true },
    execute: readSkillAsync,
  },
  {
    name: 'ask_docs',
    title: 'Ask the Expo docs AI assistant',
    description:
      'Asks the Expo documentation AI assistant (Kapa) a question and returns its answer with ' +
      'source links as JSON. The answer is generated and can take several seconds.',
    inputSchema: {
      type: 'object',
      properties: { query: { type: 'string', description: 'The question to ask.' } },
      required: ['query'],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true },
    execute: askDocsAsync,
  },
  {
    name: 'navigate_page',
    title: 'Open an Expo docs page',
    description: 'Opens an Expo documentation page in this tab.',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          maxLength: 500,
          description: 'A docs.expo.dev URL or a path that starts with "/".',
        },
      },
      required: ['path'],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: false },
    execute: navigatePageAsync,
  },
  {
    name: 'send_feedback',
    title: 'Send feedback on an Expo docs page',
    description:
      'Sends written feedback about a documentation page to the Expo documentation team, and ' +
      'returns a confirmation.',
    inputSchema: {
      type: 'object',
      properties: {
        feedback: {
          type: 'string',
          maxLength: FEEDBACK_MAX_LENGTH,
          description: 'The feedback text.',
        },
        path: pathProperty,
      },
      required: ['feedback'],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: false, consequentialHint: true },
    execute: sendFeedbackAsync,
  },
];
