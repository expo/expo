/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI37_0_0RCTSurfaceRegistry.h"

#import <mutex>
#import <shared_mutex>
#import <better/mutex.h>

#import <ABI37_0_0React/ABI37_0_0RCTFabricSurface.h>

using namespace ABI37_0_0facebook;

@implementation ABI37_0_0RCTSurfaceRegistry {
  better::shared_mutex _mutex;
  NSMapTable<id, ABI37_0_0RCTFabricSurface *> *_registry;
}

- (instancetype)init
{
  if (self = [super init]) {
    _registry = [NSMapTable mapTableWithKeyOptions:NSPointerFunctionsIntegerPersonality | NSPointerFunctionsOpaqueMemory
                                      valueOptions:NSPointerFunctionsObjectPersonality | NSPointerFunctionsWeakMemory];
  }

  return self;
}

- (void)enumerateWithBlock:(ABI37_0_0RCTSurfaceEnumeratorBlock)block
{
  std::shared_lock<better::shared_mutex> lock(_mutex);
  block([_registry objectEnumerator]);
}

- (void)registerSurface:(ABI37_0_0RCTFabricSurface *)surface
{
  std::unique_lock<better::shared_mutex> lock(_mutex);

  ABI37_0_0ReactTag rootTag = surface.rootViewTag.integerValue;
  [_registry setObject:surface forKey:(__bridge id)(void *)rootTag];
}

- (void)unregisterSurface:(ABI37_0_0RCTFabricSurface *)surface
{
  std::unique_lock<better::shared_mutex> lock(_mutex);

  ABI37_0_0ReactTag rootTag = surface.rootViewTag.integerValue;
  [_registry removeObjectForKey:(__bridge id)(void *)rootTag];
}

- (ABI37_0_0RCTFabricSurface *)surfaceForRootTag:(ABI37_0_0ReactTag)rootTag
{
  std::shared_lock<better::shared_mutex> lock(_mutex);

  return [_registry objectForKey:(__bridge id)(void *)rootTag];
}

@end
