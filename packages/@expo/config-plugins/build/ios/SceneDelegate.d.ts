import type { ConfigPlugin, InfoPlist } from '../Plugin.types';
import type { MergeResults } from '../utils/generateCode';
/**
 * Adopts the UIKit scene-based life cycle in the iOS project.
 *
 * The iOS SDK shipped with Xcode 27 requires apps to use the UIScene life cycle
 * (Apple Technote TN3187); a window-based app delegate is stopped at launch. This
 * plugin adds a `UIApplicationSceneManifest` to the Info.plist, generates a
 * `SceneDelegate.swift` subclassing `ExpoSceneDelegate`, and updates the
 * `AppDelegate.swift` to stop owning the window so React Native starts in the scene.
 */
export declare const withSceneDelegate: ConfigPlugin;
export declare function setSceneManifest(infoPlist: InfoPlist): InfoPlist;
/**
 * Removes redeclarations of stored properties that `ExpoAppDelegate` now owns. Leaving them
 * in place is a "cannot override with a stored property" compile error.
 */
export declare function removeInheritedProperties(src: string): string;
/**
 * Comments out the window creation and React Native startup that the legacy
 * template ran inside `didFinishLaunchingWithOptions`. With the scene life cycle the
 * window is owned by `ExpoSceneDelegate`, so leaving this in place would create a
 * second, detached window.
 */
export declare function removeWindowStartup(src: string): MergeResults;
/**
 * Stores `launchOptions` on the app delegate so `ExpoSceneDelegate` can start React Native
 * with the same options the app launched with.
 */
export declare function addLaunchOptionsStorage(src: string): MergeResults;
