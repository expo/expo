import { AndroidConfig, ConfigPlugin } from '@expo/config-plugins';
import { ExpoConfig } from '@expo/config-types';
type DPIString = 'mdpi' | 'hdpi' | 'xhdpi' | 'xxhdpi' | 'xxxhdpi';
type dpiMap = Record<DPIString, {
    folderName: string;
    scale: number;
}>;
export declare const dpiValues: dpiMap;
export declare const ANDROID_RES_PATH = "android/app/src/main/res/";
export declare const withAndroidIcons: ConfigPlugin;
export declare function setRoundIconManifest(config: Pick<ExpoConfig, 'android'>, manifest: AndroidConfig.Manifest.AndroidManifest): AndroidConfig.Manifest.AndroidManifest;
export declare function getIcon(config: ExpoConfig): string | null;
export declare function getAdaptiveIcon(config: ExpoConfig): {
    foregroundImage: string | null;
    backgroundColor: string | null;
    backgroundImage: string | null;
    monochromeImage: string | null;
};
/**
 * Resizes the user-provided icon to create a set of legacy icon files in
 * their respective "mipmap" directories for <= Android 7, and creates a set of adaptive
 * icon files for > Android 7 from the adaptive icon files (if provided).
 */
export declare function setIconAsync(projectRoot: string, { icon, backgroundColor, backgroundImage, monochromeImage, isAdaptive, }: {
    icon: string | null;
    backgroundColor: string | null;
    backgroundImage: string | null;
    monochromeImage: string | null;
    isAdaptive: boolean;
}): Promise<true | null>;
/**
 * Configures adaptive icon files to be used on Android 8 and up. A foreground image must be provided,
 * and will have a transparent background unless:
 * - A backgroundImage is provided, or
 * - A backgroundColor was specified
 */
export declare function configureAdaptiveIconAsync(projectRoot: string, foregroundImage: string, backgroundImage: string | null, monochromeImage: string | null, isAdaptive: boolean): Promise<void>;
export declare const createAdaptiveIconXmlString: (backgroundImage: string | null, monochromeImage: string | null) => string;
export {};
