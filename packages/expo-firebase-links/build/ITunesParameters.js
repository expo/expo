export default class ITunesParameters {
    constructor(link) {
        this._link = link;
    }
    /**
     *
     * @param affiliateToken
     * @returns {DynamicLink}
     */
    setAffiliateToken(affiliateToken) {
        this._affiliateToken = affiliateToken;
        return this._link;
    }
    /**
     *
     * @param campaignToken
     * @returns {DynamicLink}
     */
    setCampaignToken(campaignToken) {
        this._campaignToken = campaignToken;
        return this._link;
    }
    /**
     *
     * @param providerToken
     * @returns {DynamicLink}
     */
    setProviderToken(providerToken) {
        this._providerToken = providerToken;
        return this._link;
    }
    build() {
        return {
            affiliateToken: this._affiliateToken,
            campaignToken: this._campaignToken,
            providerToken: this._providerToken,
        };
    }
}
//# sourceMappingURL=ITunesParameters.js.map