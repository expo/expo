// Copyright 2018-present 650 Industries. All rights reserved.

#import <ReactABI33_0_0/ABI33_0_0RCTViewManager.h>
#import <ABI33_0_0UMCore/ABI33_0_0UMViewManager.h>
#import <ABI33_0_0UMReactNativeAdapter/ABI33_0_0UMBridgeModule.h>
#import <ABI33_0_0UMReactNativeAdapter/ABI33_0_0UMNativeModulesProxy.h>

// ABI33_0_0UMViewManagerAdapter is an RN wrapper around ABI33_0_0UMCore's ABI33_0_0UMViewManager.
// For each exported view manager is it subclassed so that ReactABI33_0_0 Native
// can get proper module name (which is returned by a class method).
//
// Instead of instantiating the subclass by yourself,
// use ABI33_0_0UMViewManagerAdapterClassesRegistry's
// viewManagerAdapterClassForViewManager:.

@interface ABI33_0_0UMViewManagerAdapter : ABI33_0_0RCTViewManager

- (instancetype)initWithViewManager:(ABI33_0_0UMViewManager *)viewManager;

@end
