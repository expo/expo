import GithubSlugger from 'github-slugger';
import * as React from 'react';

import * as Utilities from './utilities';
import { ElementType, PageMetadata, RemarkHeading } from '../types/common';

/**
 * These types directly correspond to MDAST node types
 */
export enum HeadingType {
  TEXT = 'text',
  INLINE_CODE = 'inlineCode',
  CODE_FILE_PATH = 'codeFilePath',
}

/**
 * Minimum heading level to display in sidebar.
 * Example: When set to 2, the `H1` headers are unlisted,
 * `H2`s are root level, and `H3`, `H4`... are nested.
 *
 * NOTE: Changing this needs additional adjustments in `translate-markdown.js`!
 */
export const BASE_HEADING_LEVEL = 2;

/**
 * How deeply nested headings to display
 * 0 - means only root headings
 *
 * Can be overridden in `.md` pages by setting
 * `maxHeadingDepth` attribute
 */
const DEFAULT_NESTING_LIMIT = 1;

/**
 * Those properties can be customized
 * from markdown pages using heading components
 * from `plugins/Headings.tsx`
 */
export type AdditionalProps = {
  hideInSidebar?: boolean;
  sidebarTitle?: string;
  sidebarDepth?: number;
  sidebarType?: HeadingType;
  tags?: string[];
  className?: string;
  iconSize?: 'sm' | 'xs';
};

type Metadata = Partial<PageMetadata> & { headings: (RemarkHeading & { _processed?: boolean })[] };

/**
 * Single heading entry
 */
export type Heading = {
  title: string;
  slug: string;
  level: number;
  type: HeadingType;
  ref: React.RefObject<any>;
  tags?: string[];
  metadata?: ElementType<Metadata['headings']>;
};

/**
 * Manages heading entries. Each entry corresponds to one markdown heading with specified level (#, ##, ### etc)
 *
 * Uses a Slugger instance to generate and manage unique slugs
 */
export type HeadingManager = {
  addHeading: (
    title: React.ReactNode,
    nestingLevel?: number,
    additionalProps?: AdditionalProps,
    id?: string
  ) => Heading;
  headings: Heading[];
  maxNestingLevel: number;
  metadata: Metadata;
  findMetaForTitle?: (realTitle: string) => ElementType<Metadata['headings']> | undefined;
};

type FindMetaForTitle = (realTitle: string) => ElementType<Metadata['headings']> | undefined;

export function createHeadingManager(slugger: GithubSlugger, meta: Metadata): HeadingManager {
  const headings: Heading[] = [];
  const metadata = meta;

  const maxHeadingDepth =
    (metadata.maxHeadingDepth ?? DEFAULT_NESTING_LIMIT) + (metadata.packageName ? 2 : 0);
  const maxNestingLevel = maxHeadingDepth + BASE_HEADING_LEVEL;

  const findMetaForTitle: FindMetaForTitle = realTitle => {
    const entry = metadata.headings.find(
      heading => heading.title === realTitle && !heading._processed
    );
    if (!entry) {
      return;
    }
    entry._processed = true;
    return entry;
  };

  const isCode = (title: any): boolean => {
    if (!title?.props) {
      return false;
    }
    const { name, originalType, mdxType } = title.props;
    return [name, originalType, mdxType].includes(HeadingType.INLINE_CODE);
  };

  const addHeading = (
    title: React.ReactNode,
    nestingLevel?: number,
    additionalProps?: AdditionalProps,
    id?: string
  ): Heading => {
    // NOTE (barthap): workaround for complex titles containing both normal text and inline code
    // changing this needs also change in `headingsMdPlugin.js` to make metadata loading correctly
    title = Array.isArray(title) ? title.map(Utilities.toString).join(' ') : title;

    const { hideInSidebar, sidebarTitle, sidebarDepth, sidebarType, tags } = additionalProps ?? {};
    const levelOverride = sidebarDepth != null ? BASE_HEADING_LEVEL + sidebarDepth : undefined;

    const slug = id ?? Utilities.generateSlug(slugger, title);
    const realTitle = Utilities.toString(title);
    const metaEntry = findMetaForTitle(realTitle);
    const level = levelOverride ?? nestingLevel ?? metaEntry?.depth ?? BASE_HEADING_LEVEL;
    const type = sidebarType ?? (isCode(title) ? HeadingType.INLINE_CODE : HeadingType.TEXT);

    const heading = {
      title: sidebarTitle ?? realTitle,
      slug,
      level,
      type,
      tags,
      ref: React.createRef(),
      metadata: metaEntry,
    };

    if (!hideInSidebar && level >= BASE_HEADING_LEVEL && level <= maxNestingLevel) {
      headings.push(heading);
    }

    return heading;
  };

  return {
    addHeading,
    headings,
    maxNestingLevel,
    metadata,
    findMetaForTitle,
  };
}
