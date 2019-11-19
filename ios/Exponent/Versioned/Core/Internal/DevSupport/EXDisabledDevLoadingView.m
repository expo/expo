// Copyright 2015-present 650 Industries. All rights reserved.

@import UIKit;

#import "EXDisabledDevLoadingView.h"

@implementation EXDisabledDevLoadingView {
  BOOL _isObserving;
}

+ (NSString *)moduleName { return @"RCTDevLoadingView"; }

RCT_EXPORT_METHOD(hide)
{
  if (_isObserving) {
    [self sendEventWithName:@"devLoadingView:hide" body:@{}];
  }
}

RCT_EXPORT_METHOD(showMessage:(NSString *)message color:(UIColor *)color backgroundColor:(UIColor *)backgroundColor)
{
  if (_isObserving) {
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

