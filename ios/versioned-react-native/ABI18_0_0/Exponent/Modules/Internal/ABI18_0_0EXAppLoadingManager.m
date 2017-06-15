// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI18_0_0EXAppLoadingManager.h"

@implementation ABI18_0_0EXAppLoadingManager

ABI18_0_0RCT_EXPORT_MODULE(ExponentAppLoadingManager);

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

ABI18_0_0RCT_REMAP_METHOD(finishedAsync,
                 hideWithResolver:(ABI18_0_0RCTPromiseResolveBlock)resolve
                 rejecter:(ABI18_0_0RCTPromiseRejectBlock)reject)
{
  _finished = YES;
  resolve(nil);
}

@end
