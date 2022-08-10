import { AndroidConfig, ConfigPlugin } from '@expo/config-plugins';
import { ExpoConfig } from '@expo/config-types';
export declare const withAndroidManifestIcons: ConfigPlugin;
export declare function setRoundIconManifest(config: Pick<ExpoConfig, 'android'>, manifest: AndroidConfig.Manifest.AndroidManifest): AndroidConfig.Manifest.AndroidManifest;
