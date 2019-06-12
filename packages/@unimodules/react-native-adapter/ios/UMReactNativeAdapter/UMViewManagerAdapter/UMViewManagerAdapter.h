// Copyright 2018-present 650 Industries. All rights reserved.

#import <React/RCTViewManager.h>
#import <UMCore/UMViewManager.h>
#import <UMReactNativeAdapter/UMBridgeModule.h>

// UMViewManagerAdapter is an RN wrapper around UMCore's UMViewManager.
// For each exported view manager is it subclassed so that React Native
// can get proper module name (which is returned by a class method).
//
// Instead of instantiating the subclass by yourself,
// use UMViewManagerAdapterClassesRegistry's
// viewManagerAdapterClassForViewManager:.

@interface UMViewManagerAdapter : RCTViewManager

- (instancetype)initWithViewManager:(UMViewManager *)viewManager;

@end
