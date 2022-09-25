/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI46_0_0React/ABI46_0_0RCTSurfacePresenterStub.h>
#import <ABI46_0_0React/ABI46_0_0RCTUIManager.h>

#import "ABI46_0_0RCTBridge.h"
#import "ABI46_0_0RCTBridgeModule.h"

@implementation ABI46_0_0RCTViewRegistry {
  ABI46_0_0RCTBridgelessComponentViewProvider _bridgelessComponentViewProvider;
  __weak ABI46_0_0RCTBridge *_bridge;
}

- (void)setBridge:(ABI46_0_0RCTBridge *)bridge
{
  _bridge = bridge;
}

- (void)setBridgelessComponentViewProvider:(ABI46_0_0RCTBridgelessComponentViewProvider)bridgelessComponentViewProvider
{
  _bridgelessComponentViewProvider = bridgelessComponentViewProvider;
}

- (UIView *)viewForABI46_0_0ReactTag:(NSNumber *)ABI46_0_0ReactTag
{
  UIView *view = nil;

  ABI46_0_0RCTBridge *bridge = _bridge;
  if (bridge) {
    view = [bridge.uiManager viewForABI46_0_0ReactTag:ABI46_0_0ReactTag];
  }

  if (view == nil && _bridgelessComponentViewProvider) {
    view = _bridgelessComponentViewProvider(ABI46_0_0ReactTag);
  }

  return view;
}

- (void)addUIBlock:(ABI46_0_0RCTViewRegistryUIBlock)block
{
  if (!block) {
    return;
  }

  __weak __typeof(self) weakSelf = self;
  if (_bridge) {
    [_bridge.uiManager addUIBlock:^(ABI46_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
      __typeof(self) strongSelf = weakSelf;
      if (strongSelf) {
        block(strongSelf);
      }
    }];
  } else {
    ABI46_0_0RCTExecuteOnMainQueue(^{
      __typeof(self) strongSelf = weakSelf;
      if (strongSelf) {
        block(strongSelf);
      }
    });
  }
}

@end
