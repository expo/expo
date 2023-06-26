/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI49_0_0RCTBridge.h"
#import "ABI49_0_0RCTTurboModuleRegistry.h"

@class ABI49_0_0RCTBridgeModule;

@implementation ABI49_0_0RCTModuleRegistry {
  __weak id<ABI49_0_0RCTTurboModuleRegistry> _turboModuleRegistry;
  __weak ABI49_0_0RCTBridge *_bridge;
}

- (void)setBridge:(ABI49_0_0RCTBridge *)bridge
{
  _bridge = bridge;
}

- (void)setTurboModuleRegistry:(id<ABI49_0_0RCTTurboModuleRegistry>)turboModuleRegistry
{
  _turboModuleRegistry = turboModuleRegistry;
}

- (id)moduleForName:(const char *)moduleName
{
  return [self moduleForName:moduleName lazilyLoadIfNecessary:YES];
}

- (id)moduleForName:(const char *)moduleName lazilyLoadIfNecessary:(BOOL)lazilyLoad
{
  id<ABI49_0_0RCTBridgeModule> module = nil;

  ABI49_0_0RCTBridge *bridge = _bridge;
  if (bridge) {
    module = [bridge moduleForName:[NSString stringWithUTF8String:moduleName] lazilyLoadIfNecessary:lazilyLoad];
  }

  id<ABI49_0_0RCTTurboModuleRegistry> turboModuleRegistry = _turboModuleRegistry;
  if (module == nil && turboModuleRegistry && (lazilyLoad || [turboModuleRegistry moduleIsInitialized:moduleName])) {
    module = [turboModuleRegistry moduleForName:moduleName];
  }

  return module;
}

@end
