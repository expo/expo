import { ExpoConfig } from '@expo/config-types';
import { ConfigPlugin } from '../Plugin.types';
import { AndroidManifest, ManifestUsesPermission } from './Manifest';
export declare const withPermissions: ConfigPlugin<string[] | void>;
/** Given a permission or list of permissions, block permissions in the final `AndroidManifest.xml` to ensure no installed library or plugin can add them. */
export declare const withBlockedPermissions: ConfigPlugin<string[] | string>;
export declare const withInternalBlockedPermissions: ConfigPlugin;
export declare function addBlockedPermissions(androidManifest: AndroidManifest, permissions: string[]): AndroidManifest;
export declare function getAndroidPermissions(config: Pick<ExpoConfig, 'android'>): string[];
export declare function setAndroidPermissions(config: Pick<ExpoConfig, 'android'>, androidManifest: AndroidManifest): AndroidManifest;
export declare function isPermissionAlreadyRequested(permission: string, manifestPermissions: ManifestUsesPermission[]): boolean;
export declare function addPermissionToManifest(permission: string, manifestPermissions: ManifestUsesPermission[]): ManifestUsesPermission[];
export declare function removePermissions(androidManifest: AndroidManifest, permissionNames?: string[]): void;
export declare function addPermission(androidManifest: AndroidManifest, permissionName: string): void;
export declare function ensurePermissions(androidManifest: AndroidManifest, permissionNames: string[]): {
    [permission: string]: boolean;
};
export declare function ensurePermission(androidManifest: AndroidManifest, permissionName: string): boolean;
export declare function ensurePermissionNameFormat(permissionName: string): string;
export declare function getPermissions(androidManifest: AndroidManifest): string[];
