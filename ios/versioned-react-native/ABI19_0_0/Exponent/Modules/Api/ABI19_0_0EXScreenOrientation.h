// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI19_0_0EXScopedBridgeModule.h"

@protocol ABI19_0_0EXScreenOrientationScopedModuleDelegate

- (void)screenOrientationModule:(id)scopedOrientationModule
didChangeSupportedInterfaceOrientations:(UIInterfaceOrientationMask)supportedInterfaceOrientations;

@end

@interface ABI19_0_0EXScreenOrientation : ABI19_0_0EXScopedBridgeModule

@end
