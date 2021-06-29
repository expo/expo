import { IOSConfig, InfoPlist } from '@expo/config-plugins';
import { ExpoConfig } from '@expo/config-types';
declare const _default: import("@expo/config-plugins").ConfigPlugin<void>;
export default _default;
export declare function setGeneratedIosScheme(config: Pick<ExpoConfig, 'scheme' | 'slug'>, infoPlist: InfoPlist): IOSConfig.InfoPlist;
