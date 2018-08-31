// Copyright 2018-present 650 Industries. All rights reserved.

#import <ReactABI30_0_0/ABI30_0_0RCTViewManager.h>
#import <ABI30_0_0EXCore/ABI30_0_0EXViewManager.h>
#import <ABI30_0_0EXReactNativeAdapter/ABI30_0_0EXBridgeModule.h>
#import <ABI30_0_0EXReactNativeAdapter/ABI30_0_0EXNativeModulesProxy.h>

// ABI30_0_0EXViewManagerAdapter is an RN wrapper around ABI30_0_0EXCore's ABI30_0_0EXViewManager.
// For each exported view manager is it subclassed so that ReactABI30_0_0 Native
// can get proper module name (which is returned by a class method).
//
// Instead of instantiating the subclass by yourself,
// use ABI30_0_0EXViewManagerAdapterClassesRegistry's
// viewManagerAdapterClassForViewManager:.

@interface ABI30_0_0EXViewManagerAdapter : ABI30_0_0RCTViewManager

- (instancetype)initWithViewManager:(ABI30_0_0EXViewManager *)viewManager;

@end
