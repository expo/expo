import { Platform } from '@unimodules/core';
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
export declare type DevicePushToken = NativeDevicePushToken | WebDevicePushToken | {
    type: Exclude<typeof Platform.OS, WebDevicePushToken['type'] | NativeDevicePushToken['type']>;
    data: any;
};
export default function getDevicePushTokenAsync(): Promise<DevicePushToken>;
