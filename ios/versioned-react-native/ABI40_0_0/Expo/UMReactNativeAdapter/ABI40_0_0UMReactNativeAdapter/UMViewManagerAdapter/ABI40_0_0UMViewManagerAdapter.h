// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI40_0_0React/ABI40_0_0RCTViewManager.h>
#import <ABI40_0_0UMCore/ABI40_0_0UMViewManager.h>
#import <ABI40_0_0UMReactNativeAdapter/ABI40_0_0UMBridgeModule.h>

// ABI40_0_0UMViewManagerAdapter is an ABI40_0_0RN wrapper around ABI40_0_0UMCore's ABI40_0_0UMViewManager.
// For each exported view manager is it subclassed so that ABI40_0_0React Native
// can get proper module name (which is returned by a class method).
//
// Instead of instantiating the subclass by yourself,
// use ABI40_0_0UMViewManagerAdapterClassesRegistry's
// viewManagerAdapterClassForViewManager:.

@interface ABI40_0_0UMViewManagerAdapter : ABI40_0_0RCTViewManager

- (instancetype)initWithViewManager:(ABI40_0_0UMViewManager *)viewManager;

@end
