// Copyright 2018-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXReactRootViewFactory.h>
#import <ExpoModulesCore/EXReactDelegateWrapper+Private.h>
#import <ExpoModulesCore/RCTAppDelegateUmbrella.h>
#import <ExpoModulesCore/Swift.h>

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
                  initialProperties:(NSDictionary *)initialProperties
                      launchOptions:(NSDictionary *)launchOptions
{
  return [super viewWithModuleName:moduleName initialProperties:initialProperties launchOptions:launchOptions];
}

- (NSURL *)bundleURL
{
  return [self.reactDelegate bundleURL] ?: [super bundleURL];
}

@end
