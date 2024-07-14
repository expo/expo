import * as AppleImpl from '../apple/Permissions';

export const createPermissionsPlugin = AppleImpl.createPermissionsPlugin('macos');

export { applyPermissions } from '../apple/Permissions';
