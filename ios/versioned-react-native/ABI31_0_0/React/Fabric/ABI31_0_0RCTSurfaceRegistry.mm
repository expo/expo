/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI31_0_0RCTSurfaceRegistry.h"

#import <mutex>

#import <ReactABI31_0_0/ABI31_0_0RCTFabricSurface.h>

@implementation ABI31_0_0RCTSurfaceRegistry {
  std::mutex _mutex;
  NSMapTable<id, ABI31_0_0RCTFabricSurface *> *_registry;
}

- (instancetype)init
{
  if (self = [super init]) {
    _registry = [NSMapTable mapTableWithKeyOptions:NSPointerFunctionsIntegerPersonality | NSPointerFunctionsOpaqueMemory
                                      valueOptions:NSPointerFunctionsObjectPersonality];
  }

  return self;
}

- (void)registerSurface:(ABI31_0_0RCTFabricSurface *)surface
{
  std::lock_guard<std::mutex> lock(_mutex);

  ReactABI31_0_0Tag rootTag = surface.rootViewTag.integerValue;
  [_registry setObject:surface forKey:(__bridge id)(void *)rootTag];
}

- (void)unregisterSurface:(ABI31_0_0RCTFabricSurface *)surface
{
  std::lock_guard<std::mutex> lock(_mutex);

  ReactABI31_0_0Tag rootTag = surface.rootViewTag.integerValue;
  [_registry removeObjectForKey:(__bridge id)(void *)rootTag];
}

- (ABI31_0_0RCTFabricSurface *)surfaceForRootTag:(ReactABI31_0_0Tag)rootTag
{
  std::lock_guard<std::mutex> lock(_mutex);

  return [_registry objectForKey:(__bridge id)(void *)rootTag];
}

@end
