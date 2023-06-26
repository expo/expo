/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI49_0_0RCTRuntimeExecutorFromBridge.h"
#import <ABI49_0_0React/ABI49_0_0RCTAssert.h>
#import <ABI49_0_0React/ABI49_0_0RCTBridge+Private.h>
#import <ABI49_0_0cxxreact/ABI49_0_0MessageQueueThread.h>
#import <ABI49_0_0React/utils/ABI49_0_0ManagedObjectWrapper.h>

using namespace ABI49_0_0facebook::ABI49_0_0React;

@interface ABI49_0_0RCTBridge ()
- (std::shared_ptr<MessageQueueThread>)jsMessageThread;
- (void)invokeAsync:(std::function<void()> &&)func;
@end

RuntimeExecutor ABI49_0_0RCTRuntimeExecutorFromBridge(ABI49_0_0RCTBridge *bridge)
{
  ABI49_0_0RCTAssert(bridge, @"ABI49_0_0RCTRuntimeExecutorFromBridge: Bridge must not be nil.");

  auto bridgeWeakWrapper = wrapManagedObjectWeakly([bridge batchedBridge] ?: bridge);

  RuntimeExecutor runtimeExecutor = [bridgeWeakWrapper](
                                        std::function<void(ABI49_0_0facebook::jsi::Runtime & runtime)> &&callback) {
    ABI49_0_0RCTBridge *bridge = unwrapManagedObjectWeakly(bridgeWeakWrapper);

    ABI49_0_0RCTAssert(bridge, @"ABI49_0_0RCTRuntimeExecutorFromBridge: Bridge must not be nil at the moment of scheduling a call.");

    [bridge invokeAsync:[bridgeWeakWrapper, callback = std::move(callback)]() {
      ABI49_0_0RCTCxxBridge *batchedBridge = (ABI49_0_0RCTCxxBridge *)unwrapManagedObjectWeakly(bridgeWeakWrapper);

      ABI49_0_0RCTAssert(batchedBridge, @"ABI49_0_0RCTRuntimeExecutorFromBridge: Bridge must not be nil at the moment of invocation.");

      if (!batchedBridge) {
        return;
      }

      auto runtime = (ABI49_0_0facebook::jsi::Runtime *)(batchedBridge.runtime);

      ABI49_0_0RCTAssert(
          runtime, @"ABI49_0_0RCTRuntimeExecutorFromBridge: Bridge must have a valid jsi::Runtime at the moment of invocation.");

      if (!runtime) {
        return;
      }

      callback(*runtime);
    }];
  };

  return runtimeExecutor;
}
