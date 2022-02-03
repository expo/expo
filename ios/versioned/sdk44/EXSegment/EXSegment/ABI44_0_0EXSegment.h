// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXExportedModule.h>

@interface ABI44_0_0EXSegment : ABI44_0_0EXExportedModule

- (void)setEnabled:(BOOL)enabled withResolver:(ABI44_0_0EXPromiseResolveBlock)resolve rejecter:(ABI44_0_0EXPromiseRejectBlock)reject;

@end
