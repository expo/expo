import { ConfigPlugin } from 'expo/config-plugins';
import { AndroidSplashConfig, BaseAndroidSplashConfig } from './types';
export declare const withAndroidSplashImages: ConfigPlugin<AndroidSplashConfig>;
/**
 * Deletes all previous splash_screen_images and copies new one to desired drawable directory.
 * If path isn't provided then no new image is placed in drawable directories.
 * @see https://developer.android.com/training/multiscreen/screendensities
 *
 * @param androidMainPath Absolute path to the main directory containing code and resources in Android project. In general that would be `android/app/src/main`.
 */
export declare function setSplashImageDrawablesAsync({ dark, drawable, ...root }: AndroidSplashConfig, projectRoot: string): Promise<void>;
export declare function setSplashImageDrawablesForThemeAsync(config: BaseAndroidSplashConfig | undefined, theme: 'dark' | 'light', projectRoot: string, imageWidth: number): Promise<void>;
