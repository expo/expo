// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI40_0_0UMCore/ABI40_0_0UMExportedModule.h>

@interface ABI40_0_0EXSegment : ABI40_0_0UMExportedModule

- (void)setEnabled:(BOOL)enabled withResolver:(ABI40_0_0UMPromiseResolveBlock)resolve rejecter:(ABI40_0_0UMPromiseRejectBlock)reject;

@end
