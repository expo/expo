// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI42_0_0UMCore/ABI42_0_0UMExportedModule.h>

@interface ABI42_0_0EXSegment : ABI42_0_0UMExportedModule

- (void)setEnabled:(BOOL)enabled withResolver:(ABI42_0_0UMPromiseResolveBlock)resolve rejecter:(ABI42_0_0UMPromiseRejectBlock)reject;

@end
