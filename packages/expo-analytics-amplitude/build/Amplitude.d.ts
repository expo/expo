export interface AmplitudeTrackingOptions {
    disableAdid?: boolean;
    disableCarrier?: boolean;
    disableCity?: boolean;
    disableCountry?: boolean;
    disableDeviceBrand?: boolean;
    disableDeviceManufacturer?: boolean;
    disableDeviceModel?: boolean;
    disableDMA?: boolean;
    disableIDFV?: boolean;
    disableIPAddress?: boolean;
    disableLanguage?: boolean;
    disableLatLng?: boolean;
    disableOSName?: boolean;
    disableOSVersion?: boolean;
    disablePlatform?: boolean;
    disableRegion?: boolean;
    disableVersionName?: boolean;
}
export declare function initializeAsync(apiKey: string): Promise<void>;
export declare function setUserIdAsync(userId: string): Promise<void>;
export declare function setUserPropertiesAsync(userProperties: {
    [name: string]: any;
}): Promise<void>;
export declare function clearUserPropertiesAsync(): Promise<void>;
export declare function logEventAsync(eventName: string): Promise<void>;
export declare function logEventWithPropertiesAsync(eventName: string, properties: {
    [name: string]: any;
}): Promise<void>;
export declare function setGroupAsync(groupType: string, groupNames: string[]): Promise<void>;
export declare function setTrackingOptionsAsync(options: AmplitudeTrackingOptions): Promise<void>;
/**
 * @deprecated Use initializeAsync instead
 */
export declare function initialize(apiKey: string): Promise<void>;
/**
 * @deprecated Use setUserIdAsync instead
 */
export declare function setUserId(userId: string): Promise<void>;
/**
 * @deprecated Use setUserPropertiesAsync instead
 */
export declare function setUserProperties(userProperties: {
    [name: string]: any;
}): Promise<void>;
/**
 * @deprecated Use clearUserPropertiesAsync instead
 */
export declare function clearUserProperties(): Promise<void>;
/**
 * @deprecated Use logEventAsync instead
 */
export declare function logEvent(eventName: string): Promise<void>;
/**
 * @deprecated Use logEventWithPropertiesAsync instead
 */
export declare function logEventWithProperties(eventName: string, properties: {
    [name: string]: any;
}): Promise<void>;
/**
 * @deprecated Use setGroupAsync instead
 */
export declare function setGroup(groupType: string, groupNames: string[]): Promise<void>;
/**
 * @deprecated Use setTrackingOptionsAsync instead
 */
export declare function setTrackingOptions(options: AmplitudeTrackingOptions): Promise<void>;
