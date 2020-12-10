import { PermissionResponse, PermissionStatus } from 'unimodules-permissions-interface';

const noPermissionResponse: PermissionResponse = {
  status: PermissionStatus.UNDETERMINED,
  canAskAgain: true,
  granted: false,
  expires: 'never',
};

export default {
  get name(): string {
    return 'ExpoContacts';
  },
  async getPermissionsAsync(): Promise<PermissionResponse> {
    return noPermissionResponse;
  },
  async requestPermissionsAsync(): Promise<PermissionResponse> {
    return noPermissionResponse;
  },
};
