// Copyright 2015-present 650 Industries. All rights reserved.

#import <UMCore/UMExportedModule.h>

@interface EXSegment : UMExportedModule

- (void)setEnabled:(BOOL)enabled withResolver:(UMPromiseResolveBlock)resolve rejecter:(UMPromiseRejectBlock)reject;

@end
