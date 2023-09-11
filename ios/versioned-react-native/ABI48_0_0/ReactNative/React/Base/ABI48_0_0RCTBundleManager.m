/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI48_0_0RCTBundleManager.h"
#import "ABI48_0_0RCTAssert.h"
#import "ABI48_0_0RCTBridge+Private.h"
#import "ABI48_0_0RCTBridge.h"

@implementation ABI48_0_0RCTBundleManager {
  __weak ABI48_0_0RCTBridge *_bridge;
  ABI48_0_0RCTBridgelessBundleURLGetter _bridgelessBundleURLGetter;
  ABI48_0_0RCTBridgelessBundleURLSetter _bridgelessBundleURLSetter;
  ABI48_0_0RCTBridgelessBundleURLGetter _bridgelessBundleURLDefaultGetter;
}

- (void)setBridge:(ABI48_0_0RCTBridge *)bridge
{
  _bridge = bridge;
}

- (void)setBridgelessBundleURLGetter:(ABI48_0_0RCTBridgelessBundleURLGetter)getter
                           andSetter:(ABI48_0_0RCTBridgelessBundleURLSetter)setter
                    andDefaultGetter:(ABI48_0_0RCTBridgelessBundleURLGetter)defaultGetter
{
  _bridgelessBundleURLGetter = getter;
  _bridgelessBundleURLSetter = setter;
  _bridgelessBundleURLDefaultGetter = defaultGetter;
}

- (void)setBundleURL:(NSURL *)bundleURL
{
  if (_bridge) {
    _bridge.bundleURL = bundleURL;
    return;
  }

  ABI48_0_0RCTAssert(
      _bridgelessBundleURLSetter != nil,
      @"ABI48_0_0RCTBundleManager: In bridgeless mode, ABI48_0_0RCTBridgelessBundleURLSetter must not be nil.");
  _bridgelessBundleURLSetter(bundleURL);
}

- (NSURL *)bundleURL
{
  if (_bridge) {
    return _bridge.bundleURL;
  }

  ABI48_0_0RCTAssert(
      _bridgelessBundleURLGetter != nil,
      @"ABI48_0_0RCTBundleManager: In bridgeless mode, ABI48_0_0RCTBridgelessBundleURLGetter must not be nil.");

  return _bridgelessBundleURLGetter();
}

- (void)resetBundleURL
{
  ABI48_0_0RCTBridge *strongBridge = _bridge;
  if (strongBridge) {
    strongBridge.bundleURL = [strongBridge.delegate sourceURLForBridge:strongBridge];
    return;
  }

  ABI48_0_0RCTAssert(
      _bridgelessBundleURLDefaultGetter != nil,
      @"ABI48_0_0RCTBundleManager: In bridgeless mode, default ABI48_0_0RCTBridgelessBundleURLGetter must not be nil.");
  ABI48_0_0RCTAssert(
      _bridgelessBundleURLSetter != nil,
      @"ABI48_0_0RCTBundleManager: In bridgeless mode, ABI48_0_0RCTBridgelessBundleURLSetter must not be nil.");

  _bridgelessBundleURLSetter(_bridgelessBundleURLDefaultGetter());
}

@end
