import type { ReactNode } from 'react';

import { A, BOLD, CODE } from '~/ui/components/Text';

type UrlPart = {
  value: string;
  suffix: string;
};

type UrlSplitPart = {
  type: 'text' | 'url';
  value: string;
  suffix?: string;
};

export type CommandSections = {
  usage?: string;
  arguments?: string;
  flags?: string;
  examples?: string;
  aliases?: string;
};

export type ListEntry = {
  name: string;
  description: string;
};

export type SubItemGroup = {
  lead: string;
  items: ListEntry[];
};

const SECTION_HEADERS: Record<string, keyof CommandSections> = {
  USAGE: 'usage',
  ARGUMENTS: 'arguments',
  ARGUMENT: 'arguments',
  FLAGS: 'flags',
  'GLOBAL FLAGS': 'flags',
  EXAMPLES: 'examples',
  ALIASES: 'aliases',
};

const SKIP_HEADERS = new Set(['DESCRIPTION']);

const FILE_TOKEN_REGEX = /(\.[\dA-Za-z][\w.-]*|[\dA-Za-z][\w.-]*\.[\dA-Za-z][\w.-]*)/g;
const URL_REGEX = /https?:\/\/[^\s)]+/g;
const INLINE_TOKEN_REGEX = /(--[\d[\]a-z-]+(?:=<[^\s>]+>|=[^\s),.]+)?|\bstderr\b)/gi;

export function parseUsageSections(usage: string): CommandSections {
  if (!usage) {
    return {};
  }

  const lines = usage.split('\n');
  const sections: Record<keyof CommandSections, string[]> = {
    usage: [],
    arguments: [],
    flags: [],
    examples: [],
    aliases: [],
  };

  let current: keyof CommandSections | null = null;
  let sawHeader = false;

  for (const rawLine of lines) {
    const line = rawLine.replace(/\s+$/, '');
    const trimmed = line.trim();

    if (!trimmed) {
      if (current) {
        sections[current].push('');
      }
      continue;
    }

    const sectionKey = SECTION_HEADERS[trimmed];
    if (sectionKey) {
      current = sectionKey;
      sawHeader = true;
      continue;
    }

    if (SKIP_HEADERS.has(trimmed)) {
      current = null;
      sawHeader = true;
      continue;
    }

    if (current) {
      sections[current].push(line);
      continue;
    }

    if (!sawHeader) {
      sections.usage.push(line);
    }
  }

  const normalize = (value: string[]) => value.join('\n').replace(/^\n+|\n+$/g, '');

  return {
    usage: normalize(sections.usage),
    arguments: normalize(sections.arguments),
    flags: normalize(sections.flags),
    examples: normalize(sections.examples),
    aliases: normalize(sections.aliases),
  };
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^\da-z]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function formatSentence(text: string) {
  const trimmed = text.trim();
  if (!trimmed) {
    return '';
  }
  const formatted = `${trimmed[0].toUpperCase()}${trimmed.slice(1)}`;
  return formatted.endsWith('.') ? formatted : `${formatted}.`;
}

export function formatDescription(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return 'No description available.';
  }
  return formatSentence(trimmed);
}

function renderWithBoldFilenames(text: string): ReactNode[] {
  if (!text) {
    return [text];
  }

  const nodes: ReactNode[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(FILE_TOKEN_REGEX)) {
    if (match.index === undefined) {
      continue;
    }

    const value = match[1];
    const start = match.index;
    const end = start + value.length;
    const before = text[start - 1] ?? '';
    const after = text[end] ?? '';
    const recentWindow = text.slice(Math.max(0, start - 12), start);
    const isUrl = recentWindow.includes('://');
    const isBoundary =
      (!before || !/[\dA-Za-z]/.test(before)) && (!after || !/[\dA-Za-z]/.test(after));
    const shouldBold = !isUrl && isBoundary;

    if (start > lastIndex) {
      nodes.push(text.slice(lastIndex, start));
    }

    nodes.push(shouldBold ? <BOLD key={`${start}-${value}`}>{value}</BOLD> : value);
    lastIndex = end;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}

function renderTextWithTokens(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(INLINE_TOKEN_REGEX)) {
    if (match.index === undefined) {
      continue;
    }
    const start = match.index;
    const end = start + match[0].length;

    if (start > lastIndex) {
      nodes.push(...renderWithBoldFilenames(text.slice(lastIndex, start)));
    }

    nodes.push(
      <CODE key={`token-${start}-${match[0]}`} className="text-3xs">
        {match[0]}
      </CODE>
    );
    lastIndex = end;
  }

  if (lastIndex < text.length) {
    nodes.push(...renderWithBoldFilenames(text.slice(lastIndex)));
  }

  return nodes;
}

