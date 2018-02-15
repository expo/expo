// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI26_0_0EXScopedBridgeModule.h"

@protocol ABI26_0_0EXScreenOrientationScopedModuleDelegate

- (void)screenOrientationModule:(id)scopedOrientationModule
didChangeSupportedInterfaceOrientations:(UIInterfaceOrientationMask)supportedInterfaceOrientations;

@end

@interface ABI26_0_0EXScreenOrientation : ABI26_0_0EXScopedBridgeModule

@end
