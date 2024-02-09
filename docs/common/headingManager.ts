import GithubSlugger from 'github-slugger';
import * as React from 'react';

import * as Utilities from './utilities';
import { ElementType, PageMetadata, RemarkHeading } from '../types/common';

/**
 * These types directly correspond to MDAST node types
 */
export enum HeadingType {
  Text = 'text',
  InlineCode = 'inlineCode',
  CodeFilePath = 'codeFilePath',
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
 * This class uses Slugger instance to generate and manage unique slugs
 */
export class HeadingManager {
  private slugger: GithubSlugger;
  private _headings: Heading[];
  private readonly _meta: Metadata;
  private readonly _maxNestingLevel: number;

  public get headings() {
    return this._headings;
  }

  public get maxNestingLevel() {
    return this._maxNestingLevel;
  }

  public get metadata() {
    return this._meta;
  }

  /**
   * @param slugger A _GithubSlugger_ instance
   * @param meta Document metadata gathered by `headingsMdPlugin`.
   */
  constructor(slugger: GithubSlugger, meta: Metadata) {
    this.slugger = slugger;
    this._meta = meta;
    this._headings = [];

    const maxHeadingDepth = meta.maxHeadingDepth ?? DEFAULT_NESTING_LIMIT;
    this._maxNestingLevel = maxHeadingDepth + BASE_HEADING_LEVEL;
  }

  /**
   * Creates heading object instance and stores it
   * @param {string | Object} title Heading display title or `<code/>` element
   * @param {number|undefined} nestingLevel Override metadata heading nesting level.
   * @param {*} additionalProps Additional properties passed to heading component
   * @returns {Object} Newly created heading instance
   */
  addHeading(
    title: React.ReactNode,
    nestingLevel?: number,
    additionalProps?: AdditionalProps,
    id?: string
  ): Heading {
    // NOTE (barthap): workaround for complex titles containing both normal text and inline code
    // changing this needs also change in `headingsMdPlugin.js` to make metadata loading correctly
    title = Array.isArray(title) ? title.map(Utilities.toString).join(' ') : title;

    const { hideInSidebar, sidebarTitle, sidebarDepth, sidebarType, tags } = additionalProps ?? {};
    const levelOverride = sidebarDepth != null ? BASE_HEADING_LEVEL + sidebarDepth : undefined;

    const slug = id ?? Utilities.generateSlug(this.slugger, title);
    const realTitle = Utilities.toString(title);
    const meta = this.findMetaForTitle(realTitle);
    const level = levelOverride ?? nestingLevel ?? meta?.depth ?? BASE_HEADING_LEVEL;
    const type = sidebarType || (this.isCode(title) ? HeadingType.InlineCode : HeadingType.Text);

    const heading = {
      title: sidebarTitle ?? realTitle,
      slug,
      level,
      type,
      tags,
      ref: React.createRef(),
      metadata: meta,
    };

    // levels out of range are unlisted
    if (!hideInSidebar && level >= BASE_HEADING_LEVEL && level <= this.maxNestingLevel) {
      this._headings.push(heading);
    }

    return heading;
  }

  /**
   * Finds MDX-plugin metadata for specified title. Once found, it's marked as processed
   * and will not be returned again.
   * @param {string} realTitle Title to find metadata for
   */
  private findMetaForTitle(realTitle: string) {
    const entry = this._meta.headings.find(
      heading => heading.title === realTitle && !heading._processed
    );
    if (!entry) {
      return;
    }
    entry._processed = true;
    return entry;
  }

  /**
   * Checks if header title is an inline code block.
   * @param {any} title Heading object to check
   * @returns {boolean} true if header is a code block
   */
  private isCode(title: any): boolean {
    if (!title.props) {
      return false;
    }
    const { name, originalType, mdxType } = title.props;
    return [name, originalType, mdxType].some(it => it === HeadingType.InlineCode);
  }
}
