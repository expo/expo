import * as React from 'react';

import * as Utilities from '~/common/utilities';

/**
 * Manages heading entries. Each entry corresponds to one markdown heading with specified level (#, ##, ### etc)
 *
 * Each entry consists of:
 * - title
 * - slug
 * - level (number of hashes in markdown)
 * - ref - React reference to heading component
 *
 * This class uses Slugger instance to generate and manage unique slugs
 */
export class HeadingManager {
  /**
   * @param {Object} slugger A _GithubSlugger_ instance
   * @param {{headings: []}} meta Document metadata gathered by `headingsMdPlugin`.
   */
  constructor(slugger, meta) {
    this.slugger = slugger;
    this.meta = { headings: meta.headings || [], ...meta };
    this.headings = [];
  }

  /**
   * Creates heading object instance and stores it
   * @param {string | Object} title Heading display title or `<code/>` element
   * @param {number|undefined} nestingLevel Override metadata heading nesting level.
   * @returns {Object} Newly created heading instance
   */
  addHeading(title, nestingLevel) {
    const slug = Utilities.generateSlug(this.slugger, title);
    const realTitle = Utilities.toString(title);
    const meta = this._findMetaForTitle(realTitle);
    const level = nestingLevel ?? meta?.level ?? 0;

    const heading = {
      title: realTitle,
      slug,
      level,
      ref: React.createRef(),
      type: this._isCode(title) ? 'inlineCode' : 'text',
      metadata: meta,
    };
    this.headings.push(heading);
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
      return undefined;
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
    if (!title.props) return false;
    const { name, originalType, mdxType } = title.props;
    return [name, originalType, mdxType].some(it => it === 'inlineCode');
  }
}
