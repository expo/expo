// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI44_0_0React/ABI44_0_0RCTViewManager.h>

#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXViewManager.h>

// ABI44_0_0EXViewManagerAdapter is an RN wrapper around ExpoModulesCore's ABI44_0_0EXViewManager.
// For each exported view manager is it subclassed so that ABI44_0_0React Native
// can get proper module name (which is returned by a class method).
//
// Instead of instantiating the subclass by yourself,
// use ABI44_0_0EXViewManagerAdapterClassesRegistry's
// viewManagerAdapterClassForViewManager:.

@interface ABI44_0_0EXViewManagerAdapter : ABI44_0_0RCTViewManager

@end
