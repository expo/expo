// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI19_0_0EXAppLoadingManager.h"

@implementation ABI19_0_0EXAppLoadingManager

ABI19_0_0RCT_EXPORT_MODULE(ExponentAppLoadingManager);

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

ABI19_0_0RCT_REMAP_METHOD(finishedAsync,
                 hideWithResolver:(ABI19_0_0RCTPromiseResolveBlock)resolve
                 rejecter:(ABI19_0_0RCTPromiseRejectBlock)reject)
{
  _finished = YES;
  resolve(nil);
}

@end
