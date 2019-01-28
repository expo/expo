// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXScopedBridgeModule.h"

@protocol EXScreenOrientationScopedModuleDelegate

- (void)screenOrientationModule:(id)scopedOrientationModule
didChangeSupportedInterfaceOrientations:(UIInterfaceOrientationMask)supportedInterfaceOrientations;

@end

@interface EXScreenOrientation : EXScopedBridgeModule

@end
