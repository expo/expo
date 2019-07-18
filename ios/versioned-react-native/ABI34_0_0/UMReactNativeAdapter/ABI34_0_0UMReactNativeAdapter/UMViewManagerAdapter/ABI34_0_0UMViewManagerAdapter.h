// Copyright 2018-present 650 Industries. All rights reserved.

#import <ReactABI34_0_0/ABI34_0_0RCTViewManager.h>
#import <ABI34_0_0UMCore/ABI34_0_0UMViewManager.h>
#import <ABI34_0_0UMReactNativeAdapter/ABI34_0_0UMBridgeModule.h>
#import <ABI34_0_0UMReactNativeAdapter/ABI34_0_0UMNativeModulesProxy.h>

// ABI34_0_0UMViewManagerAdapter is an RN wrapper around ABI34_0_0UMCore's ABI34_0_0UMViewManager.
// For each exported view manager is it subclassed so that ReactABI34_0_0 Native
// can get proper module name (which is returned by a class method).
//
// Instead of instantiating the subclass by yourself,
// use ABI34_0_0UMViewManagerAdapterClassesRegistry's
// viewManagerAdapterClassForViewManager:.

@interface ABI34_0_0UMViewManagerAdapter : ABI34_0_0RCTViewManager

- (instancetype)initWithViewManager:(ABI34_0_0UMViewManager *)viewManager;

@end
