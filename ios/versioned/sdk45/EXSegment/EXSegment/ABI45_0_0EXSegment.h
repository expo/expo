// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXExportedModule.h>

@interface ABI45_0_0EXSegment : ABI45_0_0EXExportedModule

- (void)setEnabled:(BOOL)enabled withResolver:(ABI45_0_0EXPromiseResolveBlock)resolve rejecter:(ABI45_0_0EXPromiseRejectBlock)reject;

@end
