// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXExportedModule.h>

@interface ABI43_0_0EXSegment : ABI43_0_0EXExportedModule

- (void)setEnabled:(BOOL)enabled withResolver:(ABI43_0_0EXPromiseResolveBlock)resolve rejecter:(ABI43_0_0EXPromiseRejectBlock)reject;

@end
