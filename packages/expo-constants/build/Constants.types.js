// @needsAudit
export var AppOwnership;
(function (AppOwnership) {
    /**
     * It is a [standalone app](../../../distribution/building-standalone-apps#building-standalone-apps).
     */
    AppOwnership["Standalone"] = "standalone";
    /**
     * The experience is running inside of the Expo Go app.
     */
    AppOwnership["Expo"] = "expo";
    /**
     * It has been opened through a link from a standalone app.
     */
    AppOwnership["Guest"] = "guest";
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
 * Current supported values are `handset` and `tablet`. Apple TV and CarPlay will show up
 * as `unsupported`.
 */
export var UserInterfaceIdiom;
(function (UserInterfaceIdiom) {
    UserInterfaceIdiom["Handset"] = "handset";
    UserInterfaceIdiom["Tablet"] = "tablet";
    UserInterfaceIdiom["Unsupported"] = "unsupported";
})(UserInterfaceIdiom || (UserInterfaceIdiom = {}));
//# sourceMappingURL=Constants.types.js.map