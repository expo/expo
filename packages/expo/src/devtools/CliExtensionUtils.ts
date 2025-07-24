import { ExpoCliExtensionAppInfo } from './cliextension.types';

export class SendMessageError extends Error {
  constructor(
    message: string,
    public app: ExpoCliExtensionAppInfo
  ) {
    super(message);
  }
}

export const getDeviceIdentifier = (app: ExpoCliExtensionAppInfo) => {
  // Use the deviceName + app ID as the device identifier
  return formatDeviceIdentifier(app.deviceName, app.appId);
};

export const formatDeviceIdentifier = (deviceName: string, applicationId: string) => {
  // Use the deviceName + app ID as the device identifier
  return `${deviceName} (${applicationId})`;
};
