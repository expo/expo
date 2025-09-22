export var AppOwnership;
(function (AppOwnership) {
    /**
     * The experience is running inside the Expo Go app.
     * @deprecated Use [`Constants.executionEnvironment`](#executionenvironment) instead.
     */
    AppOwnership["Expo"] = "expo";
})(AppOwnership || (AppOwnership = {}));
/**
 * Identifies where the app's JavaScript bundle is currently running.
 */
export var ExecutionEnvironment;
(function (ExecutionEnvironment) {
    /** A project that includes native project directories that you maintain directly in your
     * [existing (bare) React Native app](https://docs.expo.dev/bare/overview/).
     */
    ExecutionEnvironment["Bare"] = "bare";
    /** Production/release build created with or without EAS Build. */
    ExecutionEnvironment["Standalone"] = "standalone";
    /** Expo Go or a development build built with `expo-dev-client`. */
    ExecutionEnvironment["StoreClient"] = "storeClient";
})(ExecutionEnvironment || (ExecutionEnvironment = {}));
// @needsAudit
/**
 * Current supported values are `handset`, `tablet`, `desktop` and `tv`. CarPlay will show up
 * as `unsupported`.
 */
export var UserInterfaceIdiom;
(function (UserInterfaceIdiom) {
    UserInterfaceIdiom["Handset"] = "handset";
    UserInterfaceIdiom["Tablet"] = "tablet";
    UserInterfaceIdiom["Desktop"] = "desktop";
    UserInterfaceIdiom["TV"] = "tv";
    UserInterfaceIdiom["Unsupported"] = "unsupported";
})(UserInterfaceIdiom || (UserInterfaceIdiom = {}));
//# sourceMappingURL=Constants.types.js.map