export declare function initialize(apiKey: string): Promise<any>;
export declare function setUserId(userId: string): Promise<any>;
export declare function setUserProperties(userProperties: {
    [name: string]: any;
}): Promise<any>;
export declare function clearUserProperties(): Promise<any>;
export declare function logEvent(eventName: string): Promise<any>;
export declare function logEventWithProperties(eventName: string, properties: {
    [name: string]: any;
}): Promise<any>;
export declare function setGroup(groupType: string, groupNames: string[]): Promise<any>;
