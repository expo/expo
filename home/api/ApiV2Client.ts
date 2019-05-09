import ApiV2HttpClient from './ApiV2HttpClient';

let _client: ApiV2HttpClient | null = null;

export async function updateDeviceTokenAsync(
  deviceToken: string,
  type: 'apns' | 'fcm',
  appInfo: {
    appId: string;
    deviceId: string;
    development: boolean;
  }
): Promise<void> {
  let args: any = {
    appId: appInfo.appId,
    deviceId: appInfo.deviceId,
    deviceToken,
    type,
  };
  if (appInfo.development) {
    args.development = appInfo.development;
  }
  await _getClient().postAsync('push/updateDeviceToken', args);
}

export async function getExponentPushTokenAsync(
  deviceId: string,
  experienceId: string
): Promise<{ exponentPushToken: string }> {
  let args = { deviceId, experienceId };
  return await _getClient().getAsync('push/getExponentPushToken', args);
}

function _getClient(): ApiV2HttpClient {
  if (!_client) {
    _client = new ApiV2HttpClient();
  }
  return _client;
}
