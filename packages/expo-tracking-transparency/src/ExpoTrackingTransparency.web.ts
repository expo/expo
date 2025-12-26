import { PermissionResponse, PermissionStatus } from 'expo-modules-core';

const webPermissionsResponse: PermissionResponse = {
  status: PermissionStatus.GRANTED,
  expires: 'never',
  granted: true,
  canAskAgain: true,
};

export default {
  async getPermissionsAsync(): Promise<PermissionResponse> {
    return webPermissionsResponse;
  },
  async requestPermissionsAsync(): Promise<PermissionResponse> {
    return webPermissionsResponse;
  },
};
