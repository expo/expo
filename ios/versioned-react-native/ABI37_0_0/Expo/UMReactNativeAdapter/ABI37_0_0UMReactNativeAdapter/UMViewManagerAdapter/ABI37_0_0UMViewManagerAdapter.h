// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI37_0_0React/ABI37_0_0RCTViewManager.h>
#import <ABI37_0_0UMCore/ABI37_0_0UMViewManager.h>
#import <ABI37_0_0UMReactNativeAdapter/ABI37_0_0UMBridgeModule.h>
#import <ABI37_0_0UMReactNativeAdapter/ABI37_0_0UMNativeModulesProxy.h>

// ABI37_0_0UMViewManagerAdapter is an ABI37_0_0RN wrapper around ABI37_0_0UMCore's ABI37_0_0UMViewManager.
// For each exported view manager is it subclassed so that ABI37_0_0React Native
// can get proper module name (which is returned by a class method).
//
// Instead of instantiating the subclass by yourself,
// use ABI37_0_0UMViewManagerAdapterClassesRegistry's
// viewManagerAdapterClassForViewManager:.

@interface ABI37_0_0UMViewManagerAdapter : ABI37_0_0RCTViewManager

- (instancetype)initWithViewManager:(ABI37_0_0UMViewManager *)viewManager;

@end
