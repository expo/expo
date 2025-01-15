// Copyright 2018-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/Platform.h>
#import <ExpoModulesCore/EXReactDelegateWrapper.h>
#import <ExpoModulesCore/RCTAppDelegateUmbrella.h>

NS_ASSUME_NONNULL_BEGIN

@interface RCTAppDelegate ()

- (RCTRootViewFactory *)createRCTRootViewFactory;

@end

@interface EXAppDelegateWrapper : RCTAppDelegate

@property (nonatomic, strong, readonly) EXReactDelegateWrapper *reactDelegate;

/**
 Currently (RN 0.76) `customizeRootView` signature in `RCTAppDelegate` is broken as it uses `RCTRootView` type,
 but this type is no longer used. It should rather be `RCTSurfaceHostingView`, but for simplicity it could be just `UIView`.
 We need a helper function in Objective-C to actually make it to work, otherwise the types will conflict in Swift.
 */
+ (void)customizeRootView:(nonnull UIView *)rootView byAppDelegate:(nonnull RCTAppDelegate *)appDelegate;

@end

NS_ASSUME_NONNULL_END
