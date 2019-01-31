export default class NavigationParameters {
    constructor(link) {
        this._link = link;
    }
    /**
     *
     * @param forcedRedirectEnabled
     * @returns {DynamicLink}
     */
    setForcedRedirectEnabled(forcedRedirectEnabled) {
        this._forcedRedirectEnabled = forcedRedirectEnabled;
        return this._link;
    }
    build() {
        return {
            forcedRedirectEnabled: this._forcedRedirectEnabled,
        };
    }
}
//# sourceMappingURL=NavigationParameters.js.map