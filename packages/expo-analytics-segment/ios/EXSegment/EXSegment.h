// Copyright 2015-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXExportedModule.h>

@interface EXSegment : EXExportedModule

- (void)setEnabled:(BOOL)enabled withResolver:(EXPromiseResolveBlock)resolve rejecter:(EXPromiseRejectBlock)reject;

@end
