import { PermissionStatus } from 'expo';

import { Contact } from './types/Contact';
import type { ContactsPermissionResponse } from './types/Permissions';

const noPermissionResponse: ContactsPermissionResponse = {
  status: PermissionStatus.UNDETERMINED,
  expires: 'never',
  granted: false,
  canAskAgain: true,
};

const noop = () => {};

export default {
  Contact,
  getPermissionsAsync: async () => noPermissionResponse,
  requestPermissionsAsync: async () => noPermissionResponse,
  addListener: () => ({ remove: noop }),
  removeListener: noop,
  removeAllListeners: noop,
  emit: noop,
  listenerCount: () => 0,
} satisfies typeof import('./ExpoContactsNext').default;
