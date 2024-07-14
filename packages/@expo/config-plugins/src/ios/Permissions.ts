import * as AppleImpl from '../apple/Permissions';

export const createPermissionsPlugin = AppleImpl.createPermissionsPlugin('ios');

export { applyPermissions } from '../apple/Permissions';
