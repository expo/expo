// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI41_0_0UMCore/ABI41_0_0UMExportedModule.h>

@interface ABI41_0_0EXSegment : ABI41_0_0UMExportedModule

- (void)setEnabled:(BOOL)enabled withResolver:(ABI41_0_0UMPromiseResolveBlock)resolve rejecter:(ABI41_0_0UMPromiseRejectBlock)reject;

@end
