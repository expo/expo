// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI32_0_0EXScopedBridgeModule.h"

@protocol ABI32_0_0EXScreenOrientationScopedModuleDelegate

- (void)screenOrientationModule:(id)scopedOrientationModule
didChangeSupportedInterfaceOrientations:(UIInterfaceOrientationMask)supportedInterfaceOrientations;

@end

@interface ABI32_0_0EXScreenOrientation : ABI32_0_0EXScopedBridgeModule

@end
