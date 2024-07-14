import * as AppleImpl from '../apple/Updates';

export const withUpdates = AppleImpl.withUpdates('macos');
export const setUpdatesConfigAsync = AppleImpl.setUpdatesConfigAsync('macos');

export { Config } from '../apple/Updates';
