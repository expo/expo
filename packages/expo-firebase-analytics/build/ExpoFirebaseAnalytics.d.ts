declare const _default: {
    readonly name: string;
    logEvent(name: string, properties?: {
        [key: string]: any;
    } | undefined): Promise<void>;
    setAnalyticsCollectionEnabled(isEnabled: boolean): Promise<void>;
    setCurrentScreen(screenName?: string | undefined, screenClassOverride?: string | undefined): Promise<void>;
    setSessionTimeoutDuration(sessionTimeoutInterval: number): Promise<void>;
    setUserId(userId: string | null): Promise<void>;
    setUserProperties(properties: {
        [key: string]: any;
    }): Promise<void>;
    resetAnalyticsData(): Promise<void>;
    setUnavailabilityLogging(isEnabled: boolean): void;
};
export default _default;
