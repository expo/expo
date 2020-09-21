import * as React from 'react';

import * as Utilities from '~/common/utilities';

/**
 * These types directly correspond to MDAST node types
 */
export const HeadingType = {
  Text: 'text',
  InlineCode: 'inlineCode',
};

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
 * Can be overriden in `.md` pages by setting
 * `maxHeadingDepth` attribute
 */
const DEFAULT_NESTING_LIMIT = 1;

/**
 * Manages heading entries. Each entry corresponds to one markdown heading with specified level (#, ##, ### etc)
 *
 * Each entry consists of:
 * - title
 * - slug
 * - level (number of hashes in markdown)
 * - ref - React reference to heading component
 * - type - Is heading a normal text or inline code
 *
 * This class uses Slugger instance to generate and manage unique slugs
 */
export class HeadingManager {
  /**
   * @param {Object} slugger A _GithubSlugger_ instance
   * @param {{headings: Object[]}} meta Document metadata gathered by `headingsMdPlugin`.
   */
  constructor(slugger, meta) {
    this.slugger = slugger;
    this.meta = { headings: meta.headings || [], ...meta };
    this.headings = [];

    const maxHeadingDepth = meta.maxHeadingDepth ?? DEFAULT_NESTING_LIMIT;
    this.maxNestingLevel = maxHeadingDepth + BASE_HEADING_LEVEL;
  }

  /**
   * Creates heading object instance and stores it
   * @param {string | Object} title Heading display title or `<code/>` element
   * @param {number|undefined} nestingLevel Override metadata heading nesting level.
   * @param {*} additionalProps Additional properties passed to heading component
   * @returns {Object} Newly created heading instance
   */
  addHeading(title, nestingLevel, additionalProps) {
    // NOTE (barthap): workaround for complex titles containing both normal text and inline code
    // changing this needs also change in `headingsMdPlugin.js` to make metadata loading correctly
    title = Array.isArray(title) ? title.map(Utilities.toString).join(' ') : title;

    const { hideInSidebar, sidebarTitle, sidebarDepth, sidebarType } = additionalProps ?? {};
    const levelOverride = sidebarDepth != null ? BASE_HEADING_LEVEL + sidebarDepth : undefined;

    const slug = Utilities.generateSlug(this.slugger, title);
    const realTitle = Utilities.toString(title);
    const meta = this._findMetaForTitle(realTitle);
    const level = levelOverride ?? nestingLevel ?? meta?.level ?? BASE_HEADING_LEVEL;
    const type = sidebarType || (this._isCode(title) ? HeadingType.InlineCode : HeadingType.Text);

    const heading = {
      title: sidebarTitle ?? realTitle,
      slug,
      level,
      type,
      ref: React.createRef(),
      metadata: meta,
    };

    // levels out of range are unlisted
    if (!hideInSidebar && level >= BASE_HEADING_LEVEL && level <= this.maxNestingLevel) {
      this.headings.push(heading);
    }

    return heading;
  }

  /**
   * Finds MDX-plugin metadata for specified title. Once found, it's marked as processed
   * and will not be returned again.
   * @param {string} realTitle Title to find metadata for
   */
  _findMetaForTitle(realTitle) {
    const entry = this.meta.headings.find(
      heading => heading.title === realTitle && !heading.processed
    );
    if (!entry) {
      return;
    }
    entry.processed = true;
    return entry;
  }

  /**
   * Checks if header title is an inline code block.
   * @param {any} title Heading object to check
   * @returns {boolean} true if header is a code block
   */
  _isCode(title) {
    if (!title.props) {
      return false;
    }
    const { name, originalType, mdxType } = title.props;
    return [name, originalType, mdxType].some(it => it === HeadingType.InlineCode);
  }
}
