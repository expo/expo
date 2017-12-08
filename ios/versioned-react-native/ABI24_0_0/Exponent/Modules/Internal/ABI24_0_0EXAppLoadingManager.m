// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI24_0_0EXAppLoadingManager.h"

@implementation ABI24_0_0EXAppLoadingManager

ABI24_0_0RCT_EXPORT_MODULE(ExponentAppLoadingManager);

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

ABI24_0_0RCT_REMAP_METHOD(finishedAsync,
                 hideWithResolver:(ABI24_0_0RCTPromiseResolveBlock)resolve
                 rejecter:(ABI24_0_0RCTPromiseRejectBlock)reject)
{
  _finished = YES;
  resolve(nil);
}

@end
