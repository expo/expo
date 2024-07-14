import * as AppleImpl from '../apple/Updates';

export const withUpdates = AppleImpl.withUpdates('ios');
export const setUpdatesConfigAsync = AppleImpl.setUpdatesConfigAsync('ios');

export {
  Config
} from '../apple/Updates';
