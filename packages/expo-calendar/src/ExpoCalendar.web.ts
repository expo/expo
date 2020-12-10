import { PermissionResponse, PermissionStatus } from 'unimodules-permissions-interface';

const noPermissionResponse: PermissionResponse = {
  status: PermissionStatus.UNDETERMINED,
  canAskAgain: true,
  granted: false,
  expires: 'never',
};

export default {
  get name(): string {
    return 'ExpoCalendar';
  },
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
