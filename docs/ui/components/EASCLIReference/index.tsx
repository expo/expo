import type { ReactNode } from 'react';

import { Terminal } from '~/ui/components/Snippet';
import { A, BOLD, CODE, H3, H4, LI, P, UL } from '~/ui/components/Text';

import easCliData from './data/eas-cli-commands.json';

type CommandData = {
  command: string;
  description: string;
  usage: string;
  group: string;
  seeCode: string;
};

type CommandSections = {
  usage?: string;
  arguments?: string;
  flags?: string;
  examples?: string;
  aliases?: string;
};

type EasCliReferenceData = {
  source: {
    url: string;
    fetchedAt: string;
    cliVersion: string | null;
  };
  totalCommands: number;
  commands: CommandData[];
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

function parseUsageSections(usage: string): CommandSections {
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

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^\da-z]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function formatDescription(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return 'No description available.';
  }
  const formatted = `${trimmed[0].toUpperCase()}${trimmed.slice(1)}`;
  return formatted.endsWith('.') ? formatted : `${formatted}.`;
}

function formatDescriptionForInlineLink(value: string) {
  const formatted = formatDescription(value);
  return formatted.endsWith('.') ? formatted.slice(0, -1) : formatted;
}

const FILE_TOKEN_REGEX = /(\.[\dA-Za-z][\w.-]*|[\dA-Za-z][\w.-]*\.[\dA-Za-z][\w.-]*)/g;
const URL_REGEX = /https?:\/\/[^\s)]+/g;
const INLINE_TOKEN_REGEX = /(--[\d[\]a-z-]+(?:=<[^\s>]+>|=[^\s),.]+)?|\bstderr\b)/gi;

function renderWithBoldFilenames(text: string): ReactNode {
  if (!text) {
    return text;
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

function toNodeArray(node: ReactNode): ReactNode[] {
  if (Array.isArray(node)) {
    return node;
  }
  return [node];
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
      const rendered = renderWithBoldFilenames(text.slice(lastIndex, start));
      nodes.push(...toNodeArray(rendered));
    }

    nodes.push(
      <CODE key={`token-${start}-${match[0]}`} className="text-3xs">
        {match[0]}
      </CODE>
    );
    lastIndex = end;
  }

  if (lastIndex < text.length) {
    const rendered = renderWithBoldFilenames(text.slice(lastIndex));
    nodes.push(...toNodeArray(rendered));
  }

  return nodes;
}

type UrlPart = {
  value: string;
  suffix: string;
};

type UrlSplitPart = {
  type: 'text' | 'url';
  value: string;
  suffix?: string;
};

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

function renderInlineContent(text: string): ReactNode[] {
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

function toTerminalLines(value: string) {
  return value.split('\n').map(line => line.replace(/^\s+/, ''));
}

function countNonEmptyLines(value: string) {
  return value.split('\n').filter(line => line.trim().length > 0).length;
}

type ListEntry = {
  name: string;
  description: string;
};

function parseListEntries(value: string): ListEntry[] {
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

function formatSentence(text: string) {
  const trimmed = text.trim();
  if (!trimmed) {
    return '';
  }
  const formatted = `${trimmed[0].toUpperCase()}${trimmed.slice(1)}`;
  return formatted.endsWith('.') ? formatted : `${formatted}.`;
}

type SubItemGroup = {
  lead: string;
  items: ListEntry[];
};

function parseSubItems(description: string): SubItemGroup | null {
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

const ListSection = ({ entries }: { entries: ListEntry[] }) => {
  if (entries.length === 0) {
    return null;
  }

  return (
    <UL className="mb-4">
      {entries.map(entry => (
        <LI key={entry.name}>
          <CODE className="text-3xs">{entry.name}</CODE>
          {entry.description &&
            (() => {
              const parsed = parseSubItems(entry.description);
              if (parsed) {
                const lead = parsed.lead ? formatSentence(parsed.lead) : '';
                return (
                  <>
                    {lead ? <span> {renderInlineContent(lead)}</span> : null}
                    <UL className="mt-2">
                      {parsed.items.map(item => (
                        <LI key={`${entry.name}-${item.name}`}>
                          <CODE className="text-3xs">{item.name}</CODE>
                          {item.description ? (
                            <span> {renderInlineContent(formatSentence(item.description))}</span>
                          ) : null}
                        </LI>
                      ))}
                    </UL>
                  </>
                );
              }

              return <span> {renderInlineContent(formatSentence(entry.description))}</span>;
            })()}
        </LI>
      ))}
    </UL>
  );
};

const CommandSection = ({ command }: { command: CommandData }) => {
  const sections = parseUsageSections(command.usage);
  const description = command.seeCode
    ? formatDescriptionForInlineLink(command.description ?? '')
    : formatDescription(command.description ?? '');
  const slug = slugify(command.command);
  const argumentsList = sections.arguments ? parseListEntries(sections.arguments) : [];
  const flagsList = sections.flags ? parseListEntries(sections.flags) : [];

  return (
    <section className="border-b border-secondary pb-8 last:border-0 last:pb-0">
      <H3 id={slug} className="translate-y-[2px] self-center">
        {command.command}
      </H3>
      <P className="mb-5 mt-2">
        {renderInlineContent(description)}
        {command.seeCode && (
          <>
            {' '}
            (
            <A href={command.seeCode} openInNewTab>
              see code
            </A>
            ).
          </>
        )}
      </P>

      {sections.usage && (
        <div className="mb-6">
          <H4 className="mb-2 mt-0 translate-y-[2px] self-center">Usage</H4>
          <Terminal cmd={toTerminalLines(sections.usage)} />
        </div>
      )}

      {argumentsList.length > 0 && (
        <div className="mb-6">
          <H4 className="mb-2 mt-0 translate-y-[2px] self-center">
            {argumentsList.length === 1 ? 'Argument' : 'Arguments'}
          </H4>
          <ListSection entries={argumentsList} />
        </div>
      )}

      {flagsList.length > 0 && (
        <div className="mb-6">
          <H4 className="mb-2 mt-0 translate-y-[2px] self-center">
            {flagsList.length === 1 ? 'Flag' : 'Flags'}
          </H4>
          <ListSection entries={flagsList} />
        </div>
      )}

      {sections.aliases && (
        <div className="mb-6">
          <H4 className="mb-2 mt-0 translate-y-[2px] self-center">
            {countNonEmptyLines(sections.aliases) === 1 ? 'Alias' : 'Aliases'}
          </H4>
          <Terminal cmd={toTerminalLines(sections.aliases)} />
        </div>
      )}

      {sections.examples && (
        <div className="mb-4">
          <H4 className="mb-2 mt-0 translate-y-[2px] self-center">Examples</H4>
          <Terminal cmd={toTerminalLines(sections.examples)} />
        </div>
      )}
    </section>
  );
};

export const EASCLIReference = () => {
  const data = easCliData as EasCliReferenceData;

  return (
    <div className="space-y-8">
      {data.commands.map(command => (
        <CommandSection key={command.command} command={command} />
      ))}
    </div>
  );
};
