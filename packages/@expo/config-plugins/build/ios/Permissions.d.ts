export declare const createPermissionsPlugin: <Defaults extends Record<string, string> = Record<string, string>>(defaults: Defaults, name?: string | undefined) => import("..").ConfigPlugin<Record<keyof Defaults, string | false | undefined>>;
export { applyPermissions } from '../apple/Permissions';
