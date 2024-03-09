// Copyright 2018-present 650 Industries. All rights reserved.

#pragma once

#import <ExpoModulesCore/Platform.h>
#import <ExpoModulesCore/EXReactDelegateWrapper.h>
#import <ExpoModulesCore/EXReactHostWrapper.h>

#if __has_include(<React-RCTAppDelegate/RCTAppDelegate.h>)
#import <React-RCTAppDelegate/RCTAppDelegate.h>
#elif __has_include(<React_RCTAppDelegate/RCTAppDelegate.h>)
// for importing the header from framework, the dash will be transformed to underscore
#import <React_RCTAppDelegate/RCTAppDelegate.h>
#endif
#if __has_include(<React-RCTAppDelegate/RCTRootViewFactory.h>)
#import <React-RCTAppDelegate/RCTRootViewFactory.h>
#elif __has_include(<React_RCTAppDelegate/RCTRootViewFactory.h>)
// for importing the header from framework, the dash will be transformed to underscore
#import <React_RCTAppDelegate/RCTRootViewFactory.h>
#endif

NS_ASSUME_NONNULL_BEGIN

NS_SWIFT_NAME(ExpoReactRootViewFactory)
#if REACT_NATIVE_TARGET_VERSION >= 74
@interface EXReactRootViewFactory : RCTRootViewFactory
#else
@interface EXReactRootViewFactory : NSObject
#endif

@property (nonatomic, weak, nullable) EXReactDelegateWrapper *reactDelegate;

/**
 * Initializer for EXAppDelegateWrapper
 */
- (instancetype)initWithReactDelegateWrapper:(nullable EXReactDelegateWrapper *)reactDelegate
                              configuration:(RCTRootViewFactoryConfiguration *)configuration
                 turboModuleManagerDelegate:(id<RCTTurboModuleManagerDelegate>)turboModuleManagerDelegate;

/**
 * Initialize with the RCTAppDelegate instance.
 * If the given RCTAppDelegate is null, will reference from UIApplication.sharedApplication.delegate.
 */
- (instancetype)initWithRCTAppDelegate:(nullable RCTAppDelegate *)appDelegate
                             bundleURL:(nullable NSURL *)bundleURL;

- (UIView *_Nonnull)viewWithModuleName:(nullable NSString *)moduleName
                     initialProperties:(nullable NSDictionary *)initialProperties
                         launchOptions:(nullable NSDictionary *)launchOptions;

/**
 * Create a root UIView with React instance binding
 */
//+ (UIView *)createReactBindingRootView:(nullable NSURL *)bundleURL
//                     initialProperties:(nullable NSDictionary *)initialProperties
//                         launchOptions:(nullable NSDictionary *)launchOptions;

/**
 Create a root view from exisiting `EXReactHostWrapper`.
 Backward compatible code before react-native < 0.74, remove this when we drop SDK 50.
 */
+ (UIView *)createRootView:(EXReactHostWrapper *)host
                moduleName:(NSString *)moduleName
         initialProperties:(nullable NSDictionary *)initialProperties
    __deprecated_msg("Remove this when we drop SDK 50");

/**
 Create a `EXReactHostWrapper` instance.
 Backward compatible code before react-native < 0.74, remove this when we drop SDK 50.
 */
+ (EXReactHostWrapper *)createReactHostWithBundleURL:(nullable NSURL *)bundleURL
                                       launchOptions:(nullable NSDictionary *)launchOptions
    __deprecated_msg("Remove this when we drop SDK 50");

@end

NS_ASSUME_NONNULL_END
