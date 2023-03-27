import { ExpoConfig } from '@expo/config-types';
import { AndroidManifest, AppOwnership, Constants, ExecutionEnvironment, IOSManifest, NativeConstants, PlatformManifest, UserInterfaceIdiom, WebManifest } from './Constants.types';
export { AndroidManifest, AppOwnership, Constants, ExecutionEnvironment, IOSManifest, NativeConstants, PlatformManifest, UserInterfaceIdiom, WebManifest, };
/**
 * Helper method that extracts any custom properties in the `extra` part of the Expo config.
 * The `eas` property is excluded (reserved for Expo internal use).
 * @param config The config from which to extract properties.
 * @return Object containing any properties found. If no extra properties found, returns an empty object.
 */
export declare const customPropertiesFromExpoConfig: (config: ExpoConfig) => {
    [key: string]: any;
};
declare const _default: Constants;
export default _default;
//# sourceMappingURL=Constants.d.ts.map