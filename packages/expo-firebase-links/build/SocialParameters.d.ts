import { DynamicLink, NativeSocialParameters } from './types';
export default class SocialParameters {
    _descriptionText?: string;
    _imageUrl?: string;
    _link: DynamicLink;
    _title?: string;
    constructor(link: DynamicLink);
    /**
     *
     * @param descriptionText
     * @returns {DynamicLink}
     */
    setDescriptionText(descriptionText: string): DynamicLink;
    /**
     *
     * @param imageUrl
     * @returns {DynamicLink}
     */
    setImageUrl(imageUrl: string): DynamicLink;
    /**
     *
     * @param title
     * @returns {DynamicLink}
     */
    setTitle(title: string): DynamicLink;
    build(): NativeSocialParameters;
}
