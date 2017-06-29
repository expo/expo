// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXErrorRecovery.h"
#import "EXScope.h"
#import "EXUnversioned.h"

#import <React/RCTBridgeModule.h>

@interface EXErrorRecovery () <RCTBridgeModule>

@end

@implementation EXErrorRecovery

@synthesize bridge = _bridge;

RCT_EXPORT_MODULE(ExponentErrorRecovery);

RCT_EXPORT_METHOD(setRecoveryProps:(NSDictionary *)props)
{
  NSDictionary *params = @{
    @"experienceId": _bridge.scopedModules.scope.experienceId,
    @"props": props,
  };
  [[NSNotificationCenter defaultCenter] postNotificationName:EX_UNVERSIONED(@"EXErrorRecoverySetPropsNotification") object:nil userInfo:params];
}

@end
