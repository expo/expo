import Router from 'next/router';

import { reportWebMcpToolCall, type WebMcpToolCallParams } from '~/providers/Analytics';
import { getVersionFromPath } from '~/providers/page-api-version';
import navigation from '~/public/static/constants/navigation.json';
import { NavigationRoute } from '~/types/common';
import { FEEDBACK_URL } from '~/ui/components/Footer/feedbackUrl';
import { getMarkdownFilePath } from '~/ui/components/MarkdownActions/paths';

type ToolInput = Record<string, unknown>;

type PropertySchema = {
  type: 'string' | 'integer';
  description: string;
  enum?: string[];
  maxLength?: number;
  minimum?: number;
  maximum?: number;
};

type InputSchema = {
  type: 'object';
  properties: Record<string, PropertySchema>;
  required?: string[];
  additionalProperties: false;
};

export type WebMcpTool = {
  name: string;
  title: string;
  description: string;
  inputSchema: InputSchema;
  annotations: {
    readOnlyHint: boolean;
    untrustedContentHint?: boolean;
    consequentialHint?: boolean;
  };
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

class InvalidInputError extends Error {}
class NotFoundError extends Error {}

function toSiteUrl(path: unknown) {
  if (typeof path !== 'string' || !(path.startsWith('/') || /^https?:\/\//.test(path))) {
    throw new InvalidInputError('path must be a docs.expo.dev URL or a path that starts with "/".');
  }

  const url = new URL(path, window.location.origin);
  if (url.origin !== window.location.origin && url.origin !== DOCS_ORIGIN) {
    throw new InvalidInputError('path must stay on docs.expo.dev.');
  }

  return new URL(`${url.pathname}${url.search}${url.hash}`, window.location.origin);
}

const SEARCH_QUERY_MAX_LENGTH = 200;
const FEEDBACK_MAX_LENGTH = 1000;
const SECTION_MAX_LENGTH = 200;

function requireText(value: unknown, field: string) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new InvalidInputError(`${field} must be a non-empty string.`);
  }
  return value.trim();
}

function checkValue(name: string, value: unknown, property: PropertySchema) {
  if (property.type === 'string') {
    if (typeof value !== 'string') {
      throw new InvalidInputError(`${name} must be a string.`);
    }
    if (property.enum && !property.enum.includes(value)) {
      throw new InvalidInputError(`${name} must be one of: ${property.enum.join(', ')}.`);
    }
    if (property.maxLength !== undefined && value.length > property.maxLength) {
      throw new InvalidInputError(`${name} must be at most ${property.maxLength} characters.`);
    }
    return;
  }
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    throw new InvalidInputError(`${name} must be an integer.`);
  }
  if (property.minimum !== undefined && value < property.minimum) {
    throw new InvalidInputError(`${name} must be at least ${property.minimum}.`);
  }
  if (property.maximum !== undefined && value > property.maximum) {
    throw new InvalidInputError(`${name} must be at most ${property.maximum}.`);
  }
}

function checkInput(input: ToolInput, schema: InputSchema) {
  const names = Object.keys(schema.properties);
  for (const name of Object.keys(input)) {
    if (!names.includes(name)) {
      throw new InvalidInputError(
        `Unknown argument "${name}". Arguments: ${names.join(', ') || 'none'}.`
      );
    }
  }
  for (const name of schema.required ?? []) {
    if (input[name] === undefined) {
      throw new InvalidInputError(`Missing argument "${name}".`);
    }
  }
  for (const [name, value] of Object.entries(input)) {
    if (value !== undefined) {
      checkValue(name, value, schema.properties[name]);
    }
  }
}

function errorResult(error: unknown) {
  return `Error: ${error instanceof Error ? error.message : String(error)}`;
}

function errorOutcome(error: unknown) {
  if (error instanceof InvalidInputError) {
    return 'invalid_input';
  }
  return error instanceof NotFoundError ? 'not_found' : 'error';
}

function withChecksAndReporting(tool: WebMcpTool): WebMcpTool {
  return {
    ...tool,
    async execute(input, options) {
      const startPage = window.location.pathname;
      const report = (outcome: WebMcpToolCallParams['webmcp_outcome']) => {
        reportWebMcpToolCall({
          webmcp_tool_name: tool.name,
          webmcp_outcome: outcome,
          webmcp_tool_page: startPage,
        });
      };

      try {
        checkInput(input, tool.inputSchema);
        const result = await tool.execute(input, options);
        report('success');
        return result;
      } catch (error) {
        if (options.signal.aborted) {
          report('cancelled');
          throw error;
        }
        report(errorOutcome(error));
        return errorResult(error);
      }
    },
  };
}

