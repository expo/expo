// Copyright 2015-present 650 Industries. All rights reserved.

#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

/**
 A view whose subtree is left out of launch screen snapshots. Its frame is kept (blank, or filled
 with `placeholderColor`) so the layout around it does not change when React takes over.
 */
@protocol SplashScreenSnapshotExcluded <NSObject>
@property (nonatomic, strong, nullable) UIColor *placeholderColor;
@end

/**
 Renders the app's launch screen through Fabric before React Native starts.

 The template (`SplashScreenPrerender.json` in the main bundle, written by the config plugin from
 `expo-splash-screen`'s `prerender` option) is a tree of Fabric component names and raw props. It is
 built and laid out on a background thread as soon as the binary is loaded, mounted into a detached
 view in `application(_:didFinishLaunchingWithOptions:)`, and shown in an overlay window when the
 window scene connects. Only the renderer and the mounting layer are used: no React host, no JS
 runtime, no TurboModules. The overlay is removed when the app's own surface mounts its first child.

 Once the app's first screen is up, its committed tree is captured (`saveLaunchScreen`) and replayed
 on the next launch, so the prerender follows whatever the app shows first (signed in or out, locale,
 theme) without a build step.
 */
@interface SplashScreenPrerender : NSObject

+ (instancetype)shared;

/** Whether the prerender is configured (a bundled template or snapshots) and active for this launch. */
@property (nonatomic, readonly) BOOL isEnabled;

/** Whether the config plugin's `prerender.snapshot` is on (`ExpoSplashScreenPrerenderSnapshot` in Info.plist). */
@property (nonatomic, readonly) BOOL isSnapshotEnabled;

/**
 Main thread. Whether this launch has something to show (a bundled template or a matching
 snapshot). Waits briefly for the background preparation. When NO, the splash image should be
 shown instead.
 */
- (BOOL)hasTemplate;

/** Main thread. Mounts the prepared tree into a detached view if the background preparation is done. */
- (void)mountIfPrepared;

/** Main thread. Shows the mounted tree in an overlay window on the scene. */
- (void)showInWindowScene:(UIWindowScene *)windowScene;

/** Removes the overlay window and releases the renderer objects. */
- (void)dismiss;

/** Fades the overlay out over `duration` seconds (0 removes it immediately), then releases it. */
- (void)dismissWithFadeDuration:(NSTimeInterval)duration;

/** Whether the view is the root component view of the prerender surface (and not the app's). */
- (BOOL)isPrerenderRootView:(UIView *)view;

/** The app's root view (an `RCTSurfaceHostingProxyRootView`), the source of launch screen snapshots. */
- (void)setAppRootView:(nullable UIView *)rootView;

/**
 Serializes the tree currently committed to the app's surface, with the frames React computed, and
 stores it in the app container. The next launch prerenders it instead of the bundled template, as
 long as the window size, text size, appearance and app build still match. Main thread.
 Returns NO when the prerender is disabled or no tree is committed yet.
 */
- (BOOL)saveLaunchScreen;

/** Main thread. `saveLaunchScreen` after `delay` seconds (when the first screen has settled). */
- (void)captureLaunchScreenAfterDelay:(NSTimeInterval)delay;

/** Removes the stored snapshot; the next launch uses the bundled template. */
- (void)clearLaunchScreen;

@end

NS_ASSUME_NONNULL_END
