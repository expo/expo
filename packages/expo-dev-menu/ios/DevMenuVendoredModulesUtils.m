// Copyright 2015-present 650 Industries. All rights reserved.

#import "DevMenuVendoredModulesUtils.h"

#if __has_include("DevMenuREAModule.h")
#import "DevMenuREAModule.h"
#endif

#if __has_include("DevMenuRNGestureHandlerModule.h")
#import "DevMenuRNGestureHandlerModule.h"
#endif

@implementation DevMenuVendoredModulesUtils

+ (NSArray<id<RCTBridgeModule>>*)vendoredModules
{
  NSMutableArray<id<RCTBridgeModule>> *modules = [NSMutableArray new];
#if __has_include("DevMenuREAModule.h")
  [modules addObject:[DevMenuREAModule new]];
#endif
#if __has_include("DevMenuRNGestureHandlerModule.h")
  [modules addObject:[DevMenuRNGestureHandlerModule new]];
  [modules addObject:[DevMenuRNGestureHandlerButtonManager new]];
#endif
  return modules;
}

@end
