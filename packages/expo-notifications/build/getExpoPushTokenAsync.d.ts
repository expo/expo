import { DevicePushToken, ExpoPushToken } from './Tokens.types';
interface Options {
    baseUrl?: string;
    url?: string;
    type?: string;
    deviceId?: string;
    development?: boolean;
    projectId: string;
    applicationId?: string;
    devicePushToken?: DevicePushToken;
}
interface DeprecatedOptions extends Omit<Options, 'projectId'> {
    /**
     * @deprecated use `projectId` instead.
     */
    experienceId?: string;
    projectId?: string;
}
/**
 * @deprecated specifying `projectId` is now required.
 */
export declare function getExpoPushTokenAsync(): Promise<ExpoPushToken>;
export declare function getExpoPushTokenAsync(options: Options): Promise<ExpoPushToken>;
/**
 * @deprecated specifying `projectId` is now required.
 */
export declare function getExpoPushTokenAsync(options: DeprecatedOptions): Promise<ExpoPushToken>;
export {};
//# sourceMappingURL=getExpoPushTokenAsync.d.ts.map