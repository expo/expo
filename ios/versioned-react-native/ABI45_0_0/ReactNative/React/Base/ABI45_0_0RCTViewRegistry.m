/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI45_0_0React/ABI45_0_0RCTSurfacePresenterStub.h>
#import <ABI45_0_0React/ABI45_0_0RCTUIManager.h>

#import "ABI45_0_0RCTBridge.h"
#import "ABI45_0_0RCTBridgeModule.h"

@implementation ABI45_0_0RCTViewRegistry {
  ABI45_0_0RCTBridgelessComponentViewProvider _bridgelessComponentViewProvider;
  __weak ABI45_0_0RCTBridge *_bridge;
}

- (void)setBridge:(ABI45_0_0RCTBridge *)bridge
{
  _bridge = bridge;
}

- (void)setBridgelessComponentViewProvider:(ABI45_0_0RCTBridgelessComponentViewProvider)bridgelessComponentViewProvider
{
  _bridgelessComponentViewProvider = bridgelessComponentViewProvider;
}

- (UIView *)viewForABI45_0_0ReactTag:(NSNumber *)ABI45_0_0ReactTag
{
  UIView *view = nil;

  ABI45_0_0RCTBridge *bridge = _bridge;
  if (bridge) {
    view = [bridge.uiManager viewForABI45_0_0ReactTag:ABI45_0_0ReactTag];
  }

  if (view == nil && _bridgelessComponentViewProvider) {
    view = _bridgelessComponentViewProvider(ABI45_0_0ReactTag);
  }

  return view;
}

@end
