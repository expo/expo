import { NavigationBarStyle, NavigationBarVisibility } from './NavigationBar.types';
/**
 * Sets the style of the navigation bar.
 * > This will have an effect when the following conditions are met:
 * > - Edge-to-edge is enabled
 * > - The `enforceNavigationBarContrast` option of the `react-native-edge-to-edge` plugin is set to `false`.
 * > - The device is using the three-button navigation bar.
 *
 * > Due to a bug in the Android 15 emulator this function may have no effect. Try a physical device or an emulator with a different version of Android.
 *
 * @platform android
 */
export declare function setStyle(style: NavigationBarStyle): void;
/**
 * Set the navigation bar's visibility.
 *
 * @example
 * ```ts
 * NavigationBar.setVisibilityAsync("hidden");
 * ```
 * @param visibility Based on CSS visibility property.
 * @platform android
 */
export declare function setVisibilityAsync(visibility: NavigationBarVisibility): Promise<any>;
export * from './NativeNavigationBarWrapper';
export * from './NavigationBar.types';
//# sourceMappingURL=NavigationBar.d.ts.map