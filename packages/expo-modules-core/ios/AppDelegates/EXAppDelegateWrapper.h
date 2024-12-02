// Copyright 2018-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/Platform.h>
#import <ExpoModulesCore/EXReactDelegateWrapper.h>
#import <ExpoModulesCore/RCTAppDelegateUmbrella.h>

NS_ASSUME_NONNULL_BEGIN

@interface RCTAppDelegate ()

- (RCTRootViewFactory *)createRCTRootViewFactory;

@end

__deprecated_msg("EXAppDelegateWrapper is deprecated as of SDK 53. Migrate your AppDelegate to Swift and use ExpoAppDelegate instead.")
@interface EXAppDelegateWrapper : RCTAppDelegate

@property (nonatomic, strong, readonly) EXReactDelegateWrapper *reactDelegate;

+ (void)customizeRootView:(nonnull UIView *)rootView byAppDelegate:(nonnull RCTAppDelegate *)appDelegate;

@end

NS_ASSUME_NONNULL_END
