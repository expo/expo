// Copyright 2018-present 650 Industries. All rights reserved.

#import <ReactABI29_0_0/ABI29_0_0RCTViewManager.h>
#import <ABI29_0_0EXCore/ABI29_0_0EXViewManager.h>
#import <ABI29_0_0EXReactNativeAdapter/ABI29_0_0EXBridgeModule.h>
#import <ABI29_0_0EXReactNativeAdapter/ABI29_0_0EXNativeModulesProxy.h>

// ABI29_0_0EXViewManagerAdapter is an RN wrapper around ABI29_0_0EXCore's ABI29_0_0EXViewManager.
// For each exported view manager is it subclassed so that ReactABI29_0_0 Native
// can get proper module name (which is returned by a class method).
//
// Instead of instantiating the subclass by yourself,
// use ABI29_0_0EXViewManagerAdapterClassesRegistry's
// viewManagerAdapterClassForViewManager:.

@interface ABI29_0_0EXViewManagerAdapter : ABI29_0_0RCTViewManager

- (instancetype)initWithViewManager:(ABI29_0_0EXViewManager *)viewManager;

@end
