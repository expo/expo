// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI25_0_0EXScopedBridgeModule.h"

@protocol ABI25_0_0EXScreenOrientationScopedModuleDelegate

- (void)screenOrientationModule:(id)scopedOrientationModule
didChangeSupportedInterfaceOrientations:(UIInterfaceOrientationMask)supportedInterfaceOrientations;

@end

@interface ABI25_0_0EXScreenOrientation : ABI25_0_0EXScopedBridgeModule

@end
