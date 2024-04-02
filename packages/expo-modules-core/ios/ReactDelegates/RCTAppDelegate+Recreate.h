// Copyright 2018-present 650 Industries. All rights reserved.

#pragma once

#if __has_include(<React-RCTAppDelegate/RCTAppDelegate.h>)
#import <React-RCTAppDelegate/RCTAppDelegate.h>
#elif __has_include(<React_RCTAppDelegate/RCTAppDelegate.h>)
// for importing the header from framework, the dash will be transformed to underscore
#import <React_RCTAppDelegate/RCTAppDelegate.h>
#endif

NS_ASSUME_NONNULL_BEGIN

@interface RCTAppDelegate (Recreate)

/**
 Recreates a root view bound with customized bundleURL, moduleName, initialProps, and launchOptions.
 If any of these parameters is null, the method will use the original one from `RCTAppDelegate` or `RCTRootViewFactory`.
 This method should be used with `EXReactRootViewFactory` that to recreate a root view.
 */
- (UIView *)recreateRootViewWithBundleURL:(nullable NSURL *)bundleURL
                               moduleName:(nullable NSString *)moduleName
                             initialProps:(nullable NSDictionary *)initialProps
                            launchOptions:(nullable NSDictionary *)launchOptions;

@end

NS_ASSUME_NONNULL_END
