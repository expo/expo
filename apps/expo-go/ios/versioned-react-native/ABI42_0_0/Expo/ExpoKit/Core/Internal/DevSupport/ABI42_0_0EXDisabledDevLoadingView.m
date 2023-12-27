// Copyright 2015-present 650 Industries. All rights reserved.

@import UIKit;

#import "ABI42_0_0EXDisabledDevLoadingView.h"
#import "ABI42_0_0EXDevSettings.h"

@implementation ABI42_0_0EXDisabledDevLoadingView {
  BOOL _isObserving;
}

+ (NSString *)moduleName { return @"ABI42_0_0RCTDevLoadingView"; }


ABI42_0_0RCT_EXPORT_METHOD(hide)
{
  ABI42_0_0RCTDevSettings *settings = [[super bridge] devSettings];
  BOOL isFastRefreshEnabled = [settings isHotLoadingEnabled];
  if (_isObserving && isFastRefreshEnabled) {
    [self sendEventWithName:@"devLoadingView:hide" body:@{}];
  }
}

ABI42_0_0RCT_EXPORT_METHOD(showMessage:(NSString *)message color:(UIColor *)color backgroundColor:(UIColor *)backgroundColor)
{
  ABI42_0_0RCTDevSettings *settings = [[super bridge] devSettings];
  BOOL isFastRefreshEnabled = [settings isHotLoadingEnabled];
  if (_isObserving && isFastRefreshEnabled) {
    [self sendEventWithName:@"devLoadingView:showMessage" body:@{@"message":message}];
  }
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[@"devLoadingView:showMessage", @"devLoadingView:hide"];
}

- (void)startObserving
{
  _isObserving = YES;
}

- (void)stopObserving
{
  _isObserving = NO;
}

@end

