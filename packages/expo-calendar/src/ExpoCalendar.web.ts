import { PermissionResponse, PermissionStatus } from 'expo-modules-core';

const noPermissionResponse: PermissionResponse = {
  status: PermissionStatus.UNDETERMINED,
  canAskAgain: true,
  granted: false,
  expires: 'never',
};

export default {
  async requestCalendarPermissionsAsync(): Promise<PermissionResponse> {
    return noPermissionResponse;
  },
  async getCalendarPermissionsAsync(): Promise<PermissionResponse> {
    return noPermissionResponse;
  },
  async getRemindersPermissionsAsync(): Promise<PermissionResponse> {
    return noPermissionResponse;
  },
  async requestRemindersPermissionsAsync(): Promise<PermissionResponse> {
    return noPermissionResponse;
  },
};
