// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI31_0_0EXScopedBridgeModule.h"

@protocol ABI31_0_0EXScreenOrientationScopedModuleDelegate

- (void)screenOrientationModule:(id)scopedOrientationModule
didChangeSupportedInterfaceOrientations:(UIInterfaceOrientationMask)supportedInterfaceOrientations;

@end

@interface ABI31_0_0EXScreenOrientation : ABI31_0_0EXScopedBridgeModule

@end
