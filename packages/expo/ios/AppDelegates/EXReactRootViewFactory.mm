// Copyright 2018-present 650 Industries. All rights reserved.

#import <Expo/EXReactRootViewFactory.h>
#import <Expo/RCTAppDelegateUmbrella.h>
#import <Expo/Swift.h>
#import <React/RCTDevMenu.h>

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

#if TARGET_OS_IOS || TARGET_OS_TV
- (UIView *)viewWithModuleName:(NSString *)moduleName
             initialProperties:(nullable NSDictionary *)initialProperties
                 launchOptions:(nullable NSDictionary *)launchOptions
           bundleConfiguration:(RCTBundleConfiguration *)bundleConfiguration
          devMenuConfiguration:(RCTDevMenuConfiguration *)devMenuConfiguration
{
  if (self.reactDelegate != nil) {
    return [self.reactDelegate createReactRootViewWithModuleName:moduleName initialProperties:initialProperties launchOptions:launchOptions];
  }
  return [super viewWithModuleName:moduleName
                 initialProperties:initialProperties
                     launchOptions:launchOptions
               bundleConfiguration:bundleConfiguration
              devMenuConfiguration:devMenuConfiguration];
}

- (UIView *)superViewWithModuleName:(NSString *)moduleName
                  initialProperties:(nullable NSDictionary *)initialProperties
                      launchOptions:(nullable NSDictionary *)launchOptions
                bundleConfiguration:(RCTBundleConfiguration *)bundleConfiguration
               devMenuConfiguration:(RCTDevMenuConfiguration *)devMenuConfiguration
{
  if (bundleConfiguration == nil) {
    bundleConfiguration = [RCTBundleConfiguration defaultConfiguration];
  }
  if (devMenuConfiguration == nil) {
    devMenuConfiguration = [RCTDevMenuConfiguration defaultConfiguration];
  }

  return [super viewWithModuleName:moduleName
                 initialProperties:initialProperties
                     launchOptions:launchOptions
               bundleConfiguration:bundleConfiguration
              devMenuConfiguration:devMenuConfiguration];
}
#else
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
#endif

- (NSURL *)bundleURL
{
  return [self.reactDelegate bundleURL] ?: [super bundleURL];
}

@end
