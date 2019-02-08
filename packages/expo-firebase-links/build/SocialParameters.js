export default class SocialParameters {
    constructor(link) {
        this._link = link;
    }
    /**
     *
     * @param descriptionText
     * @returns {DynamicLink}
     */
    setDescriptionText(descriptionText) {
        this._descriptionText = descriptionText;
        return this._link;
    }
    /**
     *
     * @param imageUrl
     * @returns {DynamicLink}
     */
    setImageUrl(imageUrl) {
        this._imageUrl = imageUrl;
        return this._link;
    }
    /**
     *
     * @param title
     * @returns {DynamicLink}
     */
    setTitle(title) {
        this._title = title;
        return this._link;
    }
    build() {
        return {
            descriptionText: this._descriptionText,
            imageUrl: this._imageUrl,
            title: this._title,
        };
    }
}
//# sourceMappingURL=SocialParameters.js.map