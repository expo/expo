import { PermissionStatus } from 'expo';

import type { ContactsPermissionResponse } from './types/Permissions';

type ExpoContactsNext = typeof import('./ExpoContactsNext').default;

const noPermissionResponse: ContactsPermissionResponse = {
  status: PermissionStatus.UNDETERMINED,
  expires: 'never',
  granted: false,
  canAskAgain: true,
};

const Contact = class {
  constructor(public id: string) {}
} as ExpoContactsNext['Contact'];

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
} satisfies ExpoContactsNext;
