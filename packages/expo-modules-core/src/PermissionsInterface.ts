export enum PermissionStatus {
  GRANTED = 'granted',
  UNDETERMINED = 'undetermined',
  DENIED = 'denied',
}

export type PermissionExpiration = 'never' | number;

export interface PermissionResponse {
  status: PermissionStatus;
  expires: PermissionExpiration;
  granted: boolean;
  canAskAgain: boolean;
}
