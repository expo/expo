// Copyright 2015-present 650 Industries. All rights reserved.

#import "DevMenuVendoredModulesUtils.h"

#import <React/RCTBridge+Private.h>

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Weverything"

#if __has_include("DevMenuREAModule.h")
#import "DevMenuREAModule.h"
#import "DevMenuREAEventDispatcher.h"
#import "DevMenuREAUIManager.h"
#endif

#if __has_include("DevMenuRNGestureHandlerModule.h")
#import "DevMenuRNGestureHandlerModule.h"
#endif

#if __has_include("DevMenuRNCSafeAreaProviderManager.h")
#import "DevMenuRNCSafeAreaProviderManager.h"
#endif

#if __has_include("DevMenuRNCSafeAreaViewManager.h")
#import "DevMenuRNCSafeAreaViewManager.h"
#endif

#pragma clang diagnostic pop

@implementation DevMenuVendoredModulesUtils

+ (NSArray<id<RCTBridgeModule>>*)vendoredModules:(RCTBridge *)bridge addReanimated2:(BOOL)addReanimated2
{
  NSMutableArray<id<RCTBridgeModule>> *modules = [NSMutableArray new];
#if __has_include("DevMenuREAModule.h")
  if (addReanimated2) {
    // Creates a `DevMenuREAEventDispatcher`
    // It was moved from the `REAJSIExecutorRuntimeInstaller` function
    [modules addObject:[DevMenuREAEventDispatcher new]];

    [modules addObject:[DevMenuREAModule new]];
  }
#endif
#if __has_include("DevMenuRNGestureHandlerModule.h")
  [modules addObject:[DevMenuRNGestureHandlerModule new]];
  [modules addObject:[DevMenuRNGestureHandlerButtonManager new]];
#endif
#if __has_include("DevMenuRNCSafeAreaProviderManager.h")
  [modules addObject:[DevMenuRNCSafeAreaProviderManager new]];
  [modules addObject:[DevMenuRNCSafeAreaViewManager new]];
#endif
  
  return modules;
}

@end
