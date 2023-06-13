/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI47_0_0React/ABI47_0_0RCTSurfacePresenterStub.h>
#import <ABI47_0_0React/ABI47_0_0RCTUIManager.h>

#import "ABI47_0_0RCTBridge.h"
#import "ABI47_0_0RCTBridgeModule.h"

@implementation ABI47_0_0RCTViewRegistry {
  ABI47_0_0RCTBridgelessComponentViewProvider _bridgelessComponentViewProvider;
  __weak ABI47_0_0RCTBridge *_bridge;
}

- (void)setBridge:(ABI47_0_0RCTBridge *)bridge
{
  _bridge = bridge;
}

- (void)setBridgelessComponentViewProvider:(ABI47_0_0RCTBridgelessComponentViewProvider)bridgelessComponentViewProvider
{
  _bridgelessComponentViewProvider = bridgelessComponentViewProvider;
}

- (UIView *)viewForABI47_0_0ReactTag:(NSNumber *)ABI47_0_0ReactTag
{
  UIView *view = nil;

  ABI47_0_0RCTBridge *bridge = _bridge;
  if (bridge) {
    view = [bridge.uiManager viewForABI47_0_0ReactTag:ABI47_0_0ReactTag];
  }

  if (view == nil && _bridgelessComponentViewProvider) {
    view = _bridgelessComponentViewProvider(ABI47_0_0ReactTag);
  }

  return view;
}

- (void)addUIBlock:(ABI47_0_0RCTViewRegistryUIBlock)block
{
  if (!block) {
    return;
  }

  __weak __typeof(self) weakSelf = self;
  if (_bridge) {
    [_bridge.uiManager addUIBlock:^(ABI47_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
      __typeof(self) strongSelf = weakSelf;
      if (strongSelf) {
        block(strongSelf);
      }
    }];
  } else {
    ABI47_0_0RCTExecuteOnMainQueue(^{
      __typeof(self) strongSelf = weakSelf;
      if (strongSelf) {
        block(strongSelf);
      }
    });
  }
}

@end
