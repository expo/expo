// Copyright 2018-present 650 Industries. All rights reserved.

#pragma once

#import <ExpoModulesCore/Platform.h>
#import <ExpoModulesCore/EXReactDelegateWrapper.h>

#if __has_include(<React-RCTAppDelegate/RCTRootViewFactory.h>)
#import <React-RCTAppDelegate/RCTRootViewFactory.h>
#elif __has_include(<React_RCTAppDelegate/RCTRootViewFactory.h>)
// for importing the header from framework, the dash will be transformed to underscore
#import <React_RCTAppDelegate/RCTRootViewFactory.h>
#endif

NS_ASSUME_NONNULL_BEGIN

NS_SWIFT_NAME(ExpoReactRootViewFactory)
@interface EXReactRootViewFactory : RCTRootViewFactory

@property (nonatomic, weak, nullable) EXReactDelegateWrapper *reactDelegate;

/**
 Initializer for EXAppDelegateWrapper integration
 */
- (instancetype)initWithReactDelegate:(nullable EXReactDelegateWrapper *)reactDelegate
                        configuration:(RCTRootViewFactoryConfiguration *)configuration
           turboModuleManagerDelegate:(id<RCTTurboModuleManagerDelegate>)turboModuleManagerDelegate;

/**
 Creates a root view bound to a default React instance.
 This is a wrapper for `RCTRootViewFactory` that creates `RCTRootViewFactoryConfiguration` from `UIApplication.sharedApplication.delegate`.
 All the nullable parameters will reference from AppDelegate when the value is null.
 */
+ (UIView *)createDefaultReactRootView:(nullable NSURL *)bundleURL
                            moduleName:(nullable NSString *)moduleName
                     initialProperties:(nullable NSDictionary *)initialProperties
                         launchOptions:(nullable NSDictionary *)launchOptions;

@end

NS_ASSUME_NONNULL_END
