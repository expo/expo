import { home, general, eas, learn, reference } from '../constants/navigation.js';
import { LATEST_VERSION } from '../constants/versions.js';
import { DOCS_BASE_URL, getMarkdownUrl } from './markdown-link-utils.ts';

const TRIM_SECTION_PAGE_THRESHOLD = 30;
const SDK_INDEX_SECTION_NAME = 'Expo SDK';
const AREA_LABELS: Record<string, string> = {
  home: 'Home',
  general: 'Guides',
  eas: 'EAS',
  reference: 'Reference',
  learn: 'Learn',
};

type NavNode = {
  type: 'section' | 'group' | 'page';
  name?: string;
  href?: string;
  children?: NavNode[];
};

type Sibling = { name: string; href: string };

type NavLocation = {
  area: string;
  /** Present only for `reference` pages; the version segment such as `latest` or `v55.0.0`. */
  versionKey?: string;
  /** Breadcrumb segments after the area label, e.g. `['EAS Workflows']`. */
  trail: string[];
  /** Pages in the immediate section/group, in sidebar order. */
  siblings: Sibling[];
  /** Number of pages in the immediate section/group (drives the SDK trim). */
  sectionPageCount: number;
  isSdkIndex?: boolean;
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
      index.set(normalizeNavKey(page.href as string), {
        area: context.area,
        versionKey: context.versionKey,
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

function registerSdkIndex(
  versionKey: string,
  nodes: NavNode[],
  index: Map<string, NavLocation>
): void {
  const sdkSection = nodes.find(
    node => node.type === 'section' && node.name === SDK_INDEX_SECTION_NAME
  );
  const sdkPages = (sdkSection?.children ?? []).filter(isInternalPage);
  if (sdkPages.length === 0) {
    return;
  }

  index.set(normalizeNavKey(`/versions/${versionKey}`), {
    area: 'reference',
    versionKey,
    trail: [SDK_INDEX_SECTION_NAME],
    siblings: sdkPages.map(page => ({ name: page.name ?? '', href: page.href as string })),
    sectionPageCount: sdkPages.length,
    isSdkIndex: true,
  });
}

export function buildNavIndexFrom(areas: NavArea[]): Map<string, NavLocation> {
  const index = new Map<string, NavLocation>();
  for (const { area, versionKey, nodes } of areas) {
    indexNodes(nodes, { area, versionKey, trail: [] }, index);
    if (area === 'reference' && versionKey) {
      registerSdkIndex(versionKey, nodes, index);
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
    !location.isSdkIndex &&
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
  const lines = ['<DocsNavigation>'];

  if (isTrimmedSection(location)) {
    lines.push(`You are here: ${breadcrumb} (${location.sectionPageCount} pages in this section)`);
  } else {
    lines.push(`You are here: ${breadcrumb}`);
    lines.push('Pages in this section:');
    for (const sibling of location.siblings) {
      const isCurrent = normalizeNavKey(sibling.href) === key;
      lines.push(
        `- [${sibling.name}](${getMarkdownUrl(sibling.href)})${isCurrent ? ' (this page)' : ''}`
      );
    }
  }

  lines.push(`Full documentation tree: [llms.txt](${DOCS_BASE_URL}/llms.txt)`);
  lines.push('</DocsNavigation>');

  return `${lines.join('\n')}\n`;
}
