// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI36_0_0UMCore/ABI36_0_0UMExportedModule.h>

@interface ABI36_0_0EXSegment : ABI36_0_0UMExportedModule

- (void)setEnabled:(BOOL)enabled withResolver:(ABI36_0_0UMPromiseResolveBlock)resolve rejecter:(ABI36_0_0UMPromiseRejectBlock)reject;

@end
