import { AndroidManifest } from '@expo/config-plugins';
import { ExpoConfig } from '@expo/config-types';
declare const _default: import("@expo/config-plugins").ConfigPlugin<void>;
export default _default;
export declare function setGeneratedAndroidScheme(config: Pick<ExpoConfig, 'scheme' | 'slug'>, androidManifest: AndroidManifest): AndroidManifest;
