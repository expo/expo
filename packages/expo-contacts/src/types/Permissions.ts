import type { PermissionResponse } from 'expo';

export type ContactsPermissionResponse = PermissionResponse & {
  /**
   * Indicates if your app has access to the whole or only part of the contact library. Possible values are:
   * - `'all'` if the user granted your app access to the whole contact library
   * - `'limited'` if the user granted your app access only to selected contacts (only available on iOS 18+)
   * - `'none'`
   */
  accessPrivileges?: 'all' | 'limited' | 'none';
};
