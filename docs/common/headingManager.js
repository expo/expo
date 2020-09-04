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
   *
   * @param {GithubSlugger} slugger a _GithubSlugger_ instance
   * @param {Array<{ level: number, title: string}>} metaHeadings heading metadata gathered by `headingsMdPlugin`.
   */
  constructor(slugger, metaHeadings) {
    this.slugger = slugger;
    this.headings = [];

    if (metaHeadings) {
      this.headings.push(...metaHeadings.map(item => ({ ...item, slug: null, ref: null })));
    }
  }

  /**
   * Creates a slug for title
   * If title exists in heading entries, adds the slug for that entry.
   * @param {string} title Title to generate slug from
   * @returns generated unique slug
   */
  createSlugForTitle(title) {
    const slug = Utilities.generateSlug(this.slugger, title);

    const realTitle = Utilities.toString(title);
    const entry = this.headings.find(
      heading => heading.title === realTitle && heading.slug == null
    );
    if (entry != null) {
      entry.slug = slug;
    }

    return slug;
  }

  forceCreateSlugAndTitle(title, level) {
    const realTitle = Utilities.toString(title);
    const slug = Utilities.generateSlug(this.slugger, title);
    const newElem = {
      title: realTitle,
      level,
      ref: null,
      slug,
      type: this._isCode(title) ? 'inlineCode' : 'text',
    };

    this.headings.push(newElem);

    return slug;
  }

  /**
   * Generates React ref for specified slug if it exists in heading entries
   * @param {string} slug slug to generate ref for
   * @returns reference object if exists in heading entries, undefined otherwise
   */
  getRefForSlug(slug) {
    const entry = this.headings.find(heading => heading.slug === slug);
    if (entry != null) {
      const ref = React.createRef();
      entry.ref = ref;
      return ref;
    }
    return undefined;
  }

  _isCode(title) {
    if (!title.props) return false;
    const { name, originalType, mdxType } = title.props;
    return name === 'inlineCode' || originalType === 'inlineCode' || mdxType === 'inlineCode';
  }
}
