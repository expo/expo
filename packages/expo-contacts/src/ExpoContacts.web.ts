import { type PermissionResponse, PermissionStatus } from 'expo';

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
