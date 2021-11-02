import { FirebaseAnalyticsJSCodedEvent, FirebaseAnalyticsJSConfig, FirebaseAnalyticsJSOptions } from './FirebaseAnalyticsJS.types';
/**
 * A pure JavaScript Google Firebase Analytics implementation that uses
 * the HTTPS Measurement API 2 to send events to Google Analytics.
 *
 * This class provides an alternative for the Firebase Analytics module
 * shipped with the Firebase JS SDK. That library uses the gtag.js dependency
 * and requires certain browser features. This prevents the use
 * analytics on other platforms, such as Node-js and react-native.
 *
 * FirebaseAnalyticsJS provides a bare-bone implementation of the new
 * HTTPS Measurement API 2 protocol (which is undocumented), with an API
 * that follows the Firebase Analytics JS SDK.
 */
declare class FirebaseAnalyticsJS {
    readonly url: string;
    private enabled;
    readonly config: FirebaseAnalyticsJSConfig;
    private userId?;
    private userProperties?;
    private screenName?;
    private eventQueue;
    private options;
    private flushEventsPromise;
    private flushEventsTimer;
    private lastTime;
    private sequenceNr;
    constructor(config: FirebaseAnalyticsJSConfig, options: FirebaseAnalyticsJSOptions);
    /**
     * Sends 1 or more coded-events to the back-end.
     * When only 1 event is provided, it is send inside the query URL.
     * When more than 1 event is provided, the event-data is send in
     * the body of the POST request.
     */
    private send;
    private addEvent;
    private flushEvents;
    /**
     * Clears any queued events and cancels the flush timer.
     */
    clearEvents(): void;
    private static isValidName;
    /**
     * Parses an event (as passed to logEvent) and throws an error when the
     * event-name or parameters are invalid.
     *
     * Upon success, returns the event in encoded format, ready to be send
     * through the Google Measurement API v2.
     */
    static parseEvent(options: FirebaseAnalyticsJSOptions, eventName: string, eventParams?: {
        [key: string]: any;
    }): FirebaseAnalyticsJSCodedEvent;
    /**
     * Parses user-properties (as passed to setUserProperties) and throws an error when
     * one of the user properties is invalid.
     *
     * Upon success, returns the user-properties in encoded format, ready to be send
     * through the Google Measurement API v2.
     */
    static parseUserProperty(options: FirebaseAnalyticsJSOptions, userPropertyName: string, userPropertyValue: any): string;
    /**
     * https://firebase.google.com/docs/reference/js/firebase.analytics.Analytics#log-event
     */
    logEvent(eventName: string, eventParams?: {
        [key: string]: any;
    }): Promise<void>;
    /**
     * https://firebase.google.com/docs/reference/js/firebase.analytics.Analytics#set-analytics-collection-enabled
     */
    setAnalyticsCollectionEnabled(isEnabled: boolean): Promise<void>;
    /**
     * https://firebase.google.com/docs/reference/js/firebase.analytics.Analytics#set-current-screen
     */
    setCurrentScreen(screenName?: string, screenClassOverride?: string): Promise<void>;
    /**
     * Not supported, this method is a no-op
     */
    setSessionTimeoutDuration(_sessionTimeoutInterval: number): Promise<void>;
    /**
     * https://firebase.google.com/docs/reference/js/firebase.analytics.Analytics#set-user-id
     */
    setUserId(userId: string | null): Promise<void>;
    /**
     * https://firebase.google.com/docs/reference/js/firebase.analytics.Analytics#set-user-properties
     */
    setUserProperties(userProperties: {
        [key: string]: any;
    }): Promise<void>;
    /**
     * Clears all analytics data for this instance.
     */
    resetAnalyticsData(): Promise<void>;
    /**
     * Enables or disabled debug mode.
     */
    setDebugModeEnabled(isEnabled: boolean): Promise<void>;
    /**
     * Sets a new value for the client ID.
     */
    setClientId(clientId: string): void;
}
export default FirebaseAnalyticsJS;
