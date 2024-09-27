// Copyright 2015-present 650 Industries. All rights reserved.

@import UIKit;

#import "EXDisabledDevLoadingView.h"
#import "EXDevSettings.h"

@implementation EXDisabledDevLoadingView {
  BOOL _isObserving;
}
@synthesize bridge = _bridge;

+ (NSString *)moduleName { return @"RCTDevLoadingView"; }


RCT_EXPORT_METHOD(hide)
{
  RCTDevSettings *settings = [[self bridge] devSettings];
  BOOL isFastRefreshEnabled = [settings isHotLoadingEnabled];
  if (_isObserving && isFastRefreshEnabled) {
    [self sendEventWithName:@"devLoadingView:hide" body:@{}];
  }
}

RCT_EXPORT_METHOD(showMessage:(NSString *)message color:(UIColor *)color backgroundColor:(UIColor *)backgroundColor)
{
  RCTDevSettings *settings =  [[self bridge] devSettings];
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

// RCTDevLoadingViewProtocol implementations

+ (void)setEnabled:(BOOL)enabled
{

}

- (void)showWithURL:(NSURL *)URL
{

}

- (void)updateProgress:(RCTLoadingProgress *)progress
{

}

@end

