// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI38_0_0UMCore/ABI38_0_0UMExportedModule.h>

@interface ABI38_0_0EXSegment : ABI38_0_0UMExportedModule

- (void)setEnabled:(BOOL)enabled withResolver:(ABI38_0_0UMPromiseResolveBlock)resolve rejecter:(ABI38_0_0UMPromiseRejectBlock)reject;

@end
