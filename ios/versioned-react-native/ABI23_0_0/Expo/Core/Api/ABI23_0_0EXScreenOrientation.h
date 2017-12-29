// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI23_0_0EXScopedBridgeModule.h"

@protocol ABI23_0_0EXScreenOrientationScopedModuleDelegate

- (void)screenOrientationModule:(id)scopedOrientationModule
didChangeSupportedInterfaceOrientations:(UIInterfaceOrientationMask)supportedInterfaceOrientations;

@end

@interface ABI23_0_0EXScreenOrientation : ABI23_0_0EXScopedBridgeModule

@end
