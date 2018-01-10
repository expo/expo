// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXAppLoadingManager.h"

@implementation EXAppLoadingManager

RCT_EXPORT_MODULE(ExponentAppLoadingManager);

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

RCT_REMAP_METHOD(finishedAsync,
                 hideWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  _finished = YES;
  resolve(nil);
}

@end
