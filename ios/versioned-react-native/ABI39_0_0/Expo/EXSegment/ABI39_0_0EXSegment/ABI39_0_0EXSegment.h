// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI39_0_0UMCore/ABI39_0_0UMExportedModule.h>

@interface ABI39_0_0EXSegment : ABI39_0_0UMExportedModule

- (void)setEnabled:(BOOL)enabled withResolver:(ABI39_0_0UMPromiseResolveBlock)resolve rejecter:(ABI39_0_0UMPromiseRejectBlock)reject;

@end
