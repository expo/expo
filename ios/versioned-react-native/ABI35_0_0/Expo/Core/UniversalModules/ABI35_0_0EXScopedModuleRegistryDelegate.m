// Copyright © 2018 650 Industries. All rights reserved.

#import "ABI35_0_0EXScopedModuleRegistryDelegate.h"

@implementation ABI35_0_0EXScopedModuleRegistryDelegate

- (instancetype)initWithParams:(NSDictionary *)params
{
  return self = [super init];
}

- (id<ABI35_0_0UMInternalModule>)pickInternalModuleImplementingInterface:(Protocol *)interface fromAmongModules:(NSArray<id<ABI35_0_0UMInternalModule>> *)internalModules
{
  // In ExpoKit we know all the overlapping classes -- the only ones are added
  // in ABI35_0_0EXScopedModuleRegistryAdapter at the last moment before conflict resolution,
  // so they'll be at the end of the array.
  return [internalModules lastObject];
}

@end
