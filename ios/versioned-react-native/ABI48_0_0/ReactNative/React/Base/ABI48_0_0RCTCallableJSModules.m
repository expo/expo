/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI48_0_0RCTBridge.h"
#import "ABI48_0_0RCTBridgeModule.h"

@implementation ABI48_0_0RCTCallableJSModules {
  ABI48_0_0RCTBridgelessJSModuleMethodInvoker _bridgelessJSModuleMethodInvoker;
  __weak ABI48_0_0RCTBridge *_bridge;
}

- (void)setBridge:(ABI48_0_0RCTBridge *)bridge
{
  _bridge = bridge;
}

- (void)setBridgelessJSModuleMethodInvoker:(ABI48_0_0RCTBridgelessJSModuleMethodInvoker)bridgelessJSModuleMethodInvoker
{
  _bridgelessJSModuleMethodInvoker = bridgelessJSModuleMethodInvoker;
}

- (void)invokeModule:(NSString *)moduleName method:(NSString *)methodName withArgs:(NSArray *)args
{
  [self invokeModule:moduleName method:methodName withArgs:args onComplete:NULL];
}

- (void)invokeModule:(NSString *)moduleName
              method:(NSString *)methodName
            withArgs:(NSArray *)args
          onComplete:(dispatch_block_t)onComplete
{
  ABI48_0_0RCTBridge *bridge = _bridge;
  if (bridge) {
    [bridge enqueueJSCall:moduleName method:methodName args:args completion:onComplete];
    return;
  }

  if (_bridgelessJSModuleMethodInvoker) {
    _bridgelessJSModuleMethodInvoker(moduleName, methodName, args, onComplete);
  }
}

@end
