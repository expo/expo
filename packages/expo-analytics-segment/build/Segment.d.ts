export declare type InitializeOptions = {
    androidWriteKey?: string;
    iosWriteKey?: string;
};
export declare type CommonOptions = {
    [key: string]: any;
} | null;
export declare function initialize(options: InitializeOptions): void;
export declare function identify(userId: string): void;
export declare function identifyWithTraits(userId: string, traits: {
    [key: string]: any;
}, options?: CommonOptions): void;
export declare function group(groupId: string): void;
export declare function groupWithTraits(groupId: string, traits: {
    [key: string]: any;
}, options?: CommonOptions): void;
export declare function alias(newId: string, options?: CommonOptions): Promise<boolean>;
export declare function reset(): void;
export declare function track(event: string): void;
export declare function trackWithProperties(event: string, properties: {
    [key: string]: any;
}, options?: CommonOptions): void;
export declare function screen(screenName: string): void;
export declare function screenWithProperties(event: string, properties: {
    [key: string]: any;
}, options?: CommonOptions): void;
export declare function flush(): void;
export declare function getEnabledAsync(): Promise<boolean>;
export declare function setEnabledAsync(enabled: boolean): Promise<void>;
