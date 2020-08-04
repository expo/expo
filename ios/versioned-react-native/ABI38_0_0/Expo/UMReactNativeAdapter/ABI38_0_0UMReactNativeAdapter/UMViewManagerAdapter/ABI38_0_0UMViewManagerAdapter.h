// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI38_0_0React/ABI38_0_0RCTViewManager.h>
#import <ABI38_0_0UMCore/ABI38_0_0UMViewManager.h>
#import <ABI38_0_0UMReactNativeAdapter/ABI38_0_0UMBridgeModule.h>
#import <ABI38_0_0UMReactNativeAdapter/ABI38_0_0UMNativeModulesProxy.h>

// ABI38_0_0UMViewManagerAdapter is an ABI38_0_0RN wrapper around ABI38_0_0UMCore's ABI38_0_0UMViewManager.
// For each exported view manager is it subclassed so that ABI38_0_0React Native
// can get proper module name (which is returned by a class method).
//
// Instead of instantiating the subclass by yourself,
// use ABI38_0_0UMViewManagerAdapterClassesRegistry's
// viewManagerAdapterClassForViewManager:.

@interface ABI38_0_0UMViewManagerAdapter : ABI38_0_0RCTViewManager

- (instancetype)initWithViewManager:(ABI38_0_0UMViewManager *)viewManager;

@end
