import { PermissionExpiration, PermissionMap, PermissionStatus } from './Permissions.types';

export function coalesceStatuses(permissions: PermissionMap): PermissionStatus {
  const statuses = Object.keys(permissions).map(type => permissions[type].status);
  statuses.sort((status1, status2) => _getStatusWeight(status1) - _getStatusWeight(status2));
  // We choose the "heaviest" status with the most implications
  return statuses[statuses.length - 1];
}

function _getStatusWeight(status: PermissionStatus): number {
  // In terms of weight, we treat UNDETERMINED > DENIED > GRANTED since UNDETERMINED requires the
  // most amount of further handling (prompting for permission and then checking that permission)
  // and GRANTED requires the least
  switch (status) {
    case PermissionStatus.GRANTED:
      return 0;
    case PermissionStatus.DENIED:
      return 1;
    case PermissionStatus.UNDETERMINED:
      return 2;
    default:
      return 100;
  }
}

export function coalesceExpirations(permissions: PermissionMap): PermissionExpiration {
  const maxExpiration = 9007199254740991; // Number.MAX_SAFE_INTEGER
  const expirations = Object.keys(permissions).map(type => permissions[type].expires);
  expirations.sort(
    (e1, e2) =>
      (e1 == null || e1 === 'never' ? maxExpiration : e1) -
      (e2 == null || e2 === 'never' ? maxExpiration : e2)
  );
  // We choose the earliest expiration
  return expirations[0];
}

export function coalesceCanAskAgain(permissions: PermissionMap): boolean {
  return Object.keys(permissions).reduce<boolean>(
    (canAskAgain, type) => canAskAgain && permissions[type].canAskAgain,
    true
  );
}

export function coalesceGranted(permissions: PermissionMap): boolean {
  return Object.keys(permissions).reduce<boolean>(
    (granted, type) => granted && permissions[type].granted,
    true
  );
}
