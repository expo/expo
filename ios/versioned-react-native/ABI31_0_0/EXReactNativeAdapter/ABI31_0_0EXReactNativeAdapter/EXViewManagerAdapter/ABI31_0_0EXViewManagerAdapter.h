// Copyright 2018-present 650 Industries. All rights reserved.

#import <ReactABI31_0_0/ABI31_0_0RCTViewManager.h>
#import <ABI31_0_0EXCore/ABI31_0_0EXViewManager.h>
#import <ABI31_0_0EXReactNativeAdapter/ABI31_0_0EXBridgeModule.h>
#import <ABI31_0_0EXReactNativeAdapter/ABI31_0_0EXNativeModulesProxy.h>

// ABI31_0_0EXViewManagerAdapter is an RN wrapper around ABI31_0_0EXCore's ABI31_0_0EXViewManager.
// For each exported view manager is it subclassed so that ReactABI31_0_0 Native
// can get proper module name (which is returned by a class method).
//
// Instead of instantiating the subclass by yourself,
// use ABI31_0_0EXViewManagerAdapterClassesRegistry's
// viewManagerAdapterClassForViewManager:.

@interface ABI31_0_0EXViewManagerAdapter : ABI31_0_0RCTViewManager

- (instancetype)initWithViewManager:(ABI31_0_0EXViewManager *)viewManager;

@end
