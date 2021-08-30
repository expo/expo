export declare type InitializeOptions = {
    /**
     * Write key for Android source.
     */
    androidWriteKey?: string;
    /**
     * Write key for iOS source.
     */
    iosWriteKey?: string;
};
export declare type CommonOptions = Record<string, any> | null;
/**
 * Segment requires separate write keys for iOS and Android. You will need to log in to Segment
 * to receive these keys: [https://segment.com/docs/guides/setup/how-do-i-find-my-write-key/](https://segment.com/docs/guides/setup/how-do-i-find-my-write-key/)
 *
 * @param options An [`InitializeOptions`](#initializeoptions) object.
 */
export declare function initialize(options: InitializeOptions): void;
/**
 * Associates the current user with a user ID. Call this after calling [`Segment.initialize()`](#initialize)
 * but before other segment calls. See [Segment Identify docs](https://segment.com/docs/spec/identify/).
 * @param userId User ID for the current user.
 */
export declare function identify(userId: string): void;
/**
 * @param userId User ID for the current user.
 * @param traits A map of custom properties.
 * @param options Map that can include any of [these common fields](https://segment.com/docs/connections/spec/common/).
 * Defaults to `null`.
 */
export declare function identifyWithTraits(userId: string, traits: Record<string, any>, options?: CommonOptions): void;
/**
 * Associate the user with a group. See [Segment Group docs](https://segment.com/docs/spec/group/).
 *
 * @param groupId ID of the group.
 */
export declare function group(groupId: string): void;
/**
 * Associate the user with a group with traits. See [Segment Group docs](https://segment.com/docs/spec/group/).
 *
 * @param groupId ID of the group.
 * @param traits Free-form dictionary of traits of the group.
 * @param options A map that can include any of [these common fields](https://segment.com/docs/connections/spec/common/).
 * Defaults to `null`.
 */
export declare function groupWithTraits(groupId: string, traits: Record<string, any>, options?: CommonOptions): void;
/**
 * Associate current identity with a new identifier. See [Segment Alias docs](https://segment.com/docs/spec/alias/).
 *
 * @param newId Identifier to associate with.
 * @param options An extra dictionary with options for the call, [see here](https://segment.com/docs/connections/spec/common/)
 * for possible configuration options. An example options object would be:
 * ```json
 * {
 *   "integrations": {
 *     "Sentry": {
 *       "enabled": true
 *      }
 *   },
 *   "context": {
 *     "ip": "0.0.0.0"
 *   }
 * }
 * ```
 *
 * @return A `Promise` which fulfils witch a `boolean` indicating whether the method has been
 * executed on the underlying `Segment` instance or not.
 */
export declare function alias(newId: string, options?: CommonOptions): Promise<boolean>;
/**
 * Clears the current user. See [https://segment.com/docs/sources/mobile/ios/#reset](https://segment.com/docs/sources/mobile/ios/#reset).
 */
export declare function reset(): void;
/**
 * Log an event to Segment. See [Segment Track docs](https://segment.com/docs/spec/track/).
 *
 * @param event The event name.
 */
export declare function track(event: string): void;
/**
 * Log an event to Segment with custom properties. See [Segment Track docs](https://segment.com/docs/spec/track/).
 *
 * @param event The event name.
 * @param properties A map of custom properties.
 * @param options A map that can include any of [these common fields](https://segment.com/docs/connections/spec/common/).
 * Defaults to `null`.
 */
export declare function trackWithProperties(event: string, properties: Record<string, any>, options?: CommonOptions): void;
/**
 * Record that a user has seen a screen to Segment. See [Segment Screen docs](https://segment.com/docs/spec/screen/).
 *
 * @param screenName Name of the screen.
 */
export declare function screen(screenName: string): void;
/**
 * Record that a user has seen a screen to Segment with custom properties. See [Segment Screen docs](https://segment.com/docs/spec/screen/).
 *
 * @param screenName Name of the screen.
 * @param properties A map of custom properties.
 * @param options A map that can include any of [these common fields](https://segment.com/docs/connections/spec/common/).
 * Defaults to `null`.
 */
export declare function screenWithProperties(screenName: string, properties: Record<string, any>, options?: CommonOptions): void;
/**
 * Manually flush the event queue. You shouldn't need to call this in most cases.
 */
export declare function flush(): void;
export declare function getEnabledAsync(): Promise<boolean>;
export declare function setEnabledAsync(enabled: boolean): Promise<void>;
