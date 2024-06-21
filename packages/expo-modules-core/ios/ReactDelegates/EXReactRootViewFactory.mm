// Copyright 2018-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXReactRootViewFactory.h>

#import <ExpoModulesCore/EXReactDelegateWrapper+Private.h>

#if __has_include(<React-RCTAppDelegate/RCTAppDelegate.h>)
#import <React-RCTAppDelegate/RCTAppDelegate.h>
#elif __has_include(<React_RCTAppDelegate/RCTAppDelegate.h>)
// for importing the header from framework, the dash will be transformed to underscore
#import <React_RCTAppDelegate/RCTAppDelegate.h>
#endif

@interface RCTRootViewFactory ()

- (NSURL *)bundleURL;

@end

@implementation EXReactRootViewFactory

- (instancetype)initWithReactDelegate:(nullable EXReactDelegateWrapper *)reactDelegate
                        configuration:(RCTRootViewFactoryConfiguration *)configuration
           turboModuleManagerDelegate:(id<RCTTurboModuleManagerDelegate>)turboModuleManagerDelegate
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
    return [self.reactDelegate createReactRootView:moduleName initialProperties:initialProperties launchOptions:launchOptions];
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
