import { DynamicLink, NativeITunesParameters } from './types';
export default class ITunesParameters {
    _affiliateToken?: string;
    _campaignToken?: string;
    _link: DynamicLink;
    _providerToken?: string;
    constructor(link: DynamicLink);
    /**
     *
     * @param affiliateToken
     * @returns {DynamicLink}
     */
    setAffiliateToken(affiliateToken: string): DynamicLink;
    /**
     *
     * @param campaignToken
     * @returns {DynamicLink}
     */
    setCampaignToken(campaignToken: string): DynamicLink;
    /**
     *
     * @param providerToken
     * @returns {DynamicLink}
     */
    setProviderToken(providerToken: string): DynamicLink;
    build(): NativeITunesParameters;
}
