import { PermissionResponse, PermissionStatus } from 'unimodules-permissions-interface';

export const androidAndWebPermissionsResponse: PermissionResponse = {
  granted: true,
  expires: 'never',
  canAskAgain: true,
  status: PermissionStatus.GRANTED,
};
