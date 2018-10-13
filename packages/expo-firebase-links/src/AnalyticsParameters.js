/**
 * @flow
 * AnalyticsParameters representation wrapper
 */
import type DynamicLink from './DynamicLink';
import type { NativeAnalyticsParameters } from './types';

export default class AnalyticsParameters {
  _campaign: string | void;

  _content: string | void;

  _link: DynamicLink;

  _medium: string | void;

  _source: string | void;

  _term: string | void;

  constructor(link: DynamicLink) {
    this._link = link;
  }

  /**
   *
   * @param campaign
   * @returns {DynamicLink}
   */
  setCampaign(campaign: string): DynamicLink {
    this._campaign = campaign;
    return this._link;
  }

  /**
   *
   * @param content
   * @returns {DynamicLink}
   */
  setContent(content: string): DynamicLink {
    this._content = content;
    return this._link;
  }

  /**
   *
   * @param medium
   * @returns {DynamicLink}
   */
  setMedium(medium: string): DynamicLink {
    this._medium = medium;
    return this._link;
  }

  /**
   *
   * @param source
   * @returns {DynamicLink}
   */
  setSource(source: string): DynamicLink {
    this._source = source;
    return this._link;
  }

  /**
   *
   * @param term
   * @returns {DynamicLink}
   */
  setTerm(term: string): DynamicLink {
    this._term = term;
    return this._link;
  }

  build(): NativeAnalyticsParameters {
    return {
      campaign: this._campaign,
      content: this._content,
      medium: this._medium,
      source: this._source,
      term: this._term,
    };
  }
}
