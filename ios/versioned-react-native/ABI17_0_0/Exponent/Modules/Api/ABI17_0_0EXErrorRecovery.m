// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI17_0_0EXErrorRecovery.h"
#import "ABI17_0_0EXScope.h"
#import "ABI17_0_0EXUnversioned.h"

#import <ReactABI17_0_0/ABI17_0_0RCTBridgeModule.h>

@interface ABI17_0_0EXErrorRecovery () <ABI17_0_0RCTBridgeModule>

@end

@implementation ABI17_0_0EXErrorRecovery

@synthesize bridge = _bridge;

ABI17_0_0RCT_EXPORT_MODULE(ExponentErrorRecovery);

ABI17_0_0RCT_EXPORT_METHOD(setRecoveryProps:(NSDictionary *)props)
{
  NSDictionary *params = @{
    @"experienceId": _bridge.experienceScope.experienceId,
    @"props": props,
  };
  [[NSNotificationCenter defaultCenter] postNotificationName:@"EXErrorRecoverySetPropsNotification" object:nil userInfo:params];
}

@end
