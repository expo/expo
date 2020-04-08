import { DevicePushToken, ExpoPushToken } from './Tokens.types';
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
