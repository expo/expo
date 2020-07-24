// Copyright 2018-present 650 Industries. All rights reserved.

#import <React/RCTViewManager.h>
#import <EDUMViewManager.h>
#import <EDUMBridgeModule.h>
#import <EDUMNativeModulesProxy.h>

// EDUMViewManagerAdapter is an RN wrapper around EDUMCore's EDUMViewManager.
// For each exported view manager is it subclassed so that React Native
// can get proper module name (which is returned by a class method).
//
// Instead of instantiating the subclass by yourself,
// use EDUMViewManagerAdapterClassesRegistry's
// viewManagerAdapterClassForViewManager:.

@interface EDUMViewManagerAdapter : RCTViewManager

- (instancetype)initWithViewManager:(EDUMViewManager *)viewManager;

@end
