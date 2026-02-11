// Copyright 2018-present 650 Industries. All rights reserved.

#pragma once

#import <ExpoModulesCore/Platform.h>
#import <Expo/RCTAppDelegateUmbrella.h>

NS_ASSUME_NONNULL_BEGIN

@class EXReactDelegate;

NS_SWIFT_NAME(ExpoReactRootViewFactory)
@interface EXReactRootViewFactory : RCTRootViewFactory

@property (nonatomic, weak, nullable) EXReactDelegate *reactDelegate;

/**
 Initializer for ExpoReactNativeFactory integration
 */
- (instancetype)initWithReactDelegate:(nullable EXReactDelegate *)reactDelegate
                        configuration:(RCTRootViewFactoryConfiguration *)configuration
           turboModuleManagerDelegate:(nullable id)turboModuleManagerDelegate;

/**
 Calls super `viewWithModuleName:initialProperties:launchOptions:` from `RCTRootViewFactory`.
 */
#if TARGET_OS_IOS || TARGET_OS_TV
- (UIView *)superViewWithModuleName:(NSString *)moduleName
                  initialProperties:(nullable NSDictionary *)initialProperties
                      launchOptions:(nullable NSDictionary *)launchOptions
               devMenuConfiguration:(nullable RCTDevMenuConfiguration *)devMenuConfiguration;
#else
- (UIView *)superViewWithModuleName:(NSString *)moduleName
                  initialProperties:(nullable NSDictionary *)initialProperties
                      launchOptions:(nullable NSDictionary *)launchOptions;
#endif

@end

NS_ASSUME_NONNULL_END
