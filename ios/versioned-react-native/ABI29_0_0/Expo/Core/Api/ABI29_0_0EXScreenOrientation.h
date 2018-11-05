// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI29_0_0EXScopedBridgeModule.h"

@protocol ABI29_0_0EXScreenOrientationScopedModuleDelegate

- (void)screenOrientationModule:(id)scopedOrientationModule
didChangeSupportedInterfaceOrientations:(UIInterfaceOrientationMask)supportedInterfaceOrientations;

@end

@interface ABI29_0_0EXScreenOrientation : ABI29_0_0EXScopedBridgeModule

@end
