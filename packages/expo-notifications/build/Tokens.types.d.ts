import { Platform } from 'expo-modules-core';
export interface NativeDevicePushToken {
    type: 'ios' | 'android';
    data: string;
}
export interface WebDevicePushToken {
    type: 'web';
    data: {
        endpoint: string;
        keys: {
            p256dh: string;
            auth: string;
        };
    };
}
declare type ExplicitlySupportedDevicePushToken = NativeDevicePushToken | WebDevicePushToken;
declare type ImplicitlySupportedDevicePushToken = {
    type: Exclude<typeof Platform.OS, ExplicitlySupportedDevicePushToken['type']>;
    data: any;
};
export declare type DevicePushToken = ExplicitlySupportedDevicePushToken | ImplicitlySupportedDevicePushToken;
export interface ExpoPushToken {
    type: 'expo';
    data: string;
}
export {};
