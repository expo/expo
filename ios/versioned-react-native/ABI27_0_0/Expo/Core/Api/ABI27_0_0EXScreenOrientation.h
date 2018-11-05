// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI27_0_0EXScopedBridgeModule.h"

@protocol ABI27_0_0EXScreenOrientationScopedModuleDelegate

- (void)screenOrientationModule:(id)scopedOrientationModule
didChangeSupportedInterfaceOrientations:(UIInterfaceOrientationMask)supportedInterfaceOrientations;

@end

@interface ABI27_0_0EXScreenOrientation : ABI27_0_0EXScopedBridgeModule

@end
