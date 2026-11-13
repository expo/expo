// Copyright 2015-present 650 Industries. All rights reserved.

#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

/**
 Renders the app's first screen through Fabric before React Native starts.

 When the app hides the splash screen, the screen that replaces it is captured (the view hierarchy
 with the frames UIKit resolved, and the custom fonts it uses) and stored in the app container. On the
 next launch, the snapshot is built and laid out on a background thread as soon as the binary is
 loaded, mounted into a detached view in `application(_:didFinishLaunchingWithOptions:)`, and shown in
 an overlay window when the window scene connects. Only the renderer and the mounting layer are used:
 no React host, no JS runtime, no TurboModules. The overlay fades out when the app hides the splash
 screen.

 `ExpoSplashScreenPrerenderSnapshot` in Info.plist turns it on.
 */
@interface SplashScreenPrerender : NSObject

+ (instancetype)shared;

/** Whether the prerender is turned on and active for this launch. */
@property (nonatomic, readonly) BOOL isEnabled;

/**
 Main thread. Whether this launch has a snapshot to show. Waits briefly for the background
 preparation. When NO, the splash image should be shown instead.
 */
- (BOOL)hasTemplate;

/** Main thread. Mounts the prepared tree into a detached view if the background preparation is done. */
- (void)mountIfPrepared;

/** Main thread. Shows the mounted tree in an overlay window on the scene. */
- (void)showInWindowScene:(UIWindowScene *)windowScene;

/** Fades the overlay out over `duration` seconds (0 removes it immediately), then releases it. */
- (void)dismissWithFadeDuration:(NSTimeInterval)duration;

/** Whether the view is the root component view of the prerender surface (and not the app's). */
- (BOOL)isPrerenderRootView:(UIView *)view;

/** The app's root view, the source of launch screen snapshots. */
- (void)setAppRootView:(nullable UIView *)rootView;

/**
 Main thread. Captures the screen on display after `delay` seconds (once it has settled) for the next
 launch. The snapshot replays only while the window size, text size, appearance and app build match.
 */
- (void)captureLaunchScreenAfterDelay:(NSTimeInterval)delay;

@end

NS_ASSUME_NONNULL_END
