export default class AnalyticsParameters {
    constructor(link) {
        this._link = link;
    }
    /**
     *
     * @param campaign
     * @returns {DynamicLink}
     */
    setCampaign(campaign) {
        this._campaign = campaign;
        return this._link;
    }
    /**
     *
     * @param content
     * @returns {DynamicLink}
     */
    setContent(content) {
        this._content = content;
        return this._link;
    }
    /**
     *
     * @param medium
     * @returns {DynamicLink}
     */
    setMedium(medium) {
        this._medium = medium;
        return this._link;
    }
    /**
     *
     * @param source
     * @returns {DynamicLink}
     */
    setSource(source) {
        this._source = source;
        return this._link;
    }
    /**
     *
     * @param term
     * @returns {DynamicLink}
     */
    setTerm(term) {
        this._term = term;
        return this._link;
    }
    build() {
        return {
            campaign: this._campaign,
            content: this._content,
            medium: this._medium,
            source: this._source,
            term: this._term,
        };
    }
}
//# sourceMappingURL=AnalyticsParameters.js.map