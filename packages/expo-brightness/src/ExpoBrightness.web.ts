import { PermissionResponse, PermissionStatus } from 'expo-modules-core';

const noPermissionResponse: PermissionResponse = {
  status: PermissionStatus.UNDETERMINED,
  canAskAgain: true,
  granted: false,
  expires: 'never',
};

export default {
  async getPermissionsAsync(): Promise<PermissionResponse> {
    return noPermissionResponse;
  },
  async requestPermissionsAsync(): Promise<PermissionResponse> {
    return noPermissionResponse;
  },
};
