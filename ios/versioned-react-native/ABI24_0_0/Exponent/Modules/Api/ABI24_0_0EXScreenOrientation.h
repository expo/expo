// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI24_0_0EXScopedBridgeModule.h"

@protocol ABI24_0_0EXScreenOrientationScopedModuleDelegate

- (void)screenOrientationModule:(id)scopedOrientationModule
didChangeSupportedInterfaceOrientations:(UIInterfaceOrientationMask)supportedInterfaceOrientations;

@end

@interface ABI24_0_0EXScreenOrientation : ABI24_0_0EXScopedBridgeModule

@end