async function fetchTextAsync(url: string, signal: AbortSignal) {
  const response = await fetch(url, { signal });
  if (!response.ok) {
    const message = `Could not read ${url} (HTTP ${response.status}).`;
    throw response.status === 404 ? new NotFoundError(message) : new Error(message);
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

function parseMarkdown(markdown: string) {
  const frontmatter = /^---\n([\S\s]*?)\n---\n/.exec(markdown);
  const lines = markdown.slice(frontmatter?.[0].length ?? 0).split('\n');
  const headings: { level: number; text: string; line: number }[] = [];
  let inCodeBlock = false;
  lines.forEach((line, index) => {
    if (/^\s*(```|~~~)/.test(line)) {
      inCodeBlock = !inCodeBlock;
      return;
    }
    const heading = inCodeBlock ? null : /^(#{1,6})\s+(.+?)\s*#*$/.exec(line);
    if (heading) {
      headings.push({ level: heading[1].length, text: heading[2], line: index });
    }
  });
  return { frontmatter: frontmatter?.[1] ?? '', lines, headings };
}

function normalizeHeading(text: string) {
  return text.replaceAll('`', '').replace(/\s+/g, ' ').trim().toLowerCase();
}

function readSections(markdown: string, section: string, pagePath: string) {
  const { lines, headings } = parseMarkdown(markdown);
  const wanted = normalizeHeading(section);
  const sections = headings.flatMap((heading, index) => {
    if (normalizeHeading(heading.text) !== wanted) {
      return [];
    }
    const parentLines: string[] = [];
    let level = heading.level;
    for (const earlier of headings.slice(0, index).reverse()) {
      if (earlier.level < level) {
        parentLines.unshift(lines[earlier.line]);
        level = earlier.level;
      }
    }
    const end =
      headings.slice(index + 1).find(next => next.level <= heading.level)?.line ?? lines.length;
    return [[...parentLines, ...lines.slice(heading.line, end)].join('\n').trimEnd()];
  });
  if (sections.length === 0) {
    throw new NotFoundError(
      `No heading on ${pagePath} matches "${section}". Pass a heading that get_page_info returns for this page.`
    );
  }
  return sections.join('\n\n');
}

async function getPageMarkdownAsync(
  { path = window.location.pathname, section }: ToolInput,
  { signal }: { signal: AbortSignal }
) {
  const heading = section === undefined ? undefined : requireText(section, 'section');
  const markdown = await readPageMarkdownAsync(path, signal);
  return heading === undefined
    ? markdown
    : readSections(markdown, heading, toSiteUrl(path).pathname);
}

function parsePageInfo(markdown: string) {
  const { frontmatter, headings } = parseMarkdown(markdown);
  const details: Record<string, string> = {};
  for (const line of frontmatter.split('\n')) {
    const field = /^([A-Za-z]\w*):\s*(.*)$/.exec(line);
    if (field) {
      details[field[1]] = field[2].replace(/^(["'])(.*)\1$/, '$2');
    }
  }
  return { ...details, headings: headings.map(({ level, text }) => ({ level, text })) };
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
  const sections = sectionsOf(area as NavigationArea);
  const matches = sections.filter(node => section === undefined || sectionName(node) === section);
  if (!matches.length) {
    throw new NotFoundError(
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
  const version = getVersionFromPath(window.location.pathname) ?? 'latest';
  const params = new URLSearchParams({
    query: requireText(query, 'query'),
    hitsPerPage: String(limit),
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
    throw new NotFoundError(`No skill named "${name}". Available skills: ${available}.`);
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
      feedback: requireText(feedback, 'feedback'),
      url: toSiteUrl(path).pathname,
    }),
  });
  if (!response.ok) {
    throw new Error(`Feedback was not sent (HTTP ${response.status}).`);
  }
  const { errors } = (await response.json()) as { errors?: unknown[] };
  if (errors) {
    throw new Error(`Feedback was not sent: ${JSON.stringify(errors)}.`);
  }
  return 'Feedback sent to the Expo documentation team.';
}

const pathProperty: PropertySchema = {
  type: 'string',
  maxLength: 500,
  description: 'A docs.expo.dev URL or a path that starts with "/". Defaults to the current page.',
};

const toolDefinitions: WebMcpTool[] = [
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
      '/get-started/create-a-project/, or omit it to read the current page. With section, ' +
      'it returns only the parts under the headings that match, each with its parent headings.',
    inputSchema: {
      type: 'object',
      properties: {
        path: pathProperty,
        section: {
          type: 'string',
          maxLength: SECTION_MAX_LENGTH,
          description:
            'A heading that get_page_info returns, such as "Installation". The match ignores ' +
            'case and backticks.',
        },
      },
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
    annotations: { readOnlyHint: true, untrustedContentHint: true },
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
      'Sends specific, actionable feedback about a documentation page to the Expo documentation ' +
      'team, such as an error or misleading or outdated information, and returns a confirmation.',
    inputSchema: {
      type: 'object',
      properties: {
        feedback: {
          type: 'string',
          maxLength: FEEDBACK_MAX_LENGTH,
          description: 'A specific, actionable description of the problem, with its context.',
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

export const webMcpTools = toolDefinitions.map(withChecksAndReporting);
