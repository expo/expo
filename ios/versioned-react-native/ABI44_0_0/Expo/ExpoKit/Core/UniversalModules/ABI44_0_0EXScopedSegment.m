// Copyright © 2019-present 650 Industries. All rights reserved.

#if __has_include(<ABI44_0_0EXSegment/ABI44_0_0EXSegment.h>)
#import "ABI44_0_0EXScopedSegment.h"
#import "ABI44_0_0EXConstantsBinding.h"
#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXConstantsInterface.h>

@interface ABI44_0_0EXScopedSegment ()

@property (nonatomic, assign) BOOL isInExpoClient;

@end

@implementation ABI44_0_0EXScopedSegment

- (void)setModuleRegistry:(ABI44_0_0EXModuleRegistry *)moduleRegistry
{
  _isInExpoClient = [((ABI44_0_0EXConstantsBinding *)[moduleRegistry getModuleImplementingProtocol:@protocol(ABI44_0_0EXConstantsInterface)]).appOwnership isEqualToString:@"expo"];
}

ABI44_0_0EX_EXPORT_METHOD_AS(setEnabledAsync,
                    setEnabled:(BOOL)enabled
                    withResolver:(ABI44_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI44_0_0EXPromiseRejectBlock)reject)
{
  if (_isInExpoClient) {
    reject(@"E_UNSUPPORTED", @"Setting Segment's `enabled` is not supported in Expo Go.", nil);
    return;
  }

  [super setEnabled:enabled withResolver:resolve rejecter:reject];
}

@end
#endif
