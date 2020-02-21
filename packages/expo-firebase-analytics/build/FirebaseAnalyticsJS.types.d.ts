export declare type FirebaseAnalyticsJSCodedEvent = {
    [key: string]: any;
};
export interface FirebaseAnalyticsJSConfig {
    /**
     * **(Required)** Measurement-Id as found in the web Firebase-config.
     * The format is G-XXXXXXXXXX.
     */
    measurementId: string;
}
export interface FirebaseAnalyticsJSOptions {
    /**
     * **(Required)** Anonymously identifies a particular user, device, or browser instance.
     * For the web, this is generally stored as a first-party cookie with a two-year expiration.
     * For mobile apps, this is randomly generated for each particular instance of an application install.
     * The value of this field should be a random UUID (version 4) as described in http://www.ietf.org/rfc/rfc4122.txt.
     * https://developers.google.com/analytics/devguides/collection/protocol/v1/parameters#cid
     */
    clientId: string;
    /**
     * Max cache time in msec (default = 5000).
     * Caches events fired within a certain time-frame and then
     * sends them to the Google Measurement API in a single batch.
     */
    maxCacheTime?: number;
    /**
     * Enables strict data format checks for logEvent and setUserProperties.
     * When enabled, causes `logEvent` and `setUserProperties` to strictly check
     * whether any event- names & values and user-properties conform to the
     * native SDK requirements.
     */
    strictNativeEmulation?: boolean;
    /**
     * Document title (e.g. "My Awesome Page").
     * This is a browser specific field.
     * https://developers.google.com/analytics/devguides/collection/protocol/v1/parameters#dt
     */
    docTitle?: string;
    /**
     * Document location URL (e.g. "https://myawesomeapp.com").
     * This is a browser specific field.
     * https://developers.google.com/analytics/devguides/collection/protocol/v1/parameters#dl
     */
    docLocation?: string;
    /**
     * Screen-resolution in the format "WxH" (e.g "2000x1440").
     * This is a browser specific field.
     * https://developers.google.com/analytics/devguides/collection/protocol/v1/parameters#sr
     */
    screenRes?: string;
    /**
     * Application name (e.g. "My Awesome App").
     * This is a mobile app specific field.
     * https://developers.google.com/analytics/devguides/collection/protocol/v1/parameters#an
     */
    appName?: string;
    /**
     * Application version (e.g. "1.2").
     * This is a mobile app specific field.
     * https://developers.google.com/analytics/devguides/collection/protocol/v1/parameters#av
     */
    appVersion?: string;
    /**
     * User language (e.g. "en-us").
     * https://developers.google.com/analytics/devguides/collection/protocol/v1/parameters#ul
     */
    userLanguage?: string;
    /**
     * Origin (default =  "firebase").
     */
    origin?: string;
    /**
     * Custom query arguments that are appended to the POST request that is send to the
     * Google Measurement API v2.
     *
     * @example
     * ```
     * const analytics = new FirebaseAnalyticsJS(config, {
     *   appName: 'My Awesome App',
     *   customArg: {
     *     vp: '123x456', // Add viewport-size
     *     sd: '24-bits' // Add screen-colors
     *   }
     * });
     * ```
     */
    customArgs?: {
        [key: string]: any;
    };
}
