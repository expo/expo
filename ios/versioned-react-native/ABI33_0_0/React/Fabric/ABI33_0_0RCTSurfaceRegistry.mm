/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI33_0_0RCTSurfaceRegistry.h"

#import <mutex>

#import <ReactABI33_0_0/ABI33_0_0RCTFabricSurface.h>

@implementation ABI33_0_0RCTSurfaceRegistry {
  std::mutex _mutex;
  NSMapTable<id, ABI33_0_0RCTFabricSurface *> *_registry;
}

- (instancetype)init
{
  if (self = [super init]) {
    _registry = [NSMapTable mapTableWithKeyOptions:NSPointerFunctionsIntegerPersonality | NSPointerFunctionsOpaqueMemory
                                      valueOptions:NSPointerFunctionsObjectPersonality | NSPointerFunctionsWeakMemory];
  }

  return self;
}

- (NSEnumerator<ABI33_0_0RCTFabricSurface *> *)enumerator
{
  std::lock_guard<std::mutex> lock(_mutex);

  return [_registry objectEnumerator];
}

- (void)registerSurface:(ABI33_0_0RCTFabricSurface *)surface
{
  std::lock_guard<std::mutex> lock(_mutex);

  ReactABI33_0_0Tag rootTag = surface.rootViewTag.integerValue;
  [_registry setObject:surface forKey:(__bridge id)(void *)rootTag];
}

- (void)unregisterSurface:(ABI33_0_0RCTFabricSurface *)surface
{
  std::lock_guard<std::mutex> lock(_mutex);

  ReactABI33_0_0Tag rootTag = surface.rootViewTag.integerValue;
  [_registry removeObjectForKey:(__bridge id)(void *)rootTag];
}

- (ABI33_0_0RCTFabricSurface *)surfaceForRootTag:(ReactABI33_0_0Tag)rootTag
{
  std::lock_guard<std::mutex> lock(_mutex);

  return [_registry objectForKey:(__bridge id)(void *)rootTag];
}

@end
