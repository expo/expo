export declare function initialize(apiKey: string): Promise<void>;
export declare function setUserId(userId: string): Promise<void>;
export declare function setUserProperties(userProperties: {
    [name: string]: any;
}): Promise<void>;
export declare function clearUserProperties(): Promise<void>;
export declare function logEvent(eventName: string): Promise<void>;
export declare function logEventWithProperties(eventName: string, properties: {
    [name: string]: any;
}): Promise<void>;
export declare function setGroup(groupType: string, groupNames: string[]): Promise<void>;
