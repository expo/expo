declare const _default: {
    readonly name: string;
    /**
     * https://firebase.google.com/docs/reference/js/firebase.analytics.Analytics#log-event
     */
    logEvent(name: string, properties?: {
        [key: string]: any;
    } | undefined): Promise<void>;
    /**
     * https://firebase.google.com/docs/reference/js/firebase.analytics.Analytics#set-analytics-collection-enabled
     */
    setAnalyticsCollectionEnabled(isEnabled: boolean): Promise<void>;
    /**
     * https://firebase.google.com/docs/reference/js/firebase.analytics.Analytics#set-current-screen
     */
    setCurrentScreen(screenName?: string | undefined, screenClassOverride?: string | undefined): Promise<void>;
    /**
     * https://firebase.google.com/docs/reference/js/firebase.analytics.Analytics#set-user-id
     */
    setUserId(userId: string | null): Promise<void>;
    /**
     * https://firebase.google.com/docs/reference/js/firebase.analytics.Analytics#set-user-properties
     */
    setUserProperties(properties: {
        [key: string]: any;
    }): Promise<void>;
    /**
     * No implementation on web
     */
    setUnavailabilityLogging(isEnabled: boolean): void;
};
export default _default;
