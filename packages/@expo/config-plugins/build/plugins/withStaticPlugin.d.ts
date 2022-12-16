import { ConfigPlugin, StaticPlugin } from '../Plugin.types';
/**
 * Resolves static module plugin and potentially falls back on a provided plugin if the module cannot be resolved
 *
 * @param config
 * @param fallback Plugin with `_resolverError` explaining why the module couldn't be used
 * @param projectRoot optional project root, fallback to _internal.projectRoot. Used for testing.
 * @param _isLegacyPlugin Used to suppress errors thrown by plugins that are applied automatically
 */
export declare const withStaticPlugin: ConfigPlugin<{
    plugin: StaticPlugin | ConfigPlugin | string;
    fallback?: ConfigPlugin<{
        _resolverError: Error;
    } & any>;
    projectRoot?: string;
    _isLegacyPlugin?: boolean;
}>;
