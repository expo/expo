import { home, general, eas, learn, reference } from '../constants/navigation.js';
import { LATEST_VERSION } from '../constants/versions.js';
import { DOCS_BASE_URL, getMarkdownUrl } from './markdown-link-utils.ts';

const TRIM_SECTION_PAGE_THRESHOLD = 30;
const AREA_LABELS: Record<string, string> = {
  home: 'Home',
  general: 'Guides',
  eas: 'EAS',
  reference: 'Reference',
  learn: 'Learn',
};
const FETCH_INSTRUCTION =
  'When answering a related or follow-up question, fetch the relevant page below as Markdown (.md) instead of guessing; use llms.txt for the full map.';
const FETCH_INSTRUCTION_TRIMMED =
  'When answering a related or follow-up question, use llms.txt to find the relevant page as Markdown (.md) instead of guessing.';

type NavNode = {
  type: 'section' | 'group' | 'page';
  name?: string;
  href?: string;
  children?: NavNode[];
};

type Sibling = { name: string; href: string };

type ReferenceSection = { title: string; pages: Sibling[] };

type NavLocation = {
  area: string;
  versionKey?: string;
  trail: string[];
  siblings: Sibling[];
  sectionPageCount: number;
  isVersionIndex?: boolean;
  referenceSections?: ReferenceSection[];
};

type NavArea = {
  area: string;
  versionKey?: string;
  nodes: NavNode[];
};

export function normalizeNavKey(pathOrHref: string): string {
  const withLeadingSlash = pathOrHref.startsWith('/') ? pathOrHref : `/${pathOrHref}`;
  const withoutTrailingSlash = withLeadingSlash.replace(/\/+$/, '');
  return withoutTrailingSlash === '' ? '/' : withoutTrailingSlash;
}

function isInternalPage(node: NavNode): boolean {
  return node.type === 'page' && typeof node.href === 'string' && !node.href.startsWith('http');
}

function referenceVersionFromHref(href: string): string | undefined {
  return href.match(/^\/versions\/([^/]+)\//)?.[1];
}

function collectPages(node: NavNode): Sibling[] {
  const pages: Sibling[] = [];
  for (const child of node.children ?? []) {
    if (isInternalPage(child)) {
      pages.push({ name: child.name ?? '', href: child.href as string });
    } else if (child.type === 'section' || child.type === 'group') {
      pages.push(...collectPages(child));
    }
  }
  return pages;
}

function indexNodes(
  nodes: NavNode[],
  context: { area: string; versionKey?: string; trail: string[] },
  index: Map<string, NavLocation>
): void {
  for (const node of nodes) {
    if (node.type !== 'section' && node.type !== 'group') {
      continue;
    }

    const trail = node.name ? [...context.trail, node.name] : context.trail;

    const pageChildren = (node.children ?? []).filter(isInternalPage);
    const siblings: Sibling[] = pageChildren.map(page => ({
      name: page.name ?? '',
      href: page.href as string,
    }));

    for (const page of pageChildren) {
      const href = page.href as string;
      index.set(normalizeNavKey(href), {
        area: context.area,
        versionKey:
          context.area === 'reference' ? referenceVersionFromHref(href) : context.versionKey,
        trail,
        siblings,
        sectionPageCount: pageChildren.length,
      });
    }

    const subContainers = (node.children ?? []).filter(
      child => child.type === 'section' || child.type === 'group'
    );
    if (subContainers.length > 0) {
      indexNodes(subContainers, { ...context, trail }, index);
    }
  }
}

function registerVersionIndex(
  versionKey: string,
  nodes: NavNode[],
  index: Map<string, NavLocation>
): void {
  const referenceSections: ReferenceSection[] = [];
  for (const node of nodes) {
    if (node.type !== 'section' || !node.name) {
      continue;
    }
    const pages = collectPages(node);
    if (pages.length > 0) {
      referenceSections.push({ title: node.name, pages });
    }
  }
  if (referenceSections.length === 0) {
    return;
  }

  index.set(normalizeNavKey(`/versions/${versionKey}`), {
    area: 'reference',
    versionKey,
    trail: [],
    siblings: [],
    sectionPageCount: 0,
    isVersionIndex: true,
    referenceSections,
  });
}

export function buildNavIndexFrom(areas: NavArea[]): Map<string, NavLocation> {
  const index = new Map<string, NavLocation>();
  for (const { area, versionKey, nodes } of areas) {
    indexNodes(nodes, { area, versionKey, trail: [] }, index);
    if (area === 'reference' && versionKey) {
      registerVersionIndex(versionKey, nodes, index);
    }
  }
  return index;
}

let cachedIndex: Map<string, NavLocation> | null = null;

export function buildNavIndex(): Map<string, NavLocation> {
  cachedIndex ??= buildNavIndexFrom([
    { area: 'home', nodes: home as NavNode[] },
    { area: 'general', nodes: general as NavNode[] },
    { area: 'eas', nodes: eas as NavNode[] },
    { area: 'learn', nodes: learn as NavNode[] },
    ...Object.entries(reference as Record<string, NavNode[]>).map(([versionKey, nodes]) => ({
      area: 'reference',
      versionKey,
      nodes,
    })),
  ]);
  return cachedIndex;
}

function areaLabel(location: NavLocation): string {
  if (location.area === 'reference') {
    const version = location.versionKey === 'latest' ? LATEST_VERSION : location.versionKey;
    return version ? `Reference (${version})` : 'Reference';
  }
  return AREA_LABELS[location.area] ?? location.area;
}

function isTrimmedSection(location: NavLocation): boolean {
  return (
    location.area === 'reference' &&
    !location.isVersionIndex &&
    location.sectionPageCount > TRIM_SECTION_PAGE_THRESHOLD
  );
}

export function buildDocsNavigation(
  pathname: string,
  index: Map<string, NavLocation> = buildNavIndex()
): string | null {
  const key = normalizeNavKey(pathname);
  const location = index.get(key);
  if (!location) {
    return null;
  }

  const breadcrumb = [areaLabel(location), ...location.trail].join(' > ');
  const lines = ['<AgentInstructions>'];

  if (location.isVersionIndex && location.referenceSections) {
    lines.push(FETCH_INSTRUCTION, '', `You are here: ${breadcrumb}`);
    for (const section of location.referenceSections) {
      lines.push(`### ${section.title}`);
      for (const page of section.pages) {
        lines.push(`- [${page.name}](${getMarkdownUrl(page.href)})`);
      }
    }
  } else if (isTrimmedSection(location)) {
    lines.push(
      FETCH_INSTRUCTION_TRIMMED,
      '',
      `You are here: ${breadcrumb} (${location.sectionPageCount} pages in this section)`
    );
  } else {
    lines.push(FETCH_INSTRUCTION, '', `You are here: ${breadcrumb}`, 'Pages in this section:');
    for (const sibling of location.siblings) {
      const isCurrent = normalizeNavKey(sibling.href) === key;
      lines.push(
        `- [${sibling.name}](${getMarkdownUrl(sibling.href)})${isCurrent ? ' (this page)' : ''}`
      );
    }
  }

  lines.push(`Full documentation tree: [llms.txt](${DOCS_BASE_URL}/llms.txt)`);
  lines.push('</AgentInstructions>');

  return `${lines.join('\n')}\n`;
}
