// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI13_0_0EXAppLoadingManager.h"

@implementation ABI13_0_0EXAppLoadingManager

ABI13_0_0RCT_EXPORT_MODULE(ExponentAppLoadingManager);

- (instancetype)init
{
  if (self = [super init]) {
    _started = NO;
    _finished = NO;
  }
  return self;
}

- (UIView *)view
{
  _started = YES;
  return [[UIView alloc] init];
}

ABI13_0_0RCT_REMAP_METHOD(finishedAsync,
                 hideWithResolver:(ABI13_0_0RCTPromiseResolveBlock)resolve
                 rejecter:(ABI13_0_0RCTPromiseRejectBlock)reject)
{
  _finished = YES;
  resolve(nil);
}

@end
