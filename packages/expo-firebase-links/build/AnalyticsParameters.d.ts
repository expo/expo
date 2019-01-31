import { DynamicLink, NativeAnalyticsParameters } from './types';
export default class AnalyticsParameters {
    _campaign?: string;
    _content?: string;
    _link: DynamicLink;
    _medium?: string;
    _source?: string;
    _term?: string;
    constructor(link: DynamicLink);
    /**
     *
     * @param campaign
     * @returns {DynamicLink}
     */
    setCampaign(campaign: string): DynamicLink;
    /**
     *
     * @param content
     * @returns {DynamicLink}
     */
    setContent(content: string): DynamicLink;
    /**
     *
     * @param medium
     * @returns {DynamicLink}
     */
    setMedium(medium: string): DynamicLink;
    /**
     *
     * @param source
     * @returns {DynamicLink}
     */
    setSource(source: string): DynamicLink;
    /**
     *
     * @param term
     * @returns {DynamicLink}
     */
    setTerm(term: string): DynamicLink;
    build(): NativeAnalyticsParameters;
}
