/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI49_0_0RCTSurfaceRegistry.h"

#import <mutex>
#import <shared_mutex>

#import <ABI49_0_0React/ABI49_0_0RCTFabricSurface.h>

using namespace ABI49_0_0facebook;

@implementation ABI49_0_0RCTSurfaceRegistry {
  std::shared_mutex _mutex;
  NSMapTable<id, ABI49_0_0RCTFabricSurface *> *_registry;
}

- (instancetype)init
{
  if (self = [super init]) {
    _registry = [NSMapTable mapTableWithKeyOptions:NSPointerFunctionsIntegerPersonality | NSPointerFunctionsOpaqueMemory
                                      valueOptions:NSPointerFunctionsObjectPersonality | NSPointerFunctionsWeakMemory];
  }

  return self;
}

- (void)enumerateWithBlock:(ABI49_0_0RCTSurfaceEnumeratorBlock)block
{
  std::shared_lock lock(_mutex);
  block([_registry objectEnumerator]);
}

- (void)registerSurface:(ABI49_0_0RCTFabricSurface *)surface
{
  std::unique_lock lock(_mutex);

  ABI49_0_0ReactTag rootTag = surface.rootViewTag.integerValue;
  [_registry setObject:surface forKey:(__bridge id)(void *)rootTag];
}

- (void)unregisterSurface:(ABI49_0_0RCTFabricSurface *)surface
{
  std::unique_lock lock(_mutex);

  ABI49_0_0ReactTag rootTag = surface.rootViewTag.integerValue;
  [_registry removeObjectForKey:(__bridge id)(void *)rootTag];
}

- (ABI49_0_0RCTFabricSurface *)surfaceForRootTag:(ABI49_0_0ReactTag)rootTag
{
  std::shared_lock lock(_mutex);

  return [_registry objectForKey:(__bridge id)(void *)rootTag];
}

@end
