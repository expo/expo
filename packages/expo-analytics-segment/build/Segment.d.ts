export declare type SegmentOptions = {
    androidWriteKey?: string;
    iosWriteKey?: string;
};
export declare function initialize(options: SegmentOptions): void;
export declare function identify(userId: string): void;
export declare function identifyWithTraits(userId: string, traits: {
    [key: string]: any;
}): void;
export declare function group(groupId: string): void;
export declare function groupWithTraits(groupId: string, traits: {
    [key: string]: any;
}): void;
export declare function alias(newId: string, options?: {
    [key: string]: any;
}): Promise<boolean>;
export declare function reset(): void;
export declare function track(event: string): void;
export declare function trackWithProperties(event: string, properties: {
    [key: string]: any;
}): void;
export declare function screen(screenName: string): void;
export declare function screenWithProperties(event: string, properties: {
    [key: string]: any;
}): void;
export declare function flush(): void;
export declare function getEnabledAsync(): Promise<boolean>;
export declare function setEnabledAsync(enabled: boolean): Promise<void>;
