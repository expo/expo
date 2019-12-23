declare const _default: {
    readonly name: string;
    initAppAsync(config: {
        [key: string]: any;
    }): Promise<void>;
    deleteAppAsync(config: {
        [key: string]: any;
    }): Promise<void>;
    /**
     * https://firebase.google.com/docs/reference/js/firebase.analytics.Analytics#log-event
     */
    logEventAsync(name: string, properties?: {
        [key: string]: any;
    } | undefined): Promise<void>;
    /**
     * https://firebase.google.com/docs/reference/js/firebase.analytics.Analytics#set-analytics-collection-enabled
     */
    setAnalyticsCollectionEnabledAsync(isEnabled: boolean): Promise<void>;
    /**
     * https://firebase.google.com/docs/reference/js/firebase.analytics.Analytics#set-current-screen
     */
    setCurrentScreenAsync(screenName: string, screenClassOverride?: string | undefined): Promise<void>;
    /**
     * https://firebase.google.com/docs/reference/js/firebase.analytics.Analytics#set-user-id
     */
    setUserIdAsync(userId: string): Promise<void>;
    setUserPropertyAsync(name: string, value?: {
        [key: string]: any;
    } | undefined): Promise<void>;
    /**
     * https://firebase.google.com/docs/reference/js/firebase.analytics.Analytics#set-user-properties
     */
    setUserPropertiesAsync(properties: {
        [key: string]: any;
    }): Promise<void>;
};
export default _default;
