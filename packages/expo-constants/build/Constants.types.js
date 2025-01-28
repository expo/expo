export var AppOwnership;
(function (AppOwnership) {
    /**
     * The experience is running inside the Expo Go app.
     * @deprecated Use [`Constants.executionEnvironment`](#executionenvironment) instead.
     */
    AppOwnership["Expo"] = "expo";
})(AppOwnership || (AppOwnership = {}));
// @docsMissing
export var ExecutionEnvironment;
(function (ExecutionEnvironment) {
    ExecutionEnvironment["Bare"] = "bare";
    ExecutionEnvironment["Standalone"] = "standalone";
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