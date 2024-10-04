// Copyright 2018-present 650 Industries. All rights reserved.

#pragma once

#import <ExpoModulesCore/RCTAppDelegateUmbrella.h>

NS_ASSUME_NONNULL_BEGIN

@interface RCTAppDelegate (Recreate)

#if !TARGET_OS_OSX
/**
 Recreates a root view bound with customized bundleURL, moduleName, initialProps, and launchOptions.
 If any of these parameters is null, the method will use the original one from `RCTAppDelegate` or `RCTRootViewFactory`.
 This method should be used with `EXReactRootViewFactory` that to recreate a root view.
 */
- (UIView *)recreateRootViewWithBundleURL:(nullable NSURL *)bundleURL
                               moduleName:(nullable NSString *)moduleName
                             initialProps:(nullable NSDictionary *)initialProps
                            launchOptions:(nullable NSDictionary *)launchOptions;
#endif
@end

NS_ASSUME_NONNULL_END
