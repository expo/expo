/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@class ABI48_0_0RCTBridge;

typedef NSURL * (^ABI48_0_0RCTBridgelessBundleURLGetter)(void);
typedef void (^ABI48_0_0RCTBridgelessBundleURLSetter)(NSURL *bundleURL);

/**
 * A class that allows NativeModules/TurboModules to read/write the bundleURL, with or without the bridge.
 */
@interface ABI48_0_0RCTBundleManager : NSObject
- (void)setBridge:(ABI48_0_0RCTBridge *)bridge;
- (void)setBridgelessBundleURLGetter:(ABI48_0_0RCTBridgelessBundleURLGetter)getter
                           andSetter:(ABI48_0_0RCTBridgelessBundleURLSetter)setter
                    andDefaultGetter:(ABI48_0_0RCTBridgelessBundleURLGetter)defaultGetter;
- (void)resetBundleURL;
@property NSURL *bundleURL;
@end
