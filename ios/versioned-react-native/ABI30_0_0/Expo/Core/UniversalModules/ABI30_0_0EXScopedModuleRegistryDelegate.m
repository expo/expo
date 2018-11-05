// Copyright © 2018 650 Industries. All rights reserved.

#import "ABI30_0_0EXScopedModuleRegistryDelegate.h"

@implementation ABI30_0_0EXScopedModuleRegistryDelegate

- (instancetype)initWithParams:(NSDictionary *)params
{
  return self = [super init];
}

- (id<ABI30_0_0EXInternalModule>)pickInternalModuleImplementingInterface:(Protocol *)interface fromAmongModules:(NSArray<id<ABI30_0_0EXInternalModule>> *)internalModules
{
  // In ExpoKit we know all the overlapping classes -- the only ones are added
  // in ABI30_0_0EXScopedModuleRegistryAdapter at the last moment before conflict resolution,
  // so they'll be at the end of the array.
  return [internalModules lastObject];
}

@end
