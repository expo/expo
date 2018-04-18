// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI27_0_0EXAppLoadingManager.h"

@implementation ABI27_0_0EXAppLoadingManager

ABI27_0_0RCT_EXPORT_MODULE(ExponentAppLoadingManager);

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

- (UIView *)view
{
  _started = YES;
  return [[UIView alloc] init];
}

ABI27_0_0RCT_REMAP_METHOD(finishedAsync,
                 hideWithResolver:(ABI27_0_0RCTPromiseResolveBlock)resolve
                 rejecter:(ABI27_0_0RCTPromiseRejectBlock)reject)
{
  _finished = YES;
  resolve(nil);
}

@end
