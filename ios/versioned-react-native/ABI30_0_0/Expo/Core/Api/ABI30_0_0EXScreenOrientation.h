// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI30_0_0EXScopedBridgeModule.h"

@protocol ABI30_0_0EXScreenOrientationScopedModuleDelegate

- (void)screenOrientationModule:(id)scopedOrientationModule
didChangeSupportedInterfaceOrientations:(UIInterfaceOrientationMask)supportedInterfaceOrientations;

@end

@interface ABI30_0_0EXScreenOrientation : ABI30_0_0EXScopedBridgeModule

@end
