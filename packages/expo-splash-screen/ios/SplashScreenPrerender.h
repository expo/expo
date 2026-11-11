// Copyright 2015-present 650 Industries. All rights reserved.

#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

/**
 Renders the app's launch screen through Fabric before React Native starts.

 The template (`SplashScreenPrerender.json` in the main bundle, written by the config plugin from
 `expo-splash-screen`'s `prerender` option) is a tree of Fabric component names and raw props. It is
 built and laid out on a background thread as soon as the binary is loaded, mounted into a detached
 view in `application(_:didFinishLaunchingWithOptions:)`, and shown in an overlay window when the
 window scene connects. Only the renderer and the mounting layer are used: no React host, no JS
 runtime, no TurboModules. The overlay is removed when the app's own surface mounts its first child.
 */
@interface SplashScreenPrerender : NSObject

+ (instancetype)shared;

/** Whether a template is bundled and the prerender is active for this launch. */
@property (nonatomic, readonly) BOOL isEnabled;

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

@end

NS_ASSUME_NONNULL_END
