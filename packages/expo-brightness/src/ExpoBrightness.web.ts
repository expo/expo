import { PermissionResponse, PermissionStatus } from 'expo-modules-core';

const noPermissionResponse: PermissionResponse = {
  status: PermissionStatus.UNDETERMINED,
  canAskAgain: true,
  granted: false,
  expires: 'never',
};

export default {
  get name(): string {
    return 'ExpoBrightness';
  },
  async getPermissionsAsync(): Promise<PermissionResponse> {
    return noPermissionResponse;
  },
  async requestPermissionsAsync(): Promise<PermissionResponse> {
    return noPermissionResponse;
  },
};
