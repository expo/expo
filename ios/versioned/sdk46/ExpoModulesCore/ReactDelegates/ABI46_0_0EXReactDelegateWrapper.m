// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXReactDelegateWrapper.h>
#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXReactDelegateWrapper+Private.h>

@interface ABI46_0_0EXReactDelegateWrapper()

@property (nonatomic, weak) ExpoReactDelegate *expoReactDelegate;

@end

@implementation ABI46_0_0EXReactDelegateWrapper

- (instancetype)initWithExpoReactDelegate:(ExpoReactDelegate *)expoReactDelegate
{
  if (self = [super init]) {
    _expoReactDelegate = expoReactDelegate;
  }
  return self;
}

- (ABI46_0_0RCTBridge *)createBridgeWithDelegate:(id<ABI46_0_0RCTBridgeDelegate>)delegate
                          launchOptions:(nullable NSDictionary *)launchOptions
{
  return [_expoReactDelegate createBridgeWithDelegate:delegate launchOptions:launchOptions];
}

- (ABI46_0_0RCTRootView *)createRootViewWithBridge:(ABI46_0_0RCTBridge *)bridge
                               moduleName:(NSString *)moduleName
                        initialProperties:(nullable NSDictionary *)initialProperties
{
  return [_expoReactDelegate createRootViewWithBridge:bridge moduleName:moduleName initialProperties:initialProperties];
}

- (UIViewController *)createRootViewController
{
  return [_expoReactDelegate createRootViewController];
}

@end
