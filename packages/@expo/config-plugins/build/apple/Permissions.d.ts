import { InfoPlist } from './AppleConfig.types';
import { ConfigPlugin } from '../Plugin.types';
export declare const applyPermissions: <Defaults extends Record<string, string> = Record<string, string>>(defaults: Defaults, permissions: Partial<Record<keyof Defaults, string | false>>, infoPlist: InfoPlist) => InfoPlist;
/**
 * Helper method for creating mods to apply default permissions.
 *
 * @param action
 */
export declare const createPermissionsPlugin: (applePlatform: 'ios' | 'macos') => <Defaults extends Record<string, string> = Record<string, string>>(defaults: Defaults, name?: string) => ConfigPlugin<Record<keyof Defaults, string | false | undefined>>;
