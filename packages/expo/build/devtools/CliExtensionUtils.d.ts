import { ExpoCliExtensionAppInfo } from './cliextension.types';
export declare class SendMessageError extends Error {
    app: ExpoCliExtensionAppInfo;
    constructor(message: string, app: ExpoCliExtensionAppInfo);
}
export declare const getDeviceIdentifier: (app: ExpoCliExtensionAppInfo) => string;
export declare const formatDeviceIdentifier: (deviceName: string, applicationId: string) => string;
//# sourceMappingURL=CliExtensionUtils.d.ts.map