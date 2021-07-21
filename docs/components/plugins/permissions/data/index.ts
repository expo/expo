import androidData from './android.json';
import iosData from './ios.json';

export type AndroidPermissionItem = {
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

export type IOSPermissionItem = {
  name: string;
  description: string;
  warning: string | null;
  framework: string;
  apiAdded: string;
  apiDeprecated: boolean;
};

export const androidPermissions: { [key: string]: AndroidPermissionItem } = androidData;
export const iosPermissions: { [key: string]: IOSPermissionItem } = iosData;
