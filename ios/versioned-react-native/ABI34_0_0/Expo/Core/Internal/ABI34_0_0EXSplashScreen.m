// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI34_0_0EXSplashScreen.h"

@implementation ABI34_0_0EXSplashScreen

ABI34_0_0RCT_EXPORT_MODULE(ExponentSplashScreen);

- (instancetype)init
{
  if (self = [super init]) {
    _started = NO;
    _finished = NO;
  }
  return self;
}

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

ABI34_0_0RCT_EXPORT_METHOD(hide)
{
  _finished = YES;
}

ABI34_0_0RCT_EXPORT_METHOD(preventAutoHide)
{
  _started = YES;
  _finished = NO;
}

@end
