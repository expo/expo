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
 Initializer for EXAppDelegateWrapper integration
 */
- (instancetype)initWithReactDelegate:(nullable EXReactDelegate *)reactDelegate
                        configuration:(RCTRootViewFactoryConfiguration *)configuration
           turboModuleManagerDelegate:(nullable id)turboModuleManagerDelegate;

/**
 Calls super `viewWithModuleName:initialProperties:launchOptions:` from `RCTRootViewFactory`.
 */
- (UIView *)superViewWithModuleName:(NSString *)moduleName
                  initialProperties:(nullable NSDictionary *)initialProperties
                      launchOptions:(nullable NSDictionary *)launchOptions;

@end

NS_ASSUME_NONNULL_END
