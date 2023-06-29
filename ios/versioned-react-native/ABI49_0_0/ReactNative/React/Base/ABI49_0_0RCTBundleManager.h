/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@class ABI49_0_0RCTBridge;

typedef NSURL * (^ABI49_0_0RCTBridgelessBundleURLGetter)(void);
typedef void (^ABI49_0_0RCTBridgelessBundleURLSetter)(NSURL *bundleURL);

/**
 * A class that allows NativeModules/TurboModules to read/write the bundleURL, with or without the bridge.
 */
@interface ABI49_0_0RCTBundleManager : NSObject
- (void)setBridge:(ABI49_0_0RCTBridge *)bridge;
- (void)setBridgelessBundleURLGetter:(ABI49_0_0RCTBridgelessBundleURLGetter)getter
                           andSetter:(ABI49_0_0RCTBridgelessBundleURLSetter)setter
                    andDefaultGetter:(ABI49_0_0RCTBridgelessBundleURLGetter)defaultGetter;
- (void)resetBundleURL;
@property NSURL *bundleURL;
@end
