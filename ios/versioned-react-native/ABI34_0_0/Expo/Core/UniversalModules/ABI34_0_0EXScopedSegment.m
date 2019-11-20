// Copyright © 2019-present 650 Industries. All rights reserved.

#if __has_include(<ABI34_0_0EXSegment/ABI34_0_0EXSegment.h>)
#import "ABI34_0_0EXScopedSegment.h"
#import "ABI34_0_0EXConstantsBinding.h"
#import <ABI34_0_0UMConstantsInterface/ABI34_0_0UMConstantsInterface.h>

@interface ABI34_0_0EXScopedSegment ()

@property (nonatomic, assign) BOOL isInExpoClient;

@end

@implementation ABI34_0_0EXScopedSegment

- (void)setModuleRegistry:(ABI34_0_0UMModuleRegistry *)moduleRegistry
{
  _isInExpoClient = [((ABI34_0_0EXConstantsBinding *)[moduleRegistry getModuleImplementingProtocol:@protocol(ABI34_0_0UMConstantsInterface)]).appOwnership isEqualToString:@"expo"];
}

ABI34_0_0UM_EXPORT_METHOD_AS(setEnabledAsync,
                    setEnabled:(BOOL)enabled
                    withResolver:(ABI34_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI34_0_0UMPromiseRejectBlock)reject)
{
  if (_isInExpoClient) {
    reject(@"E_UNSUPPORTED", @"Setting Segment's `enabled` is not supported in Expo Client.", nil);
    return;
  }

  [super setEnabled:enabled withResolver:resolve rejecter:reject];
}

@end
#endif
