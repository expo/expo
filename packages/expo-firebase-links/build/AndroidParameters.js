export default class AndroidParameters {
    constructor(link) {
        this._link = link;
    }
    /**
     *
     * @param fallbackUrl
     * @returns {DynamicLink}
     */
    setFallbackUrl(fallbackUrl) {
        this._fallbackUrl = fallbackUrl;
        return this._link;
    }
    /**
     *
     * @param minimumVersion
     * @returns {DynamicLink}
     */
    setMinimumVersion(minimumVersion) {
        this._minimumVersion = minimumVersion;
        return this._link;
    }
    /**
     *
     * @param packageName
     * @returns {DynamicLink}
     */
    setPackageName(packageName) {
        this._packageName = packageName;
        return this._link;
    }
    build() {
        if ((this._fallbackUrl || this._minimumVersion) && !this._packageName) {
            throw new Error('AndroidParameters: Missing required `packageName` property');
        }
        return {
            fallbackUrl: this._fallbackUrl,
            minimumVersion: this._minimumVersion,
            packageName: this._packageName,
        };
    }
}
//# sourceMappingURL=AndroidParameters.js.map