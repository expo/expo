// Copyright 2018-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/Platform.h>
#import <ExpoModulesCore/EXReactDelegateWrapper.h>
#import <Expo/RCTAppDelegateUmbrella.h>

NS_ASSUME_NONNULL_BEGIN

@interface RCTAppDelegate ()

@end

__deprecated_msg("EXAppDelegateWrapper is deprecated. Migrate your AppDelegate to Swift and use ExpoAppDelegate instead. EXAppDelegateWrapper will be removed in SDK 55.")
@interface EXAppDelegateWrapper : NSObject <UIApplicationDelegate, UISceneDelegate, RCTReactNativeFactoryDelegate>

@property (nonatomic, strong, readonly) EXReactDelegateWrapper *reactDelegate;

@property (nonatomic, strong, nullable) NSString *moduleName;
@property (nonatomic, strong, nullable) NSDictionary *initialProps;

/**
 Currently (RN 0.76) `customizeRootView` signature in `RCTAppDelegate` is broken as it uses `RCTRootView` type,
 but this type is no longer used. It should rather be `RCTSurfaceHostingView`, but for simplicity it could be just `UIView`.
 We need a helper function in Objective-C to actually make it to work, otherwise the types will conflict in Swift.
 */
+ (void)customizeRootView:(nonnull UIView *)rootView byAppDelegate:(nonnull RCTAppDelegate *)appDelegate;

@end

NS_ASSUME_NONNULL_END
