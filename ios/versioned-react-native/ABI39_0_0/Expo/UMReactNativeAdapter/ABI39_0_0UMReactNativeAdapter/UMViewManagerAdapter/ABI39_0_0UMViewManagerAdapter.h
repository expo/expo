// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI39_0_0React/ABI39_0_0RCTViewManager.h>
#import <ABI39_0_0UMCore/ABI39_0_0UMViewManager.h>
#import <ABI39_0_0UMReactNativeAdapter/ABI39_0_0UMBridgeModule.h>

// ABI39_0_0UMViewManagerAdapter is an ABI39_0_0RN wrapper around ABI39_0_0UMCore's ABI39_0_0UMViewManager.
// For each exported view manager is it subclassed so that ABI39_0_0React Native
// can get proper module name (which is returned by a class method).
//
// Instead of instantiating the subclass by yourself,
// use ABI39_0_0UMViewManagerAdapterClassesRegistry's
// viewManagerAdapterClassForViewManager:.

@interface ABI39_0_0UMViewManagerAdapter : ABI39_0_0RCTViewManager

- (instancetype)initWithViewManager:(ABI39_0_0UMViewManager *)viewManager;

@end
