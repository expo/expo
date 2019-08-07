// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI33_0_0UMCore/ABI33_0_0UMExportedModule.h>

@interface ABI33_0_0EXSegment : ABI33_0_0UMExportedModule

- (void)setEnabled:(BOOL)enabled withResolver:(ABI33_0_0UMPromiseResolveBlock)resolve rejecter:(ABI33_0_0UMPromiseRejectBlock)reject;

@end
