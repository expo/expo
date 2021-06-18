// @needsAudit
/**
 * This return value is to let iOS know what the result of your background fetch was, so the
 * platform can better schedule future background fetches. Also, your app has up to 30 seconds
 * to perform the task, otherwise your app will be terminated and future background fetches
 * may be delayed.
 */
export var BackgroundFetchResult;
(function (BackgroundFetchResult) {
    /**
     * There was no new data to download.
     */
    BackgroundFetchResult[BackgroundFetchResult["NoData"] = 1] = "NoData";
    /**
     * New data was successfully downloaded.
     */
    BackgroundFetchResult[BackgroundFetchResult["NewData"] = 2] = "NewData";
    /**
     * An attempt to download data was made but that attempt failed.
     */
    BackgroundFetchResult[BackgroundFetchResult["Failed"] = 3] = "Failed";
})(BackgroundFetchResult || (BackgroundFetchResult = {}));
// @needsAudit
export var BackgroundFetchStatus;
(function (BackgroundFetchStatus) {
    /**
     * The user explicitly disabled background behavior for this app or for the whole system.
     */
    BackgroundFetchStatus[BackgroundFetchStatus["Denied"] = 1] = "Denied";
    /**
     * Background updates are unavailable and the user cannot enable them again. This status can occur
     * when, for example, parental controls are in effect for the current user.
     */
    BackgroundFetchStatus[BackgroundFetchStatus["Restricted"] = 2] = "Restricted";
    /**
     * Background updates are available for the app.
     */
    BackgroundFetchStatus[BackgroundFetchStatus["Available"] = 3] = "Available";
})(BackgroundFetchStatus || (BackgroundFetchStatus = {}));
//# sourceMappingURL=BackgroundFetch.types.js.map