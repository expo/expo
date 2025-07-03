import { ExpoCliApplication } from './types';
export declare class SendMessageError extends Error {
    app: ExpoCliApplication;
    constructor(message: string, app: ExpoCliApplication);
}
export declare const getDeviceIdentifier: (app: ExpoCliApplication) => string;
export declare const formatDeviceIdentifier: (deviceName: string, applicationId: string) => string;
