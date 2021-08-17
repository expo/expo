import androidData from './android.json';
import iosData from './ios.json';

export type PermissionMeta = {
  source: string;
  scrapedAt: string;
};

export type AndroidPermission = {
  name: string;
  description: string;
  descriptionLong: string | null;
  constant: string;
  protection: string | null;
  warning: string | null;
  apiAdded: number;
  apiDeprecated: number | null;
  apiReplaced: string | null;
};

export type IOSPermission = {
  name: string;
  description: string;
  warning: string | null;
  framework: string;
  apiAdded: string;
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
