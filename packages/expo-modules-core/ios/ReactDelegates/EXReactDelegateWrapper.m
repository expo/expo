// Copyright 2018-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXReactDelegateWrapper.h>

#import <ExpoModulesCore/EXAppDefines.h>
#import <ExpoModulesCore/EXReactDelegateWrapper+Private.h>

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

- (RCTBridge *)createBridgeWithDelegate:(id<RCTBridgeDelegate>)delegate
                          launchOptions:(nullable NSDictionary *)launchOptions
{
  return [_expoReactDelegate createBridgeWithDelegate:delegate launchOptions:launchOptions];
}

- (RCTRootView *)createRootViewWithBridge:(RCTBridge *)bridge
                               moduleName:(NSString *)moduleName
                        initialProperties:(nullable NSDictionary *)initialProperties
{
  return [_expoReactDelegate createRootViewWithBridge:bridge
                                           moduleName:moduleName
                                    initialProperties:initialProperties
                                        fabricEnabled:EXAppDefines.APP_NEW_ARCH_ENABLED];
}

- (RCTRootView *)createRootViewWithBridge:(RCTBridge *)bridge
                               moduleName:(NSString *)moduleName
                        initialProperties:(nullable NSDictionary *)initialProperties
                            fabricEnabled:(BOOL)fabricEnabled
{
  return [_expoReactDelegate createRootViewWithBridge:bridge moduleName:moduleName initialProperties:initialProperties fabricEnabled:fabricEnabled];
}

- (UIViewController *)createRootViewController
{
  return [_expoReactDelegate createRootViewController];
}

@end
