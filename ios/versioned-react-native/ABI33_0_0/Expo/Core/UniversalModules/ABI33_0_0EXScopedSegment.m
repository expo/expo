// Copyright © 2019-present 650 Industries. All rights reserved.

#import "ABI33_0_0EXScopedSegment.h"
#import "ABI33_0_0EXConstantsBinding.h"
#import <ABI33_0_0UMConstantsInterface/ABI33_0_0UMConstantsInterface.h>

@interface ABI33_0_0EXScopedSegment ()

@property (nonatomic, assign) BOOL isInExpoClient;

@end

@implementation ABI33_0_0EXScopedSegment

- (void)setModuleRegistry:(ABI33_0_0UMModuleRegistry *)moduleRegistry
{
  _isInExpoClient = [((ABI33_0_0EXConstantsBinding *)[moduleRegistry getModuleImplementingProtocol:@protocol(ABI33_0_0UMConstantsInterface)]).appOwnership isEqualToString:@"expo"];
}

ABI33_0_0UM_EXPORT_METHOD_AS(setEnabledAsync,
                    setEnabled:(BOOL)enabled
                    withResolver:(ABI33_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI33_0_0UMPromiseRejectBlock)reject)
{
  if (_isInExpoClient) {
    reject(@"E_UNSUPPORTED", @"Setting Segment's `enabled` is not supported in Expo Client.", nil);
    return;
  }

  [super setEnabled:enabled withResolver:resolve rejecter:reject];
}

@end