function splitUrls(text: string): UrlSplitPart[] {
  const parts: UrlSplitPart[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(URL_REGEX)) {
    if (match.index === undefined) {
      continue;
    }
    const start = match.index;
    const end = start + match[0].length;

    if (start > lastIndex) {
      parts.push({ type: 'text', value: text.slice(lastIndex, start) });
    }

    const { value, suffix } = trimUrlSuffix(match[0]);
    parts.push({ type: 'url', value, suffix });
    lastIndex = end;
  }

  if (lastIndex < text.length) {
    parts.push({ type: 'text', value: text.slice(lastIndex) });
  }

  return parts;
}

function trimUrlSuffix(url: string): UrlPart {
  let value = url;
  let suffix = '';
  while (/[),.:;]$/.test(value)) {
    suffix = value.slice(-1) + suffix;
    value = value.slice(0, -1);
  }
  return { value, suffix };
}

function normalizeBrokenUrls(text: string) {
  let normalized = text;
  const regex = /(https?:\/\/\S+)-\s+(\S+)/g;
  while (true) {
    regex.lastIndex = 0;
    if (!regex.test(normalized)) {
      break;
    }
    normalized = normalized.replace(regex, '$1-$2');
  }
  return normalized;
}

function normalizeAbbreviations(text: string) {
  return text.replace(/\be\.g\.,?/gi, 'for example,');
}

export function renderInlineContent(text: string): ReactNode[] {
  if (!text) {
    return [];
  }

  const parts = text.split('`');
  const nodes: ReactNode[] = [];

  parts.forEach((part, index) => {
    if (index % 2 === 1) {
      nodes.push(
        <CODE key={`code-${index}`} className="text-3xs">
          {part}
        </CODE>
      );
      return;
    }

    const urlParts = splitUrls(normalizeBrokenUrls(normalizeAbbreviations(part)));
    urlParts.forEach((urlPart, urlIndex) => {
      if (urlPart.type === 'url') {
        nodes.push(
          <A key={`url-${index}-${urlIndex}`} href={urlPart.value} openInNewTab>
            {urlPart.value}
          </A>
        );
        if (urlPart.suffix) {
          nodes.push(urlPart.suffix);
        }
        return;
      }

      nodes.push(...renderTextWithTokens(urlPart.value));
    });
  });

  return nodes;
}

export function toTerminalLines(value: string) {
  return value.split('\n').map(line => line.replace(/^\s+/, ''));
}

export function countNonEmptyLines(value: string) {
  return value.split('\n').filter(line => line.trim().length > 0).length;
}

export function parseListEntries(value: string): ListEntry[] {
  const entries: ListEntry[] = [];
  const lines = value
    .split('\n')
    .map(line => line.trimEnd())
    .filter(line => line.trim().length > 0);

  let current: ListEntry | null = null;

  for (const line of lines) {
    const trimmed = line.trimStart();
    const indent = line.length - trimmed.length;
    const parts = trimmed.split(/\s{2,}/);
    const isFlagStart = /^-{1,2}\S/.test(trimmed);
    const isArgumentStart = /^[A-Z][\dA-Z_-]*\b/.test(trimmed);
    const isNewEntry = parts.length > 1 || (indent <= 2 && (isFlagStart || isArgumentStart));

    if (isNewEntry) {
      if (current) {
        entries.push(current);
      }
      if (parts.length > 1) {
        current = {
          name: parts[0].trim(),
          description: parts.slice(1).join(' ').trim(),
        };
      } else {
        current = { name: trimmed, description: '' };
      }
      continue;
    }

    if (current) {
      current.description = `${current.description} ${trimmed}`.trim();
    } else {
      current = { name: trimmed, description: '' };
    }
  }

  if (current) {
    entries.push(current);
  }

  return entries;
}

export function parseSubItems(description: string): SubItemGroup | null {
  const regex = /([\w-]+)\s-\s/g;
  const matches = Array.from(description.matchAll(regex));
  if (matches.length < 2) {
    return null;
  }

  const lead = description.slice(0, matches[0].index ?? 0).trim();
  const items = matches.map((match, index) => {
    const start = (match.index ?? 0) + match[0].length;
    const end =
      index + 1 < matches.length
        ? (matches[index + 1].index ?? description.length)
        : description.length;
    const itemDescription = description.slice(start, end).trim();
    return { name: match[1], description: itemDescription };
  });

  return { lead, items };
}
