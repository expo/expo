// Copyright 2015-present 650 Industries. All rights reserved.

#import "DevMenuVendoredModulesUtils.h"

#import <React/RCTBridge+Private.h>

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Weverything"

#if __has_include("DevMenuRNCSafeAreaProviderManager.h")
#import "DevMenuRNCSafeAreaProviderManager.h"
#endif

#if __has_include("DevMenuRNCSafeAreaViewManager.h")
#import "DevMenuRNCSafeAreaViewManager.h"
#endif

#pragma clang diagnostic pop

@implementation DevMenuVendoredModulesUtils

+ (NSArray<id<RCTBridgeModule>>*)vendoredModules:(RCTBridge *)bridge
{
  NSMutableArray<id<RCTBridgeModule>> *modules = [NSMutableArray new];
#if __has_include("DevMenuRNCSafeAreaProviderManager.h")
  [modules addObject:[DevMenuRNCSafeAreaProviderManager new]];
  [modules addObject:[DevMenuRNCSafeAreaViewManager new]];
#endif
  return modules;
}

@end
