// Copyright 2018-present 650 Industries. All rights reserved.

#pragma once

#import <React_RCTAppDelegate/React-RCTAppDelegate-umbrella.h>

NS_ASSUME_NONNULL_BEGIN

NS_SWIFT_NAME(ExpoReactNativeFactoryDelegate)
@interface EXReactNativeFactoryDelegate : RCTDefaultReactNativeFactoryDelegate

@property (nonatomic, strong, nullable) RCTReactNativeFactory *reactNativeFactory;

/**
 Recreates a root view bound with customized bundleURL, moduleName, initialProps, and launchOptions.
 If any of these parameters is null, the method will use the original one from `RCTAppDelegate` or `RCTRootViewFactory`.
 This method should be used with `EXReactRootViewFactory` that to recreate a root view.
 */
#if !TARGET_OS_OSX
- (UIView *)recreateRootViewWithBundleURL:(nullable NSURL *)bundleURL
                               moduleName:(nullable NSString *)moduleName
                             initialProps:(nullable NSDictionary *)initialProps
                            launchOptions:(nullable NSDictionary *)launchOptions;
#else
- (NSView *)recreateRootViewWithBundleURL:(nullable NSURL *)bundleURL
                               moduleName:(nullable NSString *)moduleName
                             initialProps:(nullable NSDictionary *)initialProps
                            launchOptions:(nullable NSDictionary *)launchOptions;
#endif

@end

NS_ASSUME_NONNULL_END
