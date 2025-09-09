import { PermissionResponse, PermissionStatus } from 'expo-modules-core';

const noPermissionResponse: PermissionResponse = {
  status: PermissionStatus.DENIED,
  canAskAgain: false,
  granted: false,
  expires: 'never',
};

export default {
  getAdvertisingId(): string {
    console.warn(
      'TrackingTransparency.getAdvertisingId: Advertising ID is not supported on web platform'
    );
    return '00000000-0000-0000-0000-000000000000';
  },
  async requestPermissionsAsync(): Promise<PermissionResponse> {
    console.warn(
      'TrackingTransparency.requestPermissionsAsync: App tracking permissions are not supported on web platform'
    );
    return noPermissionResponse;
  },
  async getPermissionsAsync(): Promise<PermissionResponse> {
    console.warn(
      'TrackingTransparency.getPermissionsAsync: App tracking permissions are not supported on web platform'
    );
    return noPermissionResponse;
  },
};
