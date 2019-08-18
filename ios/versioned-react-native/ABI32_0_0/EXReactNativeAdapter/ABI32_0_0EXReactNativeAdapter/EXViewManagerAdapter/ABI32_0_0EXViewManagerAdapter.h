// Copyright 2018-present 650 Industries. All rights reserved.

#import <ReactABI32_0_0/ABI32_0_0RCTViewManager.h>
#import <ABI32_0_0EXCore/ABI32_0_0EXViewManager.h>
#import <ABI32_0_0EXReactNativeAdapter/ABI32_0_0EXBridgeModule.h>
#import <ABI32_0_0EXReactNativeAdapter/ABI32_0_0EXNativeModulesProxy.h>

// ABI32_0_0EXViewManagerAdapter is an RN wrapper around ABI32_0_0EXCore's ABI32_0_0EXViewManager.
// For each exported view manager is it subclassed so that ReactABI32_0_0 Native
// can get proper module name (which is returned by a class method).
//
// Instead of instantiating the subclass by yourself,
// use ABI32_0_0EXViewManagerAdapterClassesRegistry's
// viewManagerAdapterClassForViewManager:.

@interface ABI32_0_0EXViewManagerAdapter : ABI32_0_0RCTViewManager

- (instancetype)initWithViewManager:(ABI32_0_0EXViewManager *)viewManager;

@end
