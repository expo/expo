import { ExpoCliApplication } from './types';

export class SendMessageError extends Error {
  constructor(
    message: string,
    public app: ExpoCliApplication
  ) {
    super(message);
  }
}

export const getDeviceIdentifier = (app: ExpoCliApplication) => {
  // Use the deviceName + app ID as the device identifier
  return formatDeviceIdentifier(app.deviceName, app.appId);
};

export const formatDeviceIdentifier = (deviceName: string, applicationId: string) => {
  // Use the deviceName + app ID as the device identifier
  return `${deviceName} (${applicationId})`;
};
