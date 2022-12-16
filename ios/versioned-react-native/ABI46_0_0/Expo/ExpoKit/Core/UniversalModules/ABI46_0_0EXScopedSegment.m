// Copyright © 2019-present 650 Industries. All rights reserved.

#if __has_include(<ABI46_0_0EXSegment/ABI46_0_0EXSegment.h>)
#import "ABI46_0_0EXScopedSegment.h"
#import "ABI46_0_0EXConstantsBinding.h"
#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXConstantsInterface.h>

@interface ABI46_0_0EXScopedSegment ()

@property (nonatomic, assign) BOOL isInExpoClient;

@end

@implementation ABI46_0_0EXScopedSegment

- (void)setModuleRegistry:(ABI46_0_0EXModuleRegistry *)moduleRegistry
{
  _isInExpoClient = [((ABI46_0_0EXConstantsBinding *)[moduleRegistry getModuleImplementingProtocol:@protocol(ABI46_0_0EXConstantsInterface)]).appOwnership isEqualToString:@"expo"];
}

ABI46_0_0EX_EXPORT_METHOD_AS(setEnabledAsync,
                    setEnabled:(BOOL)enabled
                    withResolver:(ABI46_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI46_0_0EXPromiseRejectBlock)reject)
{
  if (_isInExpoClient) {
    reject(@"E_UNSUPPORTED", @"Setting Segment's `enabled` is not supported in Expo Go.", nil);
    return;
  }

  [super setEnabled:enabled withResolver:resolve rejecter:reject];
}

@end
#endif
