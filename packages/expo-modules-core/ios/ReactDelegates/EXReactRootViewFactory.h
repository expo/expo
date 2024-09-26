// Copyright 2018-present 650 Industries. All rights reserved.

#pragma once

#import <ExpoModulesCore/Platform.h>
#import <ExpoModulesCore/EXReactDelegateWrapper.h>
#import <React_RCTAppDelegate/React-RCTAppDelegate-umbrella.h>

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
 Calls super `viewWithModuleName:initialProperties:launchOptions:` from `RCTRootViewFactory`.
 */
- (UIView *)superViewWithModuleName:(NSString *)moduleName
                  initialProperties:(NSDictionary *)initialProperties
                      launchOptions:(NSDictionary *)launchOptions;

@end

NS_ASSUME_NONNULL_END
