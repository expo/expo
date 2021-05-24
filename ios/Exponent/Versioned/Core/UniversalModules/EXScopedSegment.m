// Copyright © 2019-present 650 Industries. All rights reserved.

#if __has_include(<EXSegment/EXSegment.h>)
#import "EXScopedSegment.h"
#import "EXConstantsBinding.h"
#import <ExpoModulesCore/EXConstantsInterface.h>

@interface EXScopedSegment ()

@property (nonatomic, assign) BOOL isInExpoClient;

@end

@implementation EXScopedSegment

- (void)setModuleRegistry:(UMModuleRegistry *)moduleRegistry
{
  _isInExpoClient = [((EXConstantsBinding *)[moduleRegistry getModuleImplementingProtocol:@protocol(EXConstantsInterface)]).appOwnership isEqualToString:@"expo"];
}

UM_EXPORT_METHOD_AS(setEnabledAsync,
                    setEnabled:(BOOL)enabled
                    withResolver:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject)
{
  if (_isInExpoClient) {
    reject(@"E_UNSUPPORTED", @"Setting Segment's `enabled` is not supported in Expo Go.", nil);
    return;
  }

  [super setEnabled:enabled withResolver:resolve rejecter:reject];
}

@end
#endif
