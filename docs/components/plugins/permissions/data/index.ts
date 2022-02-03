import androidData from './android.json';
import iosData from './ios.json';

export type PermissionMeta = {
  source: string;
  scrapedAt: string;
};

export type AndroidPermission = {
  /** The unique name of the permission. (e.g. "CAMERA" for "android.permission.CAMERA") */
  name: string;
  /** The full unique name of the permission. (e.g. "android.permission.CAMERA") */
  constant: string;
  /** A short description of the permission and what it provides. */
  description: string;
  /** A longer in-depth description of the permission and what it provides. */
  explanation: string | null;
  /** The Android protection level, indicates if its a system-granted or user-granted permission. */
  protection: string | null;
  /** A caution message for permissions which are replaced, deprecated, or requires special usage. */
  warning: string | null;
  /** The Android API where this permission was added. */
  apiAdded: number;
  /** The Android API where this permission was deprecated. */
  apiDeprecated: number | null;
  /** The unique name of the permission that replaces this permission. */
  apiReplaced: string | null;
};

export type IOSPermission = {
  /** The unique name of the permission. (e.g. "NSCameraUsageDescription") */
  name: string;
  /** A short description of the permission and what it provides. */
  description: string;
  /** A caution message for permissions which are replaced, deprecated, or requires special usage. */
  warning: string | null;
  /** The iOS framework where this permission belongs to. */
  framework: string;
  /** String containing OS and version key/value pairs where this permission was added. (separated by two spaces) */
  apiAdded: string;
  /** A boolean if this permission is deprecated or not. */
  apiDeprecated: boolean;
};

/**
 * Permissions can be referenced by direct name, or object with overwrites to display.
 */
export type PermissionReference<T extends { name: string }> =
  | string
  | ({ name: T['name'] } & Partial<Omit<T, 'name'>>);

type DataSet<P> = { meta: PermissionMeta; data: Record<string, P> };

const { meta: androidMeta, data: androidPermissions }: DataSet<AndroidPermission> = androidData;
const { meta: iosMeta, data: iosPermissions }: DataSet<IOSPermission> = iosData;

export { androidMeta, androidPermissions, iosMeta, iosPermissions };
