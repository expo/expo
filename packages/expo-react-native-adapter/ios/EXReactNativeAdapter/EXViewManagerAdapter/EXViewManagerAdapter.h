// Copyright 2018-present 650 Industries. All rights reserved.

#import <React/RCTViewManager.h>
#import <EXCore/EXViewManager.h>
#import <EXReactNativeAdapter/EXBridgeModule.h>
#import <EXReactNativeAdapter/EXNativeModulesProxy.h>

// EXViewManagerAdapter is an RN wrapper around EXCore's EXViewManager.
// For each exported view manager is it subclassed so that React Native
// can get proper module name (which is returned by a class method).
//
// Instead of instantiating the subclass by yourself,
// use EXViewManagerAdapterClassesRegistry's
// viewManagerAdapterClassForViewManager:.

@interface EXViewManagerAdapter : RCTViewManager

- (instancetype)initWithViewManager:(EXViewManager *)viewManager;

@end
