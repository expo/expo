// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI42_0_0React/ABI42_0_0RCTViewManager.h>
#import <ABI42_0_0UMCore/ABI42_0_0UMViewManager.h>
#import <ABI42_0_0UMReactNativeAdapter/ABI42_0_0UMBridgeModule.h>

// ABI42_0_0UMViewManagerAdapter is an ABI42_0_0RN wrapper around ABI42_0_0UMCore's ABI42_0_0UMViewManager.
// For each exported view manager is it subclassed so that ABI42_0_0React Native
// can get proper module name (which is returned by a class method).
//
// Instead of instantiating the subclass by yourself,
// use ABI42_0_0UMViewManagerAdapterClassesRegistry's
// viewManagerAdapterClassForViewManager:.

@interface ABI42_0_0UMViewManagerAdapter : ABI42_0_0RCTViewManager

- (instancetype)initWithViewManager:(ABI42_0_0UMViewManager *)viewManager;

@end
