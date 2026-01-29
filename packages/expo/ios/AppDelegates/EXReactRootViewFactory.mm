// Copyright 2018-present 650 Industries. All rights reserved.

#import <Expo/EXReactRootViewFactory.h>
#import <Expo/RCTAppDelegateUmbrella.h>
#import <React/RCTDevMenu.h>
#import <ExpoModulesCore/EXReactDelegateProtocol.h>

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

#if TARGET_OS_IOS
- (UIView *)viewWithModuleName:(NSString *)moduleName
             initialProperties:(nullable NSDictionary *)initialProperties
                 launchOptions:(nullable NSDictionary *)launchOptions
          devMenuConfiguration:(RCTDevMenuConfiguration *)devMenuConfiguration
{
  if (self.reactDelegate != nil) {
    return [((id<EXReactDelegateProtocol>)self.reactDelegate) createReactRootViewWithModuleName:moduleName initialProperties:initialProperties launchOptions:launchOptions];
  }
  return [super viewWithModuleName:moduleName initialProperties:initialProperties launchOptions:launchOptions devMenuConfiguration:devMenuConfiguration];
}

- (UIView *)superViewWithModuleName:(NSString *)moduleName
                  initialProperties:(nullable NSDictionary *)initialProperties
                      launchOptions:(nullable NSDictionary *)launchOptions
               devMenuConfiguration:(nullable RCTDevMenuConfiguration *)devMenuConfiguration
{
  if (devMenuConfiguration == nil) {
    devMenuConfiguration = [RCTDevMenuConfiguration defaultConfiguration];
  }

  return [super viewWithModuleName:moduleName initialProperties:initialProperties launchOptions:launchOptions devMenuConfiguration:devMenuConfiguration];
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
  return [((id<EXReactDelegateProtocol>)self.reactDelegate) bundleURL] ?: [super bundleURL];
}

@end
