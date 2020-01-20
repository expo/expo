export declare function guardPermission(): void;
export declare function getExponentPushTokenAsync(): Promise<string>;
export declare function getDevicePushTokenAsync(): Promise<{
    type: string;
    data: object;
}>;
