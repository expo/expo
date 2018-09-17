/**
 * @flow
 * ITunesParameters representation wrapper
 */
import type DynamicLink from './DynamicLink';
import type { NativeITunesParameters } from './types';

export default class ITunesParameters {
  _affiliateToken: string | void;

  _campaignToken: string | void;

  _link: DynamicLink;

  _providerToken: string | void;

  constructor(link: DynamicLink) {
    this._link = link;
  }

  /**
   *
   * @param affiliateToken
   * @returns {DynamicLink}
   */
  setAffiliateToken(affiliateToken: string): DynamicLink {
    this._affiliateToken = affiliateToken;
    return this._link;
  }

  /**
   *
   * @param campaignToken
   * @returns {DynamicLink}
   */
  setCampaignToken(campaignToken: string): DynamicLink {
    this._campaignToken = campaignToken;
    return this._link;
  }

  /**
   *
   * @param providerToken
   * @returns {DynamicLink}
   */
  setProviderToken(providerToken: string): DynamicLink {
    this._providerToken = providerToken;
    return this._link;
  }

  build(): NativeITunesParameters {
    return {
      affiliateToken: this._affiliateToken,
      campaignToken: this._campaignToken,
      providerToken: this._providerToken,
    };
  }
}
