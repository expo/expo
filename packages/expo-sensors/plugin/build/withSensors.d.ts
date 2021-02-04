import { AndroidConfig, ConfigPlugin } from '@expo/config-plugins';
/**
 * Add the following to the AndroidManifest.xml <uses-feature android:name="android.hardware.sensor.compass" android:required="true" />
 *
 * @param androidManifest
 */
export declare function setAndroidManifestFeatures(androidManifest: AndroidConfig.Manifest.AndroidManifest): AndroidConfig.Manifest.AndroidManifest;
declare const _default: ConfigPlugin<void | {
    motionPermission?: string | undefined;
}>;
export default _default;
