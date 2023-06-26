/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI49_0_0React/ABI49_0_0RCTSurfacePresenterStub.h>
#import <ABI49_0_0React/ABI49_0_0RCTUIManager.h>

#import "ABI49_0_0RCTBridge.h"
#import "ABI49_0_0RCTBridgeModule.h"

@implementation ABI49_0_0RCTViewRegistry {
  ABI49_0_0RCTBridgelessComponentViewProvider _bridgelessComponentViewProvider;
  __weak ABI49_0_0RCTBridge *_bridge;
}

- (void)setBridge:(ABI49_0_0RCTBridge *)bridge
{
  _bridge = bridge;
}

- (void)setBridgelessComponentViewProvider:(ABI49_0_0RCTBridgelessComponentViewProvider)bridgelessComponentViewProvider
{
  _bridgelessComponentViewProvider = bridgelessComponentViewProvider;
}

- (UIView *)viewForABI49_0_0ReactTag:(NSNumber *)ABI49_0_0ReactTag
{
  UIView *view = nil;

  ABI49_0_0RCTBridge *bridge = _bridge;
  if (bridge) {
    view = [bridge.uiManager viewForABI49_0_0ReactTag:ABI49_0_0ReactTag];
  }

  if (view == nil && _bridgelessComponentViewProvider) {
    view = _bridgelessComponentViewProvider(ABI49_0_0ReactTag);
  }

  return view;
}

- (void)addUIBlock:(ABI49_0_0RCTViewRegistryUIBlock)block
{
  if (!block) {
    return;
  }

  __weak __typeof(self) weakSelf = self;
  if (_bridge) {
    [_bridge.uiManager addUIBlock:^(ABI49_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
      __typeof(self) strongSelf = weakSelf;
      if (strongSelf) {
        block(strongSelf);
      }
    }];
  } else {
    ABI49_0_0RCTExecuteOnMainQueue(^{
      __typeof(self) strongSelf = weakSelf;
      if (strongSelf) {
        block(strongSelf);
      }
    });
  }
}

@end
