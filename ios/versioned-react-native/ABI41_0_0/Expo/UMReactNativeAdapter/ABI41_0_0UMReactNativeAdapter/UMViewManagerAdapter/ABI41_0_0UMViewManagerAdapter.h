// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI41_0_0React/ABI41_0_0RCTViewManager.h>
#import <ABI41_0_0UMCore/ABI41_0_0UMViewManager.h>
#import <ABI41_0_0UMReactNativeAdapter/ABI41_0_0UMBridgeModule.h>

// ABI41_0_0UMViewManagerAdapter is an RN wrapper around ABI41_0_0UMCore's ABI41_0_0UMViewManager.
// For each exported view manager is it subclassed so that ABI41_0_0React Native
// can get proper module name (which is returned by a class method).
//
// Instead of instantiating the subclass by yourself,
// use ABI41_0_0UMViewManagerAdapterClassesRegistry's
// viewManagerAdapterClassForViewManager:.

@interface ABI41_0_0UMViewManagerAdapter : ABI41_0_0RCTViewManager

- (instancetype)initWithViewManager:(ABI41_0_0UMViewManager *)viewManager;

@end
