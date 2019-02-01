export default class IOSParameters {
    constructor(link) {
        this._link = link;
    }
    /**
     *
     * @param appStoreId
     * @returns {DynamicLink}
     */
    setAppStoreId(appStoreId) {
        this._appStoreId = appStoreId;
        return this._link;
    }
    /**
     *
     * @param bundleId
     * @returns {DynamicLink}
     */
    setBundleId(bundleId) {
        this._bundleId = bundleId;
        return this._link;
    }
    /**
     *
     * @param customScheme
     * @returns {DynamicLink}
     */
    setCustomScheme(customScheme) {
        this._customScheme = customScheme;
        return this._link;
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
     * @param iPadBundleId
     * @returns {DynamicLink}
     */
    setIPadBundleId(iPadBundleId) {
        this._iPadBundleId = iPadBundleId;
        return this._link;
    }
    /**
     *
     * @param iPadFallbackUrl
     * @returns {DynamicLink}
     */
    setIPadFallbackUrl(iPadFallbackUrl) {
        this._iPadFallbackUrl = iPadFallbackUrl;
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
    build() {
        if ((this._appStoreId ||
            this._customScheme ||
            this._fallbackUrl ||
            this._iPadBundleId ||
            this._iPadFallbackUrl ||
            this._minimumVersion) &&
            !this._bundleId) {
            throw new Error('IOSParameters: Missing required `bundleId` property');
        }
        return {
            appStoreId: this._appStoreId,
            bundleId: this._bundleId,
            customScheme: this._customScheme,
            fallbackUrl: this._fallbackUrl,
            iPadBundleId: this._iPadBundleId,
            iPadFallbackUrl: this._iPadFallbackUrl,
            minimumVersion: this._minimumVersion,
        };
    }
}
//# sourceMappingURL=IOSParameters.js.map