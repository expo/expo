declare const _default: {
    readonly name: string;
    initializeAppDangerously(config: {
        [key: string]: any;
    }): Promise<void>;
    deleteApp(config: {
        [key: string]: any;
    }): Promise<void>;
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
    setCurrentScreen(screenName: string, screenClassOverride?: string | undefined): Promise<void>;
    /**
     * https://firebase.google.com/docs/reference/js/firebase.analytics.Analytics#set-user-id
     */
    setUserId(userId: string): Promise<void>;
    setUserProperty(name: string, value?: {
        [key: string]: any;
    } | undefined): Promise<void>;
    /**
     * https://firebase.google.com/docs/reference/js/firebase.analytics.Analytics#set-user-properties
     */
    setUserProperties(properties: {
        [key: string]: any;
    }): Promise<void>;
};
export default _default;
