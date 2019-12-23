declare const _default: {
    readonly name: string;
    initAppAsync(config: {
        [key: string]: any;
    }): Promise<void>;
    deleteAppAsync(config: {
        [key: string]: any;
    }): Promise<void>;
    logEventAsync(name: string, properties?: {
        [key: string]: any;
    } | undefined): Promise<void>;
    setAnalyticsCollectionEnabledAsync(isEnabled: boolean): Promise<void>;
    setCurrentScreenAsync(screenName: string, screenClassOverride?: string | undefined): Promise<void>;
    setMinimumSessionDurationAsync(millis: number): Promise<void>;
    setSessionTimeoutDurationAsync(millis: number): Promise<void>;
    setUserIdAsync(userId: string): Promise<void>;
    setUserPropertyAsync(name: string, value?: {
        [key: string]: any;
    } | undefined): Promise<void>;
    setUserPropertiesAsync(properties: {
        [key: string]: any;
    }): Promise<void>;
    resetAnalyticsDataAsync(): Promise<void>;
};
export default _default;
