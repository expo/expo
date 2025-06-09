// Copyright 2018-present 650 Industries. All rights reserved.

#import <Expo/EXReactRootViewFactory.h>
#import <Expo/RCTAppDelegateUmbrella.h>
#import <Expo/Swift.h>

// When `use_frameworks!` is used, the generated Swift header is inside ExpoModulesCore module.
// Otherwise, it's available only locally with double-quoted imports.
#if __has_include(<ExpoModulesCore/ExpoModulesCore-Swift.h>)
#import <ExpoModulesCore/ExpoModulesCore-Swift.h>
#else
#import "ExpoModulesCore-Swift.h"
#endif

@interface RCTRootViewFactory ()

- (NSURL *)bundleURL;

@end

@implementation EXReactRootViewFactory

- (instancetype)initWithReactDelegate:(nullable EXReactDelegate *)reactDelegate
                        configuration:(RCTRootViewFactoryConfiguration *)configuration
           turboModuleManagerDelegate:(nullable id<RCTTurboModuleManagerDelegate>)turboModuleManagerDelegate
{
  if (self = [super initWithConfiguration:configuration andTurboModuleManagerDelegate:turboModuleManagerDelegate]) {
    self.reactDelegate = reactDelegate;
  }
  return self;
}

- (UIView *)viewWithModuleName:(NSString *)moduleName
             initialProperties:(nullable NSDictionary *)initialProperties
                 launchOptions:(nullable NSDictionary *)launchOptions
{
  if (self.reactDelegate != nil) {
    return [self.reactDelegate createReactRootViewWithModuleName:moduleName initialProperties:initialProperties launchOptions:launchOptions];
  }
  return [super viewWithModuleName:moduleName initialProperties:initialProperties launchOptions:launchOptions];
}

- (UIView *)superViewWithModuleName:(NSString *)moduleName
                  initialProperties:(nullable NSDictionary *)initialProperties
                      launchOptions:(nullable NSDictionary *)launchOptions
{
  return [super viewWithModuleName:moduleName initialProperties:initialProperties launchOptions:launchOptions];
}

- (NSURL *)bundleURL
{
  return [self.reactDelegate bundleURL] ?: [super bundleURL];
}

@end
