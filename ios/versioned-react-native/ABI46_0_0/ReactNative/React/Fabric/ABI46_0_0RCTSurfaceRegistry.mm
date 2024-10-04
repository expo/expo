/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI46_0_0RCTSurfaceRegistry.h"

#import <butter/mutex.h>
#import <mutex>
#import <shared_mutex>

#import <ABI46_0_0React/ABI46_0_0RCTFabricSurface.h>

using namespace ABI46_0_0facebook;

@implementation ABI46_0_0RCTSurfaceRegistry {
  butter::shared_mutex _mutex;
  NSMapTable<id, ABI46_0_0RCTFabricSurface *> *_registry;
}

- (instancetype)init
{
  if (self = [super init]) {
    _registry = [NSMapTable mapTableWithKeyOptions:NSPointerFunctionsIntegerPersonality | NSPointerFunctionsOpaqueMemory
                                      valueOptions:NSPointerFunctionsObjectPersonality | NSPointerFunctionsWeakMemory];
  }

  return self;
}

- (void)enumerateWithBlock:(ABI46_0_0RCTSurfaceEnumeratorBlock)block
{
  std::shared_lock<butter::shared_mutex> lock(_mutex);
  block([_registry objectEnumerator]);
}

- (void)registerSurface:(ABI46_0_0RCTFabricSurface *)surface
{
  std::unique_lock<butter::shared_mutex> lock(_mutex);

  ABI46_0_0ReactTag rootTag = surface.rootViewTag.integerValue;
  [_registry setObject:surface forKey:(__bridge id)(void *)rootTag];
}

- (void)unregisterSurface:(ABI46_0_0RCTFabricSurface *)surface
{
  std::unique_lock<butter::shared_mutex> lock(_mutex);

  ABI46_0_0ReactTag rootTag = surface.rootViewTag.integerValue;
  [_registry removeObjectForKey:(__bridge id)(void *)rootTag];
}

- (ABI46_0_0RCTFabricSurface *)surfaceForRootTag:(ABI46_0_0ReactTag)rootTag
{
  std::shared_lock<butter::shared_mutex> lock(_mutex);

  return [_registry objectForKey:(__bridge id)(void *)rootTag];
}

@end
