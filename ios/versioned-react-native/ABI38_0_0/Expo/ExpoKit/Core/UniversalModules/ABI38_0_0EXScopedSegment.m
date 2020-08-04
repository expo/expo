// Copyright © 2019-present 650 Industries. All rights reserved.

#if __has_include(<ABI38_0_0EXSegment/ABI38_0_0EXSegment.h>)
#import "ABI38_0_0EXScopedSegment.h"
#import "ABI38_0_0EXConstantsBinding.h"
#import <ABI38_0_0UMConstantsInterface/ABI38_0_0UMConstantsInterface.h>

@interface ABI38_0_0EXScopedSegment ()

@property (nonatomic, assign) BOOL isInExpoClient;

@end

@implementation ABI38_0_0EXScopedSegment

- (void)setModuleRegistry:(ABI38_0_0UMModuleRegistry *)moduleRegistry
{
  _isInExpoClient = [((ABI38_0_0EXConstantsBinding *)[moduleRegistry getModuleImplementingProtocol:@protocol(ABI38_0_0UMConstantsInterface)]).appOwnership isEqualToString:@"expo"];
}

ABI38_0_0UM_EXPORT_METHOD_AS(setEnabledAsync,
                    setEnabled:(BOOL)enabled
                    withResolver:(ABI38_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI38_0_0UMPromiseRejectBlock)reject)
{
  if (_isInExpoClient) {
    reject(@"E_UNSUPPORTED", @"Setting Segment's `enabled` is not supported in Expo Client.", nil);
    return;
  }

  [super setEnabled:enabled withResolver:resolve rejecter:reject];
}

@end
#endif
