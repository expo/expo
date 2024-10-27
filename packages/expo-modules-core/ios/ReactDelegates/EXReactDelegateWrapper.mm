// Copyright 2018-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXReactDelegateWrapper.h>
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

- (UIView *)createReactRootView:(NSString *)moduleName
              initialProperties:(nullable NSDictionary *)initialProperties
                  launchOptions:(nullable NSDictionary *)launchOptions
{
  return [_expoReactDelegate createReactRootViewWithModuleName:moduleName
                                             initialProperties:initialProperties
                                                 launchOptions:launchOptions];
}

- (NSURL *)bundleURL
{
  return [_expoReactDelegate bundleURL];
}

- (UIViewController *)createRootViewController
{
  return [_expoReactDelegate createRootViewController];
}

@end
