// Copyright 2018-present 650 Industries. All rights reserved.

#import <ReactABI35_0_0/ABI35_0_0RCTViewManager.h>
#import <ABI35_0_0UMCore/ABI35_0_0UMViewManager.h>
#import <ABI35_0_0UMReactNativeAdapter/ABI35_0_0UMBridgeModule.h>
#import <ABI35_0_0UMReactNativeAdapter/ABI35_0_0UMNativeModulesProxy.h>

// ABI35_0_0UMViewManagerAdapter is an RN wrapper around ABI35_0_0UMCore's ABI35_0_0UMViewManager.
// For each exported view manager is it subclassed so that ReactABI35_0_0 Native
// can get proper module name (which is returned by a class method).
//
// Instead of instantiating the subclass by yourself,
// use ABI35_0_0UMViewManagerAdapterClassesRegistry's
// viewManagerAdapterClassForViewManager:.

@interface ABI35_0_0UMViewManagerAdapter : ABI35_0_0RCTViewManager

- (instancetype)initWithViewManager:(ABI35_0_0UMViewManager *)viewManager;

@end
