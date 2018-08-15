/**
 * @providesModule ApiV2Client
 * @flow
 */
'use strict';

import ApiV2HttpClient from 'ApiV2HttpClient';

let _client: ?ApiV2HttpClient;

export default {
  async updateDeviceTokenAsync(
    deviceToken: string,
    type: 'apns' | 'fcm' | 'gcm',
    appInfo: {
      appId: string,
      deviceId: string,
      development: boolean,
    }
  ): Promise<*> {
    let args: any = {
      appId: appInfo.appId,
      deviceId: appInfo.deviceId,
      deviceToken,
      type,
    };
    if (appInfo.development) {
      args.development = appInfo.development;
    }
    return _getClient().postAsync('push/updateDeviceToken', args);
  },

  async getExponentPushTokenAsync(
    deviceId: string,
    experienceId: string
  ): Promise<{ exponentPushToken: string }> {
    let args = { deviceId, experienceId };
    return _getClient().getAsync('push/getExponentPushToken', args);
  },
};

function _getClient(): ApiV2HttpClient {
  if (!_client) {
    _client = new ApiV2HttpClient();
  }
  return _client;
}
