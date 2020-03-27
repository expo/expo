import { DevicePushToken } from './getDevicePushTokenAsync';
export interface ExpoPushToken {
    type: 'expo';
    data: string;
}
interface Options {
    baseUrl?: string;
    url?: string;
    type?: string;
    deviceId?: string;
    development?: boolean;
    experienceId?: string;
    applicationId?: string;
    devicePushToken?: DevicePushToken;
}
export default function getExpoPushTokenAsync(options?: Options): Promise<ExpoPushToken>;
export {};
