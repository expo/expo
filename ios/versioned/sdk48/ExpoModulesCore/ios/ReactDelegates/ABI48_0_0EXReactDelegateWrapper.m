// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI48_0_0ExpoModulesCore/ABI48_0_0EXReactDelegateWrapper.h>

#import <ABI48_0_0ExpoModulesCore/ABI48_0_0EXAppDefines.h>
#import <ABI48_0_0ExpoModulesCore/ABI48_0_0EXReactDelegateWrapper+Private.h>

@interface ABI48_0_0EXReactDelegateWrapper()

@property (nonatomic, weak) ExpoReactDelegate *expoReactDelegate;

@end

@implementation ABI48_0_0EXReactDelegateWrapper

- (instancetype)initWithExpoReactDelegate:(ExpoReactDelegate *)expoReactDelegate
{
  if (self = [super init]) {
    _expoReactDelegate = expoReactDelegate;
  }
  return self;
}

- (ABI48_0_0RCTBridge *)createBridgeWithDelegate:(id<ABI48_0_0RCTBridgeDelegate>)delegate
                          launchOptions:(nullable NSDictionary *)launchOptions
{
  return [_expoReactDelegate createBridgeWithDelegate:delegate launchOptions:launchOptions];
}

- (ABI48_0_0RCTRootView *)createRootViewWithBridge:(ABI48_0_0RCTBridge *)bridge
                               moduleName:(NSString *)moduleName
                        initialProperties:(nullable NSDictionary *)initialProperties
{
  return [_expoReactDelegate createRootViewWithBridge:bridge
                                           moduleName:moduleName
                                    initialProperties:initialProperties
                                        fabricEnabled:ABI48_0_0EXAppDefines.APP_NEW_ARCH_ENABLED];
}

- (ABI48_0_0RCTRootView *)createRootViewWithBridge:(ABI48_0_0RCTBridge *)bridge
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
