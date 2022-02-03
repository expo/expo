// Copyright © 2019-present 650 Industries. All rights reserved.

#if __has_include(<ABI42_0_0EXSegment/ABI42_0_0EXSegment.h>)
#import "ABI42_0_0EXScopedSegment.h"
#import "ABI42_0_0EXConstantsBinding.h"
#import <ABI42_0_0ExpoModulesCore/ABI42_0_0EXConstantsInterface.h>

@interface ABI42_0_0EXScopedSegment ()

@property (nonatomic, assign) BOOL isInExpoClient;

@end

@implementation ABI42_0_0EXScopedSegment

- (void)setModuleRegistry:(ABI42_0_0UMModuleRegistry *)moduleRegistry
{
  _isInExpoClient = [((ABI42_0_0EXConstantsBinding *)[moduleRegistry getModuleImplementingProtocol:@protocol(ABI42_0_0EXConstantsInterface)]).appOwnership isEqualToString:@"expo"];
}

ABI42_0_0UM_EXPORT_METHOD_AS(setEnabledAsync,
                    setEnabled:(BOOL)enabled
                    withResolver:(ABI42_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI42_0_0UMPromiseRejectBlock)reject)
{
  if (_isInExpoClient) {
    reject(@"E_UNSUPPORTED", @"Setting Segment's `enabled` is not supported in Expo Go.", nil);
    return;
  }

  [super setEnabled:enabled withResolver:resolve rejecter:reject];
}

@end
#endif
