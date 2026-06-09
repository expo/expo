import type { ConfigPlugin, InfoPlist } from '../Plugin.types';
import type { MergeResults } from '../utils/generateCode';
/**
 * Adopts the UIKit scene-based life cycle in the iOS project.
 *
 * The iOS SDK shipped with Xcode 27 requires apps to use the UIScene life cycle
 * (Apple Technote TN3187); a window-based app delegate is stopped at launch. This
 * plugin adds a `UIApplicationSceneManifest` to the Info.plist, generates a
 * `SceneDelegate.swift`, and updates the `AppDelegate.swift` to vend the scene
 * configuration and move React Native startup into the scene delegate.
 */
export declare const withSceneDelegate: ConfigPlugin;
export declare function setSceneManifest(infoPlist: InfoPlist): InfoPlist;
/**
 * Comments out the window creation and React Native startup that the legacy
 * template ran inside `didFinishLaunchingWithOptions`. With the scene life cycle
 * the window is owned by the scene delegate, so leaving this in place would create
 * a second, detached window.
 */
export declare function removeWindowStartup(src: string): MergeResults;
/**
 * Adds a stored `launchOptions` so the scene delegate can start React Native with
 * the same options the app was launched with.
 */
export declare function addLaunchOptionsProperty(src: string): MergeResults;
/**
 * Adds the scene-configuration method that points UIKit at `SceneDelegate`.
 */
export declare function addSceneConfigurationMethod(src: string): MergeResults;
