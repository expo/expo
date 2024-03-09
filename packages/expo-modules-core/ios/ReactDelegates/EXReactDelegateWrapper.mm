// Copyright 2018-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXReactDelegateWrapper.h>

#import <ExpoModulesCore/EXAppDefines.h>
#import <ExpoModulesCore/EXReactDelegateWrapper+Private.h>
#import <ExpoModulesCore/EXReactHostWrapper+Private.h>
#import <React/RCTBridge.h>
#if RCT_NEW_ARCH_ENABLED
#import <ReactCommon/RCTHost.h>
#endif

@interface EXReactDelegateWrapper()

@property (nonatomic, weak) EXReactDelegate *expoReactDelegate;

@end

@implementation EXReactDelegateWrapper

- (instancetype)initWithExpoReactDelegate:(EXReactDelegate *)expoReactDelegate
{
  if (self = [super init]) {
    _expoReactDelegate = expoReactDelegate;
  }
  return self;
}

- (EXReactHostWrapper *)createReactHostWithBundleURL:(nullable NSURL *)bundleURL
                                       launchOptions:(nullable NSDictionary *)launchOptions
{
  return [_expoReactDelegate createReactHostWithBundleURL:bundleURL launchOptions:launchOptions];
}

- (UIView *)createRootViewWithBridge:(RCTBridge *)bridge
                          moduleName:(NSString *)moduleName
                   initialProperties:(nullable NSDictionary *)initialProperties
{
  EXReactHostWrapper *host = [[EXReactHostWrapper alloc] initWithRCTBridge:bridge];
  return [_expoReactDelegate createRootViewWithHost:host
                                         moduleName:moduleName
                                  initialProperties:initialProperties];
}

#if RCT_NEW_ARCH_ENABLED
- (UIView *)createSurfaceViewWithReactHost:(RCTHost *)reactHost
                                moduleName:(NSString *)moduleName
                         initialProperties:(nullable NSDictionary *)initialProperties
{
  EXReactHostWrapper *host = [[EXReactHostWrapper alloc] initWithRCTHost:reactHost];
  return [_expoReactDelegate createRootViewWithHost:host
                                         moduleName:moduleName
                                  initialProperties:initialProperties];
}
#endif

- (UIViewController *)createRootViewController
{
  return [_expoReactDelegate createRootViewController];
}

@end
