// Copyright © 2019-present 650 Industries. All rights reserved.

#if __has_include(<EXSegment/EXSegment.h>)
#import "EXScopedSegment.h"
#import "EXConstantsBinding.h"
#import <ExpoModulesCore/EXConstantsInterface.h>

@interface EXScopedSegment ()

@end

@implementation EXScopedSegment

- (void)setModuleRegistry:(EXModuleRegistry *)moduleRegistry
{
}

EX_EXPORT_METHOD_AS(setEnabledAsync,
                    setEnabled:(BOOL)enabled
                    withResolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
{
  reject(@"E_UNSUPPORTED", @"Setting Segment's `enabled` is not supported in Expo Go.", nil);
  return;
}

@end
#endif
